/**
 * ============================================
 * GuardianSync v2.0 - Parent Routes
 * ============================================
 * 
 * Routes for parent portal functionality:
 * - View children information
 * - Track bus location
 * - View attendance history
 * - Manage notifications
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/index.js';
import Student from '../models/Student.model.js';
import Bus from '../models/Bus.model.js';
import BusLocation from '../models/BusLocation.model.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================
// Middleware: All parent routes require authentication
// ============================================

router.use(authenticate);
router.use(authorize('parent'));

// ============================================
// Children Management Routes
// ============================================

/**
 * GET /children
 * Get all children linked to the authenticated parent
 */
router.get('/children', async (req, res, next) => {
  try {
    const parentId = req.user._id;
    const parentEmail = req.user.email;

    // Find all students where this parent is linked via ID or email
    const children = await Student.find({
      isActive: true,
      $or: [
        { primaryGuardian: parentId },
        { parents: parentId },
        { parentEmail: parentEmail }
      ]
    })
      .populate('assignedBus', 'busNumber routeName status driverName')
      .select('-faceEncoding') // Exclude face encoding for privacy
      .lean();

    logger.info(`Parent ${parentId} (${parentEmail}) fetched ${children.length} children`);
    
    res.json({ 
      success: true, 
      children: children
    });
  } catch (error) {
    logger.error('Failed to fetch parent children:', error);
    next(error);
  }
});

/**
 * GET /children/:id
 * Get detailed information about a specific child
 */
router.get('/children/:id', async (req, res, next) => {
  try {
    const parentId = req.user._id;
    const parentEmail = req.user.email;
    const { id } = req.params;

    const child = await Student.findOne({
      _id: id,
      isActive: true,
      $or: [
        { primaryGuardian: parentId },
        { parents: parentId },
        { parentEmail: parentEmail }
      ]
    })
      .populate('assignedBus')
      .populate('primaryGuardian', 'name email phone')
      .select('-faceEncoding')
      .lean();

    if (!child) {
      return res.status(404).json({ 
        success: false, 
        error: 'Child not found or you do not have access' 
      });
    }

    logger.info(`Parent ${parentId} fetched child ${id}`);
    
    res.json({ 
      success: true, 
      data: child 
    });
  } catch (error) {
    logger.error('Failed to fetch child:', error);
    next(error);
  }
});

/**
 * GET /children/:id/history
 * Get attendance history for a specific child
 */
router.get('/children/:id/history', async (req, res, next) => {
  try {
    const parentId = req.user._id;
    const parentEmail = req.user.email;
    const { id } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    // Verify parent has access to this child
    const child = await Student.findOne({
      _id: id,
      isActive: true,
      $or: [
        { primaryGuardian: parentId },
        { parents: parentId },
        { parentEmail: parentEmail }
      ]
    }).select('_id attendanceHistory');

    if (!child) {
      return res.status(404).json({ 
        success: false, 
        error: 'Child not found or you do not have access' 
      });
    }

    // Filter attendance history
    let history = child.attendanceHistory || [];
    
    if (startDate || endDate) {
      history = history.filter(record => {
        const recordDate = new Date(record.date);
        if (startDate && recordDate < new Date(startDate)) return false;
        if (endDate && recordDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by date descending and limit
    history = history
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    logger.info(`Parent ${parentId} fetched history for child ${id}`);
    
    res.json({ 
      success: true, 
      data: history 
    });
  } catch (error) {
    logger.error('Failed to fetch child history:', error);
    next(error);
  }
});

/**
 * GET /children/:id/bus-location
 * Get live bus location for a child's assigned bus
 */
router.get('/children/:id/bus-location', async (req, res, next) => {
  try {
    const parentId = req.user._id;
    const parentEmail = req.user.email;
    const { id } = req.params;

    // Verify parent has access and get assigned bus
    const child = await Student.findOne({
      _id: id,
      isActive: true,
      $or: [
        { primaryGuardian: parentId },
        { parents: parentId },
        { parentEmail: parentEmail }
      ]
    }).select('assignedBus');

    if (!child) {
      return res.status(404).json({ 
        success: false, 
        error: 'Child not found or you do not have access' 
      });
    }

    if (!child.assignedBus) {
      return res.status(404).json({ 
        success: false, 
        error: 'No bus assigned to this child' 
      });
    }

    // Get latest bus location
    const location = await BusLocation.findOne({ busId: child.assignedBus })
      .sort({ timestamp: -1 })
      .populate('busId', 'busNumber routeName')
      .lean();

    if (!location) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bus location not available' 
      });
    }

    logger.info(`Parent ${parentId} fetched bus location for child ${id}`);
    
    res.json({ 
      success: true, 
      data: location 
    });
  } catch (error) {
    logger.error('Failed to fetch bus location:', error);
    next(error);
  }
});

// ============================================
// Notification Routes (Stubs for future implementation)
// ============================================

/**
 * GET /notifications
 * Get all notifications for the parent
 */
router.get('/notifications', async (req, res, next) => {
  try {
    // TODO: Implement with Notification model
    logger.info(`Parent ${req.user._id} fetched notifications`);
    
    res.json({ 
      success: true, 
      data: [] 
    });
  } catch (error) {
    logger.error('Failed to fetch notifications:', error);
    next(error);
  }
});

/**
 * PUT /notifications/:id/read
 * Mark a notification as read
 */
router.put('/notifications/:id/read', async (req, res, next) => {
  try {
    // TODO: Implement with Notification model
    logger.info(`Parent ${req.user._id} marked notification ${req.params.id} as read`);
    
    res.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });
  } catch (error) {
    logger.error('Failed to mark notification as read:', error);
    next(error);
  }
});

/**
 * PUT /notifications/read-all
 * Mark all notifications as read
 */
router.put('/notifications/read-all', async (req, res, next) => {
  try {
    // TODO: Implement with Notification model
    logger.info(`Parent ${req.user._id} marked all notifications as read`);
    
    res.json({ 
      success: true, 
      message: 'All notifications marked as read' 
    });
  } catch (error) {
    logger.error('Failed to mark all notifications as read:', error);
    next(error);
  }
});

/**
 * GET /notification-settings
 * Get parent notification preferences
 */
router.get('/notification-settings', async (req, res, next) => {
  try {
    // TODO: Implement with User model preferences
    logger.info(`Parent ${req.user._id} fetched notification settings`);
    
    res.json({
      success: true,
      data: {
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        boardingAlerts: true,
        arrivalAlerts: true,
        delayAlerts: true,
        absenteeAlerts: true,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch notification settings:', error);
    next(error);
  }
});

/**
 * PUT /notification-settings
 * Update parent notification preferences
 */
router.put('/notification-settings', async (req, res, next) => {
  try {
    // TODO: Persist settings to User model
    logger.info(`Parent ${req.user._id} updated notification settings`);
    
    res.json({ 
      success: true, 
      data: req.body 
    });
  } catch (error) {
    logger.error('Failed to update notification settings:', error);
    next(error);
  }
});

export default router;
