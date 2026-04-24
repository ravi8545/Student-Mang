import { Router } from 'express';

import {
	getMyAttendanceLogs,
	scanQrAndMarkAttendance,
} from '../controllers/attendance.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { scanValidator } from '../validators/attendance.validators.js';

const router = Router();

// Guard/Admin scans QR to mark entry/exit
router.post('/scan', protect, requireRole('admin'), scanValidator, scanQrAndMarkAttendance);

// Student views own logs
router.get('/me', protect, requireRole('student'), getMyAttendanceLogs);

export default router;
