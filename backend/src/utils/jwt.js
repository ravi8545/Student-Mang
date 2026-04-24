import jwt from 'jsonwebtoken';

function getJwtSecret() {
	const secret = process.env.JWT_SECRET;
	if (!secret) throw new Error('JWT_SECRET is missing in environment variables');
	return secret;
}

export function signStudentToken(student) {
	return jwt.sign(
		{
			id: student._id,
			role: 'student',
			name: student.name,
			email: student.email,
		},
		getJwtSecret(),
		{ expiresIn: '7d' }
	);
}

export function signAdminToken(adminEmail) {
	return jwt.sign(
		{
			id: adminEmail,
			role: 'admin',
			email: adminEmail,
		},
		getJwtSecret(),
		{ expiresIn: '7d' }
	);
}

export function signEmailVerificationToken(student) {
	// Short-lived token used only for email verification.
	return jwt.sign(
		{ id: student._id, email: student.email, purpose: 'verify-email' },
		getJwtSecret(),
		{ expiresIn: '1d' }
	);
}
