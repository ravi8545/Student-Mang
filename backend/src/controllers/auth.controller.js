import Student from '../models/student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadStudentPhoto } from '../services/imagekit.service.js';
import {
	generateVerificationToken,
	getVerificationTokenExpiryDate,
	sendVerificationEmail,
	buildFrontendVerifyUrl,
} from '../services/emailVerification.service.js';
import { generateStudentQrDataUrl } from '../services/qr.service.js';
import { signAdminToken, signStudentToken } from '../utils/jwt.js';

// POST /api/auth/signup
export const studentSignup = asyncHandler(async (req, res) => {
	const { name, rollNo, email, password, department, roomNo, hostelName } = req.body;

	const existing = await Student.findOne({ $or: [{ email }, { rollNo }] });
	if (existing) {
		return res.status(409).json({
			success: false,
			message: 'Student with this email or roll number already exists',
		});
	}

	const verificationToken = generateVerificationToken();
	const student = await Student.create({
		name,
		rollNo,
		email,
		password,
		department,
		roomNo,
		hostelName,
		isVerified: false,
		verificationToken,
		verificationTokenExpiresAt: getVerificationTokenExpiryDate(),
	});

	try {
		// Optional profile photo upload (multipart/form-data: field name "photo").
		if (req.file?.buffer) {
			try {
				const uploaded = await uploadStudentPhoto({
					fileBuffer: req.file.buffer,
					fileName: `student_${student._id}`,
					mimeType: req.file.mimetype,
					folder: '/hostelqr/students',
				});
				student.photoUrl = uploaded.url;
			} catch (err) {
				// Photo is optional; do not fail signup.
				console.warn('Profile photo upload failed:', err?.message);
			}
		}

		// Generate and store a UNIQUE QR code (base64 image) per student.
		// QR encodes JSON: { "studentId": "..." }
		const { dataUrl } = await generateStudentQrDataUrl(String(student._id));
		student.qrCodeDataUrl = dataUrl;
		await student.save();
	} catch (err) {
		// If anything fails after creation (photo/QR), rollback to avoid blocking re-signup.
		await Student.findByIdAndDelete(student._id);
		throw err;
	}

	const verifyUrl = buildFrontendVerifyUrl(verificationToken);
	// Send verification email (non-blocking for account creation).
	let emailSent = true;
	try {
		await sendVerificationEmail({ to: student.email, name: student.name, token: verificationToken });
	} catch (err) {
		emailSent = false;
		console.warn('Failed to send verification email:', err?.message);
	}

	const response = {
		success: true,
		message: 'Signup successful. Please verify your email.',
		student: {
			id: student._id,
			name: student.name,
			email: student.email,
			rollNo: student.rollNo,
			department: student.department,
			roomNo: student.roomNo,
			hostelName: student.hostelName,
			photoUrl: student.photoUrl || null,
			isVerified: Boolean(student.isVerified),
		},
	};

	// Helpful for local development: if SMTP isn't configured, provide a direct link.
	if (!emailSent && process.env.NODE_ENV !== 'production') {
		response.message =
			'Signup successful, but verification email could not be sent. Use devVerifyUrl to verify.';
		response.devVerifyUrl = verifyUrl;
	}

	return res.status(201).json(response);
});

async function verifyStudentByToken(token) {
	if (!token) {
		return { ok: false, status: 400, message: 'Missing verification token' };
	}

	const student = await Student.findOne({ verificationToken: token });
	if (!student) {
		return { ok: false, status: 400, message: 'Invalid/Expired Link' };
	}

	if (
		student.verificationTokenExpiresAt &&
		new Date(student.verificationTokenExpiresAt).getTime() < Date.now()
	) {
		return { ok: false, status: 400, message: 'Invalid/Expired Link' };
	}

	student.isVerified = true;
	student.verificationToken = null;
	student.verificationTokenExpiresAt = null;
	await student.save();

	return { ok: true, student };
}

// GET /api/auth/verify/:token
export const verifyEmailToken = asyncHandler(async (req, res) => {
	const { token } = req.params;
	const result = await verifyStudentByToken(token);
	if (!result.ok) {
		return res.status(result.status).json({ success: false, message: result.message });
	}
	return res.json({ success: true, message: 'Email Verified Successfully' });
});

// Legacy helper (kept for backward compatibility): GET /api/auth/verify-email?token=...
export const verifyEmail = asyncHandler(async (req, res) => {
	const { token } = req.query;
	if (!token) {
		return res.status(400).json({ success: false, message: 'Missing verification token' });
	}
	// Redirect users who open the link directly in a browser.
	const redirectUrl = buildFrontendVerifyUrl(token);
	return res.redirect(302, redirectUrl);
});

