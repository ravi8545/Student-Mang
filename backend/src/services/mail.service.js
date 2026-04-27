import nodemailer from 'nodemailer';

// Email service used for verification emails.
// Uses Gmail SMTP App Password (EMAIL_USER + EMAIL_PASS)

function logMailEnvStatus() {
	const emailUser = String(process.env.EMAIL_USER || '').trim();
	const emailPass = String(process.env.EMAIL_PASS || '');

	console.log('[mail] EMAIL_USER set:', Boolean(emailUser));
	if (emailUser) console.log('[mail] EMAIL_USER:', emailUser);
	console.log('[mail] EMAIL_PASS length:', emailPass.length);

	if (emailPass && emailPass.length !== 16) {
		console.warn(
			'[mail] EMAIL_PASS does not look like a Gmail App Password (expected 16 characters). Do not use your normal Gmail password.'
		);
	}
}

function buildTransporter() {
	const emailUser = String(process.env.EMAIL_USER || '').trim();
	const emailPass = String(process.env.EMAIL_PASS || '');

	if (!emailUser || !emailPass) return null;

	// Gmail SMTP with App Password (recommended).
	return nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			user: emailUser,
			pass: emailPass,
		},
	});
}

logMailEnvStatus();
const transporter = buildTransporter();

if (transporter) {
	transporter
		.verify()
		.then(() => console.log('Email transporter is ready'))
		.catch((err) => {
			console.warn('Email transporter verification failed:', err?.message);
			console.warn(
				'[mail] If this is Gmail, ensure you are using a Gmail App Password (not your normal password) and that 2-Step Verification is enabled.'
			);
		});
} else {
	console.warn('[mail] Email transporter not configured.');
	console.warn(
		'[mail] Missing EMAIL_USER and/or EMAIL_PASS. Set them in backend/.env using a Gmail App Password (NOT your normal Gmail password), then restart the backend.'
	);
}

export async function sendEmail({ to, subject, html, text }) {
	if (!transporter) {
		throw new Error(
			'Mailer is not configured. Set EMAIL_USER and EMAIL_PASS (Gmail App Password) in backend/.env, then restart the backend.'
		);
	}

	const from = String(process.env.EMAIL_USER || '').trim();

	console.log('[mail] sendEmail triggered', {
		to,
		subject,
		usingFrom: from,
	});

	try {
		const details = await transporter.sendMail({
			from,
			to,
			subject,
			html,
			text,
		});

		console.log('[mail] Email sent successfully', {
			messageId: details?.messageId,
			accepted: details?.accepted,
			rejected: details?.rejected,
		});

		return details;
	} catch (err) {
		console.error('[mail] transporter.sendMail failed:', err?.message || err);
		throw new Error(
			`Failed to send email. Check EMAIL_USER/EMAIL_PASS (Gmail App Password) and Gmail security settings. Details: ${err?.message || 'Unknown error'}`
		);
	}
}
