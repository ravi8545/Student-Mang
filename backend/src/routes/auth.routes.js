import { Router } from 'express';

import {
	getMe,
	getMyQr,
	studentLogin,
	studentSignup,
	verifyEmail,
} from '../controllers/auth.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import {
	studentLoginValidator,
	studentSignupValidator,
} from '../validators/auth.validators.js';

const router = Router();

// Student auth
router.post('/signup', studentSignupValidator, studentSignup);
// Alias (many clients call this "register")
router.post('/register', studentSignupValidator, studentSignup);
router.post('/login', studentLoginValidator, studentLogin);
router.get('/verify-email', verifyEmail);

// Student protected
router.get('/me', protect, requireRole('student'), getMe);
router.get('/me/qr', protect, requireRole('student'), getMyQr);

export default router;
