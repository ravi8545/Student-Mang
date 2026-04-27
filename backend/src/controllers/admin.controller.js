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
