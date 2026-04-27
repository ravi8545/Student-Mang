import mongoose from 'mongoose';

import Attendance from '../models/attendance.model.js';
import Student from '../models/student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getLocalDateString } from '../utils/date.js';

const SCAN_DEDUPE_MS = Number(process.env.SCAN_DEDUPE_MS || 4000);
const MIN_IN_TO_OUT_MS = Number(process.env.MIN_IN_TO_OUT_MS || 15000);
const MIN_OUT_TO_IN_MS = Number(process.env.MIN_OUT_TO_IN_MS || 20000);

function extractStudentId({ studentId, qrText }) {
	if (studentId) return String(studentId);
	if (!qrText) return null;

	// QR contains JSON: { "studentId": "..." }
	try {
		const parsed = JSON.parse(qrText);
		if (parsed && typeof parsed.studentId === 'string') return parsed.studentId;
	} catch {
		// If it's not JSON, treat the raw text as an id.
	}

	return String(qrText);
}

function ensureSessions(attendance) {
	if (!attendance) return;
	if (Array.isArray(attendance.sessions) && attendance.sessions.length) return;

	// Backward compatibility for older records:
	// build sessions from legacy top-level fields.
	if (attendance.inTime || attendance.outTime) {
		attendance.sessions = [
			{
				inTime: attendance.inTime || null,
				outTime: attendance.outTime || null,
			},
		];
	} else {
		attendance.sessions = [];
	}
}

function getLastSession(attendance) {
	ensureSessions(attendance);
	const sessions = attendance.sessions || [];
	return sessions.length ? sessions[sessions.length - 1] : null;
}

function getLastScanAt(attendance) {
	const last = getLastSession(attendance);
	return last?.outTime || last?.inTime || null;
}

function msToWaitMessage(ms) {
	const seconds = Math.ceil(ms / 1000);
	return seconds <= 1 ? '1 second' : `${seconds} seconds`;
}

// POST /api/attendance/scan (admin)
export const scanQrAndMarkAttendance = asyncHandler(async (req, res) => {
	const studentId = extractStudentId(req.body);
	if (!studentId || !mongoose.isValidObjectId(studentId)) {
		return res.status(400).json({ success: false, message: 'Invalid studentId in QR' });
	}

	const student = await Student.findById(studentId).select(
		'-password -faceDescriptor -faceLandmarks -faceImageDataUrl'
	);
	if (!student) {
		return res.status(404).json({ success: false, message: 'Student not found' });
	}

	const today = getLocalDateString();
	const now = new Date();

	let attendance = await Attendance.findOne({ studentId, date: today });

	// 1) No attendance exists for today → mark IN time
	if (!attendance) {
		attendance = await Attendance.create({
			studentId,
			date: today,
			sessions: [{ inTime: now, outTime: null }],
			// Mirror the latest session for backward compatibility.
			inTime: now,
			outTime: null,
		});

		return res.json({
			success: true,
			action: 'IN',
			student,
			attendance,
		});
	}

	ensureSessions(attendance);
	const lastSession = getLastSession(attendance);
	const lastScanAt = getLastScanAt(attendance);

	// Global rapid-scan dedupe (guards camera can fire quickly).
	if (lastScanAt && now.getTime() - new Date(lastScanAt).getTime() < SCAN_DEDUPE_MS) {
		return res.status(429).json({
			success: false,
			message: 'Duplicate scan detected. Please wait a few seconds and try again.',
			retryAfterMs: SCAN_DEDUPE_MS,
		});
	}

	// 2) If currently IN (last session has IN but no OUT) → mark OUT (after 15s)
	if (lastSession?.inTime && !lastSession?.outTime) {
		const sinceInMs = now.getTime() - new Date(lastSession.inTime).getTime();
		if (sinceInMs < MIN_IN_TO_OUT_MS) {
			const retryAfterMs = MIN_IN_TO_OUT_MS - sinceInMs;
			return res.status(429).json({
				success: false,
				message: `Too early to mark OUT. Please wait ${msToWaitMessage(retryAfterMs)}.`,
				retryAfterMs,
			});
		}

		lastSession.outTime = now;
		attendance.inTime = lastSession.inTime;
		attendance.outTime = now;
		await attendance.save();

		return res.json({
			success: true,
			action: 'OUT',
			student,
			attendance,
		});
	}

	// 3) If currently OUT (last session completed) → mark IN again (after 20s)
	if (lastSession?.outTime) {
		const sinceOutMs = now.getTime() - new Date(lastSession.outTime).getTime();
		if (sinceOutMs < MIN_OUT_TO_IN_MS) {
			const retryAfterMs = MIN_OUT_TO_IN_MS - sinceOutMs;
			return res.status(429).json({
				success: false,
				message: `Too early to mark IN again. Please wait ${msToWaitMessage(retryAfterMs)}.`,
				retryAfterMs,
			});
		}
	}

	attendance.sessions.push({ inTime: now, outTime: null });
	attendance.inTime = now;
	attendance.outTime = null;
	await attendance.save();

	return res.json({
		success: true,
		action: 'IN',
		student,
		attendance,
	});
});

// GET /api/attendance/me (student)
export const getMyAttendanceLogs = asyncHandler(async (req, res) => {
	const logs = await Attendance.find({ studentId: req.user.id })
		.sort({ date: -1, updatedAt: -1 })
		.lean();

	return res.json({ success: true, logs });
});
