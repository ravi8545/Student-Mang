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
	console.log('[mail] Verification email requested via Brevo', {
		to,
		name: name || null,
		verifyUrl,
	});

	const studentName = name ? name.trim() : 'Student';

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Verify Your HostelQR Account</title>
		</head>
		<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #1e293b;">
			<table role="presentation" style="width: 100%; border-collapse: collapse; padding: 30px 0;">
				<tr>
					<td align="center">
						<table role="presentation" style="width: 100%; max-width: 580px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
							<!-- Header -->
							<tr>
								<td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px 30px; text-align: center;">
									<h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
										HostelQR
									</h1>
									<p style="color: #93c5fd; font-size: 14px; margin: 6px 0 0 0;">
										Entry & Exit Attendance Management System
									</p>
								</td>
							</tr>
							<!-- Body -->
							<tr>
								<td style="padding: 36px 30px;">
									<h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 16px;">
										Verify Your Email Address
									</h2>
									<p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
										Hello <strong>${studentName}</strong>,<br>
										Thank you for registering on the HostelQR Attendance System. Please verify your email address to activate your account and gain access to your student dashboard.
									</p>
									<!-- CTA Button -->
									<div style="text-align: center; margin: 30px 0;">
										<a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
											Verify My Account
										</a>
									</div>
									<p style="font-size: 13px; color: #64748b; margin-top: 24px; line-height: 1.5;">
										If the button above does not work, copy and paste the following URL into your browser:
									</p>
									<p style="font-size: 13px; word-break: break-all; margin-top: 6px; padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; color: #2563eb;">
										<a href="${verifyUrl}" style="color: #2563eb; text-decoration: none;">${verifyUrl}</a>
									</p>
									<p style="font-size: 13px; color: #94a3b8; margin-top: 24px; margin-bottom: 0;">
										This verification link will expire in 24 hours. If you did not create an account, please ignore this email.
									</p>
								</td>
							</tr>
							<!-- Footer -->
							<tr>
								<td style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
									<p style="font-size: 12px; color: #94a3b8; margin: 0;">
										&copy; ${new Date().getFullYear()} Veer Bahadur Singh Purvanchal University | Hostel Attendance System
									</p>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</body>
		</html>
	`;

	await sendEmail({
		to,
		subject: 'Verify Your HostelQR Account',
		text: `Hello ${studentName}\n\nVerify your HostelQR account by clicking this link: ${verifyUrl}\n\nThis link will expire in 24 hours.\nIf you did not sign up, please ignore this email.`,
		html,
	});

	return { verifyUrl };
}
