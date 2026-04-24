import jwt from 'jsonwebtoken';

import Student from '../models/student.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendEmail } from '../services/mail.service.js';
import { generateStudentQrDataUrl } from '../services/qr.service.js';
import {
	signAdminToken,
	signEmailVerificationToken,
	signStudentToken,
} from '../utils/jwt.js';

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

	const student = await Student.create({
		name,
		rollNo,
		email,
		password,
		department,
		roomNo,
		hostelName,
	});

	// Generate and store a UNIQUE QR code (base64 image) per student.
	// QR encodes JSON: { "studentId": "..." }
	const { dataUrl } = await generateStudentQrDataUrl(String(student._id));
	student.qrCodeDataUrl = dataUrl;
	await student.save();

	const token = signEmailVerificationToken(student);
	const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
	const verifyUrl = `${backendUrl}/api/auth/verify-email?token=${token}`;

	// Send verification email (non-blocking for account creation).
	let emailSent = true;
	try {
		await sendEmail({
			to: student.email,
			subject: 'Verify your email - Hostel Entry Exit System',
			html: `
				<p>Hello <strong>${student.name}</strong>,</p>
				<p>Thanks for signing up. Please verify your email to log in.</p>
				<p>
					<a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a>
				</p>
				<p>If you did not sign up, you can ignore this email.</p>
			`,
		});
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
			verified: student.verified,
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

// GET /api/auth/verify-email?token=...
export const verifyEmail = asyncHandler(async (req, res) => {
	const { token } = req.query;
	if (!token) {
		return res.status(400).send('Missing token');
	}

	let decoded;
	try {
		decoded = jwt.verify(token, process.env.JWT_SECRET);
	} catch (err) {
		return res.status(400).send('Invalid or expired token');
	}

	if (decoded?.purpose !== 'verify-email') {
		return res.status(400).send('Invalid token purpose');
	}

	const student = await Student.findById(decoded.id);
	if (!student) {
		return res.status(404).send('Student not found');
	}

	student.verified = true;
	await student.save();

	const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

	return res.send(`
		<h2>Email Verified ✅</h2>
		<p>Your email has been successfully verified. You can now log in.</p>
		<a href="${frontendUrl}/login" style="display:inline-block;padding:10px 16px;background:#198754;color:#fff;text-decoration:none;border-radius:6px;">Go to Login</a>
	`);
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

	if (!student.verified) {
		return res.status(400).json({
			success: false,
			message: 'Email not verified. Please verify your email before logging in.',
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
			verified: student.verified,
		},
	});
});

// GET /api/auth/me (student)
export const getMe = asyncHandler(async (req, res) => {
	const student = await Student.findById(req.user.id).select('-password');
	if (!student) {
		return res.status(404).json({ success: false, message: 'Student not found' });
	}

	return res.json({ success: true, student });
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
