import mongoose from 'mongoose';

// Stores a student's IN/OUT timestamps for a single day.
const sessionSchema = new mongoose.Schema(
	{
		inTime: { type: Date, default: null },
		outTime: { type: Date, default: null },
	},
	{ _id: false }
);

const attendanceSchema = new mongoose.Schema(
	{
		studentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
			required: true,
			index: true,
		},
		// We store date as YYYY-MM-DD for easy "one record per day" logic.
		date: { type: String, required: true, index: true },
		// Multiple entry/exit cycles per day.
		sessions: { type: [sessionSchema], default: [] },
		// Backward-compatible fields (mirror the latest session IN/OUT).
		inTime: { type: Date, default: null },
		outTime: { type: Date, default: null },
	},
	{ timestamps: true }
);

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