// POST /api/auth/login
export const studentLogin = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	const student = await Student.findOne({ email }).select('+password');
	if (!student) {
		return res.status(404).json({
			success: false,
			message: 'Student not found',
		});
	}

	const match = await student.comparePassword(password);
	if (!match) {
		return res.status(401).json({
			success: false,
			message: 'Invalid credentials',
		});
	}

	const isVerified = student.isVerified === true || student?.verified === true;
	if (!isVerified) {
		return res.status(400).json({
			success: false,
			message: 'Please verify your email before logging in',
		});
	}

	const token = signStudentToken(student);

	return res.json({
		success: true,
		message: 'Login successful',
		token,
		student: {
			id: student._id,
			name: student.name,
			email: student.email,
			rollNo: student.rollNo,
			department: student.department,
			roomNo: student.roomNo,
			hostelName: student.hostelName,
			isVerified,
		},
	});
});

// POST /api/auth/resend-verification
export const resendVerification = asyncHandler(async (req, res) => {
	const { email } = req.body || {};
	if (!email) {
		return res.status(400).json({ success: false, message: 'Email is required' });
	}

	const student = await Student.findOne({ email: String(email).toLowerCase() });
	if (!student) {
		return res
			.status(404)
			.json({ success: false, message: 'Student not found' });
	}

	if (student.isVerified === true) {
		return res
			.status(400)
			.json({ success: false, message: 'Email is already verified' });
	}

	const verificationToken = generateVerificationToken();
	student.verificationToken = verificationToken;
	student.verificationTokenExpiresAt = getVerificationTokenExpiryDate();
	await student.save();

	const verifyUrl = buildFrontendVerifyUrl(verificationToken);
	let emailSent = true;
	try {
		await sendVerificationEmail({ to: student.email, name: student.name, token: verificationToken });
	} catch (err) {
		emailSent = false;
		console.warn('Failed to resend verification email:', err?.message);
	}

	const response = {
		success: true,
		message: 'Verification email sent',
	};

	if (!emailSent && process.env.NODE_ENV !== 'production') {
		response.message =
			'Could not send verification email. Use devVerifyUrl to verify.';
		response.devVerifyUrl = verifyUrl;
	}

	return res.json(response);
});

// GET /api/auth/me (student)
export const getMe = asyncHandler(async (req, res) => {
	const student = await Student.findById(req.user.id)
		.select('-password -faceDescriptor -faceLandmarks -faceImageDataUrl');
	if (!student) {
		return res.status(404).json({ success: false, message: 'Student not found' });
	}

	return res.json({ success: true, student });
});

// POST /api/auth/me/photo (student)
export const updateMyPhoto = asyncHandler(async (req, res) => {
	if (!req.file?.buffer) {
		return res.status(400).json({ success: false, message: 'Photo file is required' });
	}

	const student = await Student.findById(req.user.id)
		.select('-password -faceDescriptor -faceLandmarks -faceImageDataUrl');
	if (!student) {
		return res.status(404).json({ success: false, message: 'Student not found' });
	}

	const uploaded = await uploadStudentPhoto({
		fileBuffer: req.file.buffer,
		fileName: `student_${student._id}`,
		mimeType: req.file.mimetype,
		folder: '/hostelqr/students',
	});

	student.photoUrl = uploaded.url;
	await student.save();

	return res.json({
		success: true,
		message: 'Profile photo updated',
		photoUrl: student.photoUrl,
		student,
	});
});

// GET /api/auth/me/qr (student)
export const getMyQr = asyncHandler(async (req, res) => {
	const student = await Student.findById(req.user.id).select('qrCodeDataUrl');
	if (!student) {
		return res.status(404).json({ success: false, message: 'Student not found' });
	}

	if (student.qrCodeDataUrl) {
		return res.json({
			success: true,
			payload: JSON.stringify({ studentId: req.user.id }),
			qrDataUrl: student.qrCodeDataUrl,
			stored: true,
		});
	}

	// Fallback: generate & store if missing (should be rare).
	const { dataUrl, payload } = await generateStudentQrDataUrl(req.user.id);
	student.qrCodeDataUrl = dataUrl;
	await student.save();
	return res.json({ success: true, payload, qrDataUrl: dataUrl, stored: true });
});

// POST /api/admin/login
export const adminLogin = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	const adminEmail = process.env.ADMIN_EMAIL;
	const adminPassword = process.env.ADMIN_PASSWORD;

	if (!adminEmail || !adminPassword) {
		return res.status(500).json({
			success: false,
			message: 'Admin credentials are not configured on the server',
		});
	}

	if (email !== adminEmail || password !== adminPassword) {
		return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
	}

	const token = signAdminToken(adminEmail);
	return res.json({ success: true, message: 'Admin login successful', token });
});
