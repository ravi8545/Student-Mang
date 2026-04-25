import nodemailer from 'nodemailer';

// Email service used for verification emails.
// Supports:
// - Gmail SMTP App Password (EMAIL_USER + EMAIL_PASS)
// - Backward-compat: (GMAIL_USER + GMAIL_PASS)
// - Gmail OAuth2 (GOOGLE_* variables)

function buildTransporter() {
	// Option A: Gmail SMTP app password (preferred names)
	if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
		return nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});
	}

	// Backward compatible env names
	if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
		return nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.GMAIL_USER,
				pass: process.env.GMAIL_PASS,
			},
		});
	}

	// Option B: Gmail OAuth2
	if (
		process.env.GOOGLE_USER &&
		process.env.GOOGLE_CLIENT_ID &&
		process.env.GOOGLE_CLIENT_SECRET &&
		process.env.GOOGLE_REFRESH_TOKEN
	) {
		return nodemailer.createTransport({
			service: 'gmail',
			auth: {
				type: 'OAuth2',
				user: process.env.GOOGLE_USER,
				clientId: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
			},
		});
	}

	return null;
}

const transporter = buildTransporter();

if (transporter) {
	transporter
		.verify()
		.then(() => console.log('Email transporter is ready'))
		.catch((err) => console.warn('Email transporter verification failed:', err?.message));
} else {
	console.warn(
		'Email transporter not configured. Set EMAIL_USER and EMAIL_PASS (Gmail App Password) in backend/.env. Verification emails will not send.'
	);
}

export async function sendEmail({ to, subject, html, text }) {
	if (!transporter) {
		throw new Error(
			'Mailer is not configured. Set EMAIL_USER and EMAIL_PASS (Gmail App Password) in backend/.env, then restart the backend.'
		);
	}

	const from =
		process.env.EMAIL_USER ||
		process.env.GMAIL_USER ||
		process.env.GOOGLE_USER;

	const details = await transporter.sendMail({
		from,
		to,
		subject,
		html,
		text,
	});

	return details;
}
