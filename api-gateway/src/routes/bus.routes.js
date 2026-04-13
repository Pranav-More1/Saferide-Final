/**
 * ============================================
 * GuardianSync v2.0 - Bus Routes
 * ============================================
 */

import { Router } from 'express';
import { Bus, BusLocation } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBusSchema, updateBusLocationSchema, objectIdSchema } from '../validators/schemas.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Bus CRUD Routes
// ============================================

/**
 * @route GET /api/v1/buses
 * @desc Get all buses
 * @access Admin, Driver
 */
router.get(
  '/',
  authorize('admin', 'driver'),
  asyncHandler(async (req, res) => {
    const buses = await Bus.find({ isActive: true })
      .populate('driver', 'name email phone')
      .populate('studentCount')
      .lean();

    res.json({
      success: true,
      data: buses,
      buses: buses, // Alias for frontend compatibility
    });
  })
);

/**
 * @route POST /api/v1/buses
 * @desc Create a new bus
 * @access Admin
 */
router.post(
  '/',
  authorize('admin'),
  validate(createBusSchema),
  asyncHandler(async (req, res) => {
    const bus = await Bus.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      data: bus,
    });
  })
);

/**
 * @route GET /api/v1/buses/:id
 * @desc Get bus by ID
 * @access Admin, Driver
 */
router.get(
  '/:id',
  authorize('admin', 'driver'),
  asyncHandler(async (req, res) => {
    const bus = await Bus.findById(req.params.id)
      .populate('driver', 'name email phone')
      .populate('studentCount');

    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }

    res.json({
      success: true,
      data: bus,
    });
  })
);

/**
 * @route GET /api/v1/buses/locations
 * @desc Get latest location for all active buses
 * @access Admin
 */
router.get(
  '/locations',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    // Find buses that are en_route
    const activeBuses = await Bus.find({ status: 'en_route', isActive: true });
    
    // For each, get latest location
    const locations = await Promise.all(
      activeBuses.map(async (bus) => {
        const location = await BusLocation.getLatestLocation(bus._id);
        if (!location) return null;
        return {
          busId: bus._id,
          busNumber: bus.busNumber,
          driver: bus.driver,
          latitude: location.location.coordinates[1],
          longitude: location.location.coordinates[0],
          speed: location.speed,
          heading: location.heading,
          lastUpdate: location.timestamp
        };
      })
    );

    res.json({
      success: true,
      locations: locations.filter(loc => loc !== null) // Filter out buses with no location updates yet
    });
  })
);

/**
 * @route GET /api/v1/buses/:id/location

 * @desc Get latest location for a bus
 * @access Admin, Driver, Parent (if child on bus)
 */
router.get(
  '/:id/location',
  authorize('admin', 'driver', 'parent'),
  asyncHandler(async (req, res) => {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }

    const location = await BusLocation.getLatestLocation(req.params.id);

    res.json({
      success: true,
      data: {
        bus: {
          id: bus._id,
          busNumber: bus.busNumber,
          status: bus.status,
        },
        location: location ? {
          coordinates: location.location.coordinates,
          speed: location.speed,
          heading: location.heading,
          timestamp: location.timestamp,
        } : null,
      },
    });
  })
);

/**
 * @route GET /api/v1/buses/:id/location/history
 * @desc Get location history for a bus
 * @access Admin
 */
router.get(
  '/:id/location/history',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { startTime, endTime } = req.query;

    const start = startTime ? new Date(startTime) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endTime ? new Date(endTime) : new Date();

    const history = await BusLocation.getLocationHistory(req.params.id, start, end);

    res.json({
      success: true,
      data: history.map(loc => ({
        coordinates: loc.location.coordinates,
        speed: loc.speed,
        heading: loc.heading,
        timestamp: loc.timestamp,
      })),
    });
  })
);

/**
 * @route PUT /api/v1/buses/:id
 * @desc Update a bus
 * @access Admin
 */
router.put(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('driver', 'name email phone');

    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }

    res.json({
      success: true,
      message: 'Bus updated successfully',
      data: bus,
    });
  })
);

/**
 * @route DELETE /api/v1/buses/:id
 * @desc Delete a bus (soft delete)
 * @access Admin
 */
router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }

    res.json({
      success: true,
      message: 'Bus deleted successfully',
    });
  })
);

export default router;
