import { Router } from 'express';

import { adminLogin } from '../controllers/auth.controller.js';
import {
	getAllAttendanceLogs,
	getAllStudentsWithLiveStatus,
	getDashboardStats,
	manualMarkAttendance,
	exportAttendanceCsv,
	rebuildFaceDescriptors,
} from '../controllers/admin.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { adminLoginValidator } from '../validators/auth.validators.js';

const router = Router();

// Admin/Guard login
router.post('/login', adminLoginValidator, adminLogin);

// Admin protected data & actions
router.get('/students', protect, requireRole('admin'), getAllStudentsWithLiveStatus);
router.get('/attendance', protect, requireRole('admin'), getAllAttendanceLogs);
router.get('/stats', protect, requireRole('admin'), getDashboardStats);
router.post('/manual-scan', protect, requireRole('admin'), manualMarkAttendance);
router.get('/export', protect, requireRole('admin'), exportAttendanceCsv);
router.post('/rebuild-faces', protect, requireRole('admin'), rebuildFaceDescriptors);

export default router;
