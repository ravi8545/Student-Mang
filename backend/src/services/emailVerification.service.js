import crypto from 'crypto';

import { sendEmail } from './mail.service.js';

const TOKEN_BYTES = 32;
const DEFAULT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateVerificationToken() {
	return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

export function getVerificationTokenExpiryDate() {
	return new Date(Date.now() + DEFAULT_TOKEN_TTL_MS);
}

export function buildFrontendVerifyUrl(token) {
	const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
	const base = String(frontendUrl).replace(/\/$/, '');
	return `${base}/verify/${token}`;
}

export async function sendVerificationEmail({ to, name, token }) {
	const verifyUrl = buildFrontendVerifyUrl(token);

	await sendEmail({
		to,
		subject: 'Verify Your HostelQR Account',
		text: `Hello ${name || ''}\n\nVerify your HostelQR account by clicking this link: ${verifyUrl}\n\nIf you did not sign up, ignore this email.`,
		html: `
			<p>Hello <strong>${name || ''}</strong>,</p>
			<p>Please verify your HostelQR account to enable login.</p>
			<p>
				<a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px;">Verify Your Account</a>
			</p>
			<p>If the button doesn't work, copy and paste this link:</p>
			<p><a href="${verifyUrl}">${verifyUrl}</a></p>
			<p>If you did not sign up, you can ignore this email.</p>
		`,
	});

	return { verifyUrl };
}
