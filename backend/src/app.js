import express from 'express';
import cors from 'cors';
import { sendEmail } from './services/mail.service.js';

import authRoutes from './routes/auth.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import adminRoutes from './routes/admin.routes.js';
import faceRoutes from './routes/face.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();

// Allow requests from the React dev server & local network origins.
const frontendOrigin = String(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
app.use(
	cors({
		origin: (origin, callback) => {
			// Allow requests with no origin (mobile apps, curl) or matching frontendOrigin / localhost
			if (!origin || origin === frontendOrigin || origin.startsWith('http://localhost') || origin.startsWith('http://10.') || origin.startsWith('http://192.168.')) {
				callback(null, true);
			} else {
				callback(null, true); // Permissive in dev mode for LAN mobile testing
			}
		},
		credentials: true,
	})
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/', (req, res) => {
	res.json({ message: 'Hostel Entry Exit System API is running (Brevo Powered)' });
});

// Diagnostics route to validate email transport setup.
// Usage: GET /api/test-email?to=you@example.com
app.get('/api/test-email', async (req, res) => {
	const to = String(req.query.to || process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || '').trim();

	if (!to) {
		return res.status(400).json({
			success: false,
			message: 'Missing recipient email. Pass ?to=you@example.com in URL query parameter.',
		});
	}

	try {
		await sendEmail({
			to,
			subject: 'HostelQR Brevo Email Test',
			text: 'If you received this email, Brevo Email API service is working correctly.',
			html: '<p>If you received this email, <strong>Brevo Email API service</strong> is working correctly.</p>',
		});

		return res.json({
			success: true,
			message: 'Test email sent successfully via Brevo',
			to,
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: 'Failed to send test email via Brevo',
			error: err?.message || 'Unknown email error',
		});
	}
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/face', faceRoutes);

// Fallback + error handling
app.use(notFound);
app.use(errorHandler);

export default app;
