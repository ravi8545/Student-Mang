import * as Brevo from '@getbrevo/brevo';

// Email service using Brevo (formerly Sendinblue) Transactional Emails API v3
// Replaces Nodemailer to provide reliable email verification delivery.

function getBrevoConfig() {
	const apiKey = String(process.env.BREVO_API_KEY || '').trim();
	const senderEmail = String(process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'noreply@hostelqr.com').trim();
	const senderName = String(process.env.BREVO_SENDER_NAME || 'Hostel Entry-Exit System').trim();

	const isConfigured = Boolean(
		apiKey &&
		apiKey !== 'xkeysib-your_brevo_api_key_here' &&
		apiKey.length > 10
	);

	return { apiKey, senderEmail, senderName, isConfigured };
}

function logMailStatus() {
	const config = getBrevoConfig();
	console.log('[mail/brevo] BREVO_API_KEY configured:', config.isConfigured);
	if (config.isConfigured) {
		console.log('[mail/brevo] Sender Identity:', `${config.senderName} <${config.senderEmail}>`);
	} else {
		console.warn(
			'[mail/brevo] BREVO_API_KEY is not configured or using placeholder value. Email verification links will be logged to console in local dev mode.'
		);
	}
}

logMailStatus();

export async function sendEmail({ to, subject, html, text }) {
	const config = getBrevoConfig();

	console.log('[mail/brevo] Triggering email delivery to:', to, '| Subject:', subject);

	if (!config.isConfigured) {
		console.warn('[mail/brevo] BREVO_API_KEY is missing/unconfigured. Simulating email send locally:');
		console.log('--------------------------------------------------');
		console.log(`TO: ${to}`);
		console.log(`SUBJECT: ${subject}`);
		console.log(`TEXT CONTENT:\n${text}`);
		console.log('--------------------------------------------------');
		return { simulated: true, success: true, messageId: 'simulated-local-mail' };
	}

	// Try sending via @getbrevo/brevo SDK first
	try {
		const apiInstance = new Brevo.TransactionalEmailsApi();
		apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, config.apiKey);

		const sendSmtpEmail = new Brevo.SendSmtpEmail();
		sendSmtpEmail.subject = subject;
		sendSmtpEmail.htmlContent = html;
		if (text) sendSmtpEmail.textContent = text;
		sendSmtpEmail.sender = { name: config.senderName, email: config.senderEmail };
		sendSmtpEmail.to = [{ email: to }];

		const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
		console.log('[mail/brevo] Email sent successfully via Brevo SDK. Message ID:', data?.messageId || data?.body?.messageId);
		return { success: true, messageId: data?.messageId || data?.body?.messageId };
	} catch (sdkErr) {
		console.warn('[mail/brevo] Brevo SDK attempt failed, attempting direct REST API fallback...', sdkErr?.message || sdkErr);
		
		// Fallback to direct HTTP REST API to ensure delivery
		try {
			const response = await fetch('https://api.brevo.com/v3/smtp/email', {
				method: 'POST',
				headers: {
					'accept': 'application/json',
					'content-type': 'application/json',
					'api-key': config.apiKey,
				},
				body: JSON.stringify({
					sender: { name: config.senderName, email: config.senderEmail },
					to: [{ email: to }],
					subject,
					htmlContent: html,
					textContent: text,
				}),
			});

			const responseData = await response.json().catch(() => null);

			if (!response.ok) {
				const errMsg = responseData?.message || responseData?.code || response.statusText;
				throw new Error(`Brevo API returned status ${response.status}: ${errMsg}`);
			}

			console.log('[mail/brevo] Email sent successfully via Brevo REST API. Message ID:', responseData?.messageId);
			return { success: true, messageId: responseData?.messageId };
		} catch (restErr) {
			console.error('[mail/brevo] Failed to send email via Brevo REST API:', restErr?.message || restErr);
			throw new Error(`Failed to send email via Brevo: ${restErr?.message || 'Unknown error'}`);
		}
	}
}
