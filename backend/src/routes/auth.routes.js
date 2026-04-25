import { Router } from 'express';

import {
	getMe,
	getMyQr,
	resendVerification,
	studentLogin,
	studentSignup,
	updateMyPhoto,
	verifyEmail,
	verifyEmailToken,
} from '../controllers/auth.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import {
	studentLoginValidator,
	resendVerificationValidator,
	studentSignupValidator,
} from '../validators/auth.validators.js';

const router = Router();

// Student auth
router.post('/signup', uploadSingleImage('photo'), studentSignupValidator, studentSignup);
// Alias (many clients call this "register")
router.post('/register', uploadSingleImage('photo'), studentSignupValidator, studentSignup);
router.post('/login', studentLoginValidator, studentLogin);
router.get('/verify/:token', verifyEmailToken);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationValidator, resendVerification);

// Student protected
router.get('/me', protect, requireRole('student'), getMe);
router.post(
	'/me/photo',
	protect,
	requireRole('student'),
	uploadSingleImage('photo'),
	updateMyPhoto
);
router.get('/me/qr', protect, requireRole('student'), getMyQr);

export default router;
