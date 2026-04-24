import mongoose from 'mongoose';

import Attendance from '../models/attendance.model.js';
import Student from '../models/student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getLocalDateString } from '../utils/date.js';

const SCAN_DEDUPE_MS = Number(process.env.SCAN_DEDUPE_MS || 4000);

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

// POST /api/attendance/scan (admin)
export const scanQrAndMarkAttendance = asyncHandler(async (req, res) => {
	const studentId = extractStudentId(req.body);
	if (!studentId || !mongoose.isValidObjectId(studentId)) {
		return res.status(400).json({ success: false, message: 'Invalid studentId in QR' });
	}

	const student = await Student.findById(studentId).select('-password');
	if (!student) {
		return res.status(404).json({ success: false, message: 'Student not found' });
	}

	const today = getLocalDateString();
	const now = new Date();

	let attendance = await Attendance.findOne({ studentId, date: today });
	if (attendance) {
		const lastScanAt = attendance.outTime || attendance.inTime;
		if (lastScanAt && now.getTime() - new Date(lastScanAt).getTime() < SCAN_DEDUPE_MS) {
			return res.status(429).json({
				success: false,
				message: 'Duplicate scan detected. Please wait a few seconds and try again.',
				retryAfterMs: SCAN_DEDUPE_MS,
			});
		}
	}

	// 1) No attendance exists for today → mark IN time
	if (!attendance) {
		attendance = await Attendance.create({
			studentId,
			date: today,
			inTime: now,
		});

		return res.json({
			success: true,
			action: 'IN',
			student,
			attendance,
		});
	}

	// 2) IN exists but OUT not → mark OUT time
	if (attendance.inTime && !attendance.outTime) {
		attendance.outTime = now;
		await attendance.save();

		return res.json({
			success: true,
			action: 'OUT',
			student,
			attendance,
		});
	}

	// 3) Already has both IN and OUT for today
	return res.json({
		success: true,
		action: 'NONE',
		message: 'Attendance already completed for today',
		student,
		attendance,
	});
});

// GET /api/attendance/me (student)
export const getMyAttendanceLogs = asyncHandler(async (req, res) => {
	const logs = await Attendance.find({ studentId: req.user.id })
		.sort({ date: -1, inTime: -1 })
		.lean();

	return res.json({ success: true, logs });
});
