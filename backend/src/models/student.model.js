import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Student account used for authentication + profile.
const studentSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		rollNo: { type: String, required: true, unique: true, trim: true },
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
			select: false,
		},
		department: { type: String, required: true, trim: true },
		roomNo: { type: String, required: true, trim: true },
		hostelName: { type: String, required: true, trim: true },
		verified: { type: Boolean, default: false },
		// Base64 PNG data URL generated from { studentId }.
		qrCodeDataUrl: { type: String, default: null },
	},
	{ timestamps: true }
);

// Hash password before saving.
studentSchema.pre('save', async function () {
	if (!this.isModified('password')) return;
	this.password = await bcrypt.hash(this.password, 10);
});

studentSchema.methods.comparePassword = function (candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

const Student = mongoose.model('Student', studentSchema);
export default Student;
