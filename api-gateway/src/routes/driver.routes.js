<<<<<<< HEAD
/**
 * ============================================
 * GuardianSync v2.0 - Driver Routes
 * ============================================
 *
 * Endpoints consumed by the SafeRide Driver mobile app.
 *
 * GET  /api/v1/driver/route          - Get driver's current route / bus info & today's stats
 * GET  /api/v1/driver/students       - Get students assigned to driver's bus
 * POST /api/v1/driver/route/start    - Mark route as started (en_route)
 * POST /api/v1/driver/route/end      - Mark route as completed
 * POST /api/v1/driver/location       - Update bus GPS location
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { Bus, BusLocation, Student } from '../models/index.js';

const router = Router();

// All driver routes require authentication + driver (or admin) role
router.use(authenticate);
router.use(authorize('driver', 'admin'));

// ============================================
// GET /api/v1/driver/route
// Returns bus info + real-time today's attendance stats
// ============================================
router.get(
  '/route',
  asyncHandler(async (req, res) => {
    // Find the bus assigned to this driver
    const bus = await Bus.findOne({ driver: req.user._id, isActive: true }).lean();

    if (!bus) {
      // No bus assigned — return graceful empty state
      return res.json({
        success: true,
        data: {
          active: false,
          totalStudents: 0,
          pickedUp: 0,
          droppedOff: 0,
          onBus: 0,
          bus: null,
        },
      });
    }

    // Count all active students on this bus
    const totalStudents = await Student.countDocuments({
      assignedBus: bus._id,
      isActive: true,
    });

    // Get today's attendance counts from boardingStatus field
    // boardingStatus values: not_boarded | morning_picked_up | at_school | evening_picked_up | dropped_home | absent
    const [pickedUpCount, droppedOffCount, onBusCount] = await Promise.all([
      // Picked up = ever boarded today (morning_picked_up, at_school, evening_picked_up, dropped_home)
      Student.countDocuments({
        assignedBus: bus._id,
        isActive: true,
        boardingStatus: { $in: ['morning_picked_up', 'at_school', 'evening_picked_up', 'dropped_home'] },
      }),
      // Dropped off at school = at_school or beyond
      Student.countDocuments({
        assignedBus: bus._id,
        isActive: true,
        boardingStatus: { $in: ['at_school', 'evening_picked_up', 'dropped_home'] },
      }),
      // Currently on bus = morning_picked_up or evening_picked_up
      Student.countDocuments({
        assignedBus: bus._id,
        isActive: true,
        boardingStatus: { $in: ['morning_picked_up', 'evening_picked_up'] },
      }),
    ]);

    // Bus is "active" when it's en_route, at_stop, or returning
    const activeStatuses = ['en_route', 'at_stop', 'returning'];
    const isActive = activeStatuses.includes(bus.status);

    res.json({
      success: true,
      data: {
        active: isActive,
        totalStudents,
        pickedUp: pickedUpCount,
        droppedOff: droppedOffCount,
        onBus: onBusCount,
        bus: {
          id: bus._id,
          busNumber: bus.busNumber,
          routeName: bus.routeName,
          status: bus.status,
        },
      },
    });
  })
);

// ============================================
// GET /api/v1/driver/students
// Returns all students on the driver's bus with live boardingStatus
// ============================================
router.get(
  '/students',
  asyncHandler(async (req, res) => {
    const bus = await Bus.findOne({ driver: req.user._id, isActive: true }).lean();

    if (!bus) {
      return res.json({ success: true, students: [] });
    }

    const students = await Student.find({ assignedBus: bus._id, isActive: true })
      .select('name studentId grade section photoUrl boardingStatus pickupLocation lastBoardingEvent')
      .lean();

    // Normalize for the mobile app
    const normalized = students.map((s) => ({
      _id: s._id,
      name: s.name,
      studentId: s.studentId,
      grade: s.grade,
      section: s.section,
      photoUrl: s.photoUrl,
      boardingStatus: s.boardingStatus || 'not_boarded',
      address: s.pickupLocation?.address || '',
      lastEvent: s.lastBoardingEvent?.scanType || null,
    }));

    res.json({
      success: true,
      students: normalized,
    });
  })
);

// ============================================
// POST /api/v1/driver/route/start
// Sets bus status to en_route
// ============================================
router.post(
  '/route/start',
  asyncHandler(async (req, res) => {
    const bus = await Bus.findOneAndUpdate(
      { driver: req.user._id, isActive: true },
      { status: 'en_route' },
      { new: true }
    );

    if (!bus) {
      throw new ApiError(404, 'No bus assigned to this driver');
    }

    const io = req.app.locals.io;
    if (io) {
      io.emit('bus:status_changed', { busId: bus._id, status: 'en_route' });
    }

    res.json({
      success: true,
      message: 'Route started successfully',
      data: { busId: bus._id, status: bus.status },
    });
  })
);

// ============================================
// POST /api/v1/driver/route/end
// Sets bus status to completed
// ============================================
router.post(
  '/route/end',
  asyncHandler(async (req, res) => {
    const bus = await Bus.findOneAndUpdate(
      { driver: req.user._id, isActive: true },
      { status: 'completed' },
      { new: true }
    );

    if (!bus) {
      throw new ApiError(404, 'No bus assigned to this driver');
    }

    const io = req.app.locals.io;
    if (io) {
      io.emit('bus:status_changed', { busId: bus._id, status: 'completed' });
    }

    res.json({
      success: true,
      message: 'Route ended successfully',
      data: { busId: bus._id, status: bus.status },
    });
  })
);

// ============================================
// POST /api/v1/driver/location
// Saves GPS coordinates and broadcasts to parent clients
// ============================================
router.post(
  '/location',
  asyncHandler(async (req, res) => {
    const { latitude, longitude, speed, heading } = req.body;

    if (latitude === undefined || longitude === undefined) {
      throw new ApiError(400, 'latitude and longitude are required');
    }

    const bus = await Bus.findOne({ driver: req.user._id, isActive: true }).lean();

    if (!bus) {
      throw new ApiError(404, 'No bus assigned to this driver');
    }

    const locationRecord = await BusLocation.create({
      bus: bus._id,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
      },
      speed: speed || 0,
      heading: heading || 0,
      timestamp: new Date(),
    });

    // Broadcast real-time location to parents subscribed to this bus
    const io = req.app.locals.io;
    if (io) {
      io.to(`bus:${bus._id}`).emit('bus:location_updated', {
        busId: bus._id,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: locationRecord.timestamp,
      });
    }

    res.json({ success: true, message: 'Location updated' });
  })
);
=======
import { Router } from 'express';
import { 
  getCurrentRoute, 
  getStudentsList, 
  startRoute, 
  endRoute, 
  updateLocation 
} from '../controllers/driver.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Only drivers can access these endpoints
router.use(authenticate, authorize('driver'));

router.get('/route', getCurrentRoute);
router.get('/students', getStudentsList);
router.post('/route/start', startRoute);
router.post('/route/end', endRoute);
router.post('/location', updateLocation);
>>>>>>> friend/main

export default router;
