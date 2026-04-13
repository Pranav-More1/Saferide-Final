import { Router } from 'express';
import { getStats, getRecentActivity } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Protect all routes with authentication
router.use(authenticate);

/**
 * @route GET /api/v1/dashboard/stats
 * @desc Get key statistics for the dashboard
 * @access Admin
 */
router.get('/stats', authorize('admin'), getStats);

/**
 * @route GET /api/v1/dashboard/activity
 * @desc Get recent scan activity for the dashboard
 * @access Admin
 */
router.get('/activity', authorize('admin'), getRecentActivity);

export default router;
