import { Router } from 'express';

import { adminLogin } from '../controllers/auth.controller.js';
import {
	getAllAttendanceLogs,
	getAllStudentsWithLiveStatus,
} from '../controllers/admin.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { adminLoginValidator } from '../validators/auth.validators.js';

const router = Router();

// Admin/Guard login
router.post('/login', adminLoginValidator, adminLogin);

// Admin protected data
router.get('/students', protect, requireRole('admin'), getAllStudentsWithLiveStatus);
router.get('/attendance', protect, requireRole('admin'), getAllAttendanceLogs);

export default router;
