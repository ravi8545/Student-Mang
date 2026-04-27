import { Router } from 'express';

import { registerFace, verifyFace } from '../controllers/face.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { faceRegisterValidator, faceVerifyValidator } from '../validators/face.validators.js';

const router = Router();

router.post('/register', protect, requireRole('student'), faceRegisterValidator, registerFace);
router.post('/verify', protect, requireRole('admin'), faceVerifyValidator, verifyFace);

export default router;