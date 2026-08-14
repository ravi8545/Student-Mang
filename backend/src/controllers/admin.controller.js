import Attendance from '../models/attendance.model.js';
import Student from '../models/student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getLocalDateString } from '../utils/date.js';

function isCurrentlyIn(attendance) {
	if (!attendance) return false;
	const sessions = attendance.sessions;
	if (Array.isArray(sessions) && sessions.length) {
		const last = sessions[sessions.length - 1];
		return Boolean(last?.inTime && !last?.outTime);
	}
	// Backward compatibility
	return Boolean(attendance.inTime && !attendance.outTime);
}

// GET /api/admin/students
export const getAllStudentsWithLiveStatus = asyncHandler(async (req, res) => {
	const today = getLocalDateString();

	const [students, todaysAttendance] = await Promise.all([
		Student.find()
			.select('-password -qrCodeDataUrl -faceDescriptor -faceLandmarks -faceImageDataUrl')
			.lean(),
		Attendance.find({ date: today }).select('studentId sessions inTime outTime').lean(),
	]);

	const attendanceByStudentId = new Map(
		todaysAttendance.map((a) => [String(a.studentId), a])
	);

	const result = students.map((s) => {
		const todayRecord = attendanceByStudentId.get(String(s._id)) || null;
		const status = isCurrentlyIn(todayRecord) ? 'IN' : 'OUT';
		return {
			...s,
			status,
			todayAttendance: todayRecord,
		};
	});

	return res.json({ success: true, students: result, date: today });
});

// GET /api/admin/attendance
export const getAllAttendanceLogs = asyncHandler(async (req, res) => {
	const logs = await Attendance.find()
		.populate('studentId', 'name rollNo email department roomNo hostelName')
		.sort({ date: -1, updatedAt: -1 })
		.lean();

	return res.json({ success: true, logs });
});

// GET /api/admin/stats
export const getDashboardStats = asyncHandler(async (req, res) => {
	const today = getLocalDateString();

	const [students, todaysAttendance] = await Promise.all([
		Student.find().select('_id').lean(),
		Attendance.find({ date: today }).select('studentId sessions inTime outTime').lean(),
	]);

	const totalStudents = students.length;
	let totalIn = 0;
	let totalTodayScans = 0;

	for (const a of todaysAttendance) {
		if (isCurrentlyIn(a)) totalIn += 1;
		if (Array.isArray(a.sessions)) {
			for (const s of a.sessions) {
				if (s.inTime) totalTodayScans += 1;
				if (s.outTime) totalTodayScans += 1;
			}
		}
	}

	const totalOut = Math.max(0, totalStudents - totalIn);
	const occupancyRate = totalStudents > 0 ? Math.round((totalIn / totalStudents) * 100) : 0;

	return res.json({
		success: true,
		stats: {
			totalStudents,
			totalIn,
			totalOut,
			totalTodayScans,
			occupancyRate,
			date: today,
		},
	});
});

// POST /api/admin/manual-scan
export const manualMarkAttendance = asyncHandler(async (req, res) => {
	const { rollNo, action } = req.body;

	if (!rollNo) {
		return res.status(400).json({ success: false, message: 'Roll number is required' });
	}

	const student = await Student.findOne({ rollNo: String(rollNo).trim() });
	if (!student) {
		return res.status(404).json({ success: false, message: `Student with roll number "${rollNo}" not found` });
	}

	const today = getLocalDateString();
	const now = new Date();

	let attendance = await Attendance.findOne({ studentId: student._id, date: today });

	if (!attendance) {
		if (action === 'OUT') {
			return res.status(400).json({ success: false, message: 'Student is already OUT for today.' });
		}
		attendance = await Attendance.create({
			studentId: student._id,
			date: today,
			sessions: [{ inTime: now, outTime: null }],
			inTime: now,
			outTime: null,
		});

		return res.json({
			success: true,
			action: 'IN',
			student: { name: student.name, rollNo: student.rollNo, hostelName: student.hostelName },
			attendance,
			message: `Manually marked IN for ${student.name} (${student.rollNo})`,
		});
	}

	if (!Array.isArray(attendance.sessions)) attendance.sessions = [];
	const lastSession = attendance.sessions.length ? attendance.sessions[attendance.sessions.length - 1] : null;

	if (action === 'OUT' || (!action && lastSession?.inTime && !lastSession?.outTime)) {
		if (!lastSession || (lastSession.inTime && lastSession.outTime)) {
			return res.status(400).json({ success: false, message: 'Student is not currently marked IN.' });
		}
		lastSession.outTime = now;
		attendance.inTime = lastSession.inTime;
		attendance.outTime = now;
		await attendance.save();

		return res.json({
			success: true,
			action: 'OUT',
			student: { name: student.name, rollNo: student.rollNo, hostelName: student.hostelName },
			attendance,
			message: `Manually marked OUT for ${student.name} (${student.rollNo})`,
		});
	} else {
		attendance.sessions.push({ inTime: now, outTime: null });
		attendance.inTime = now;
		attendance.outTime = null;
		await attendance.save();

		return res.json({
			success: true,
			action: 'IN',
			student: { name: student.name, rollNo: student.rollNo, hostelName: student.hostelName },
			attendance,
			message: `Manually marked IN for ${student.name} (${student.rollNo})`,
		});
	}
});

// GET /api/admin/export
export const exportAttendanceCsv = asyncHandler(async (req, res) => {
	const logs = await Attendance.find()
		.populate('studentId', 'name rollNo email department roomNo hostelName')
		.sort({ date: -1, updatedAt: -1 })
		.lean();

	let csv = 'Date,Student Name,Roll No,Department,Room No,Hostel,IN Time,OUT Time\n';

	for (const log of logs) {
		const s = log.studentId || {};
		const sessions = Array.isArray(log.sessions) && log.sessions.length ? log.sessions : [{ inTime: log.inTime, outTime: log.outTime }];

		for (const sess of sessions) {
			const inTimeStr = sess.inTime ? new Date(sess.inTime).toLocaleString() : '-';
			const outTimeStr = sess.outTime ? new Date(sess.outTime).toLocaleString() : '-';

			csv += `"${log.date || ''}","${s.name || ''}","${s.rollNo || ''}","${s.department || ''}","${s.roomNo || ''}","${s.hostelName || ''}","${inTimeStr}","${outTimeStr}"\n`;
		}
	}

	res.setHeader('Content-Type', 'text/csv');
	res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${getLocalDateString()}.csv"`);
	return res.status(200).send(csv);
});
