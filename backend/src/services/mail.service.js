import nodemailer from 'nodemailer';

// Email service used for verification emails.
// Supports:
// - Gmail App Password (GMAIL_USER + GMAIL_PASS)
// - Gmail OAuth2 (GOOGLE_* variables)

function buildTransporter() {
	// Option A: Gmail SMTP app password
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
		'Email transporter not configured. Set GMAIL_USER and GMAIL_PASS (Gmail App Password) in backend/.env. Verification emails will not send.'
	);
}

export async function sendEmail({ to, subject, html, text }) {
	if (!transporter) {
		throw new Error(
			'Mailer is not configured. Set GMAIL_USER and GMAIL_PASS (Gmail App Password) in backend/.env, then restart the backend.'
		);
	}

	const from = process.env.GMAIL_USER || process.env.GOOGLE_USER;

	const details = await transporter.sendMail({
		from,
		to,
		subject,
		html,
		text,
	});

	return details;
}
