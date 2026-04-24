import Attendance from '../models/attendance.model.js';
import Student from '../models/student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getLocalDateString } from '../utils/date.js';

// GET /api/admin/students
export const getAllStudentsWithLiveStatus = asyncHandler(async (req, res) => {
	const today = getLocalDateString();

	const [students, todaysAttendance] = await Promise.all([
		Student.find().select('-password -qrCodeDataUrl').lean(),
		Attendance.find({ date: today }).select('studentId inTime outTime').lean(),
	]);

	const attendanceByStudentId = new Map(
		todaysAttendance.map((a) => [String(a.studentId), a])
	);

	const result = students.map((s) => {
		const todayRecord = attendanceByStudentId.get(String(s._id)) || null;
		const status = todayRecord?.inTime && !todayRecord?.outTime ? 'IN' : 'OUT';
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
		.sort({ date: -1, inTime: -1 })
		.lean();

	return res.json({ success: true, logs });
});
