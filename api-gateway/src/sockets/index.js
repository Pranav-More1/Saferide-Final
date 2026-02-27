/**
 * ============================================
 * GuardianSync v2.0 - Socket.io Handler
 * ============================================
 * 
 * Real-time communication for:
 * - Bus location tracking
 * - Boarding event notifications
 * - Live status updates
 * 
 * ARCHITECTURE:
 * - Drivers emit location updates
 * - Server broadcasts to bus-specific rooms
 * - Parents subscribe to their children's buses
 * - Database writes are throttled/batched
 * 
 * SCALING CONSIDERATION:
 * For horizontal scaling, use Redis adapter:
 * const { createAdapter } = require('@socket.io/redis-adapter');
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { User, Bus, BusLocation, Student } from '../models/index.js';
import logger from '../utils/logger.js';

// ============================================
// State Management
// ============================================

// Throttle tracking for location updates per bus
// Prevents database flooding from rapid location updates
const locationThrottleMap = new Map();

// Track connected users for monitoring
const connectedUsers = new Map();

// ============================================
// Socket.io Initialization
// ============================================

/**
 * Initialize Socket.io server with authentication and handlers.
 * 
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.socket.corsOrigins,
      credentials: true,
    },
    // Connection options
    pingTimeout: 60000,
    pingInterval: 25000,
    // Limit payload size
    maxHttpBufferSize: 1e6, // 1MB
  });

  // ==========================================
  // Authentication Middleware
  // ==========================================
  
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT
      const decoded = jwt.verify(token, config.jwt.secret);

      // Fetch user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // Attach user to socket
      socket.user = user;
      socket.userId = user._id.toString();
      socket.userRole = user.role;

      logger.info(`Socket authenticated: ${user.email} (${user.role})`);
      next();
    } catch (error) {
      logger.warn('Socket authentication failed:', error.message);
      next(new Error('Invalid token'));
    }
  });

  // ==========================================
  // Connection Handler
  // ==========================================

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.userId} (${socket.userRole})`);

    // Track connected user
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      role: socket.userRole,
      connectedAt: new Date(),
    });

    // ==========================================
    // Room Management
    // ==========================================

    /**
     * Drivers join their assigned bus room.
     * Parents join rooms for their children's buses.
     * Admins can join any room.
     */
    
    // Auto-join based on role
    handleAutoJoin(socket);

    // Manual room subscription
    socket.on('subscribe:bus', async (busId) => {
      await handleBusSubscription(socket, busId);
    });

    socket.on('unsubscribe:bus', (busId) => {
      socket.leave(`bus:${busId}`);
      logger.debug(`Socket ${socket.userId} left bus room: ${busId}`);
    });

    // ==========================================
    // Driver Events
    // ==========================================

    if (socket.userRole === 'driver') {
      // Location update from driver
      socket.on('location:update', async (data) => {
        await handleLocationUpdate(io, socket, data);
      });

      // Driver starting/ending trip
      socket.on('trip:start', async (data) => {
        await handleTripStart(io, socket, data);
      });

      socket.on('trip:end', async (data) => {
        await handleTripEnd(io, socket, data);
      });

      // Student scan events (Four-Step Commute)
      socket.on('student:scan', async (data) => {
        await handleStudentScan(io, socket, data);
      });

      // Legacy events (backwards compatibility)
      socket.on('student:boarded', async (data) => {
        await handleStudentScan(io, socket, { ...data, scanType: 'morning_pickup' });
      });

      socket.on('student:dropped', async (data) => {
        await handleStudentScan(io, socket, { ...data, scanType: 'evening_dropoff' });
      });
    }

    // ==========================================
    // Parent Events
    // ==========================================

    if (socket.userRole === 'parent') {
      // Request current location
      socket.on('location:request', async (busId) => {
        await handleLocationRequest(socket, busId);
      });
    }

    // ==========================================
    // Admin Events
    // ==========================================

    if (socket.userRole === 'admin') {
      // Get all active buses
      socket.on('buses:status', async () => {
        await handleBusesStatus(socket);
      });
    }

    // ==========================================
    // Disconnection
    // ==========================================

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.userId} (${reason})`);
      connectedUsers.delete(socket.userId);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.userId}:`, error);
    });
  });

  logger.info('✅ Socket.io initialized');
  return io;
};

// ============================================
// Handler Functions
// ============================================

/**
 * Auto-join appropriate rooms based on user role.
 */
async function handleAutoJoin(socket) {
  try {
    if (socket.userRole === 'driver') {
      // Join assigned bus room
      const user = await User.findById(socket.userId);
      if (user.assignedBus) {
        socket.join(`bus:${user.assignedBus}`);
        socket.join('drivers'); // All drivers room for broadcasts
        logger.debug(`Driver ${socket.userId} joined bus room: ${user.assignedBus}`);
      }
    } else if (socket.userRole === 'parent') {
      // Join rooms for all children's buses
      const user = await User.findById(socket.userId).populate('children', 'assignedBus');
      const busIds = new Set();
      
      for (const child of user.children || []) {
        if (child.assignedBus) {
          busIds.add(child.assignedBus.toString());
        }
      }
      
      for (const busId of busIds) {
        socket.join(`bus:${busId}`);
        logger.debug(`Parent ${socket.userId} joined bus room: ${busId}`);
      }
    } else if (socket.userRole === 'admin') {
      // Admins join admin room for system-wide events
      socket.join('admins');
    }
  } catch (error) {
    logger.error('Auto-join error:', error);
  }
}

/**
 * Handle manual bus subscription with access control.
 */
async function handleBusSubscription(socket, busId) {
  try {
    // Verify bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      socket.emit('error', { message: 'Bus not found' });
      return;
    }

    // Access control
    if (socket.userRole === 'parent') {
      // Parents can only subscribe to their children's buses
      const user = await User.findById(socket.userId).populate('children', 'assignedBus');
      const hasAccess = user.children.some(
        child => child.assignedBus?.toString() === busId
      );
      
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to this bus' });
        return;
      }
    }

    socket.join(`bus:${busId}`);
    socket.emit('subscribed', { busId, busNumber: bus.busNumber });
    logger.debug(`Socket ${socket.userId} subscribed to bus: ${busId}`);
  } catch (error) {
    logger.error('Bus subscription error:', error);
    socket.emit('error', { message: 'Subscription failed' });
  }
}

/**
 * Handle location update from driver.
 * Implements throttling to prevent database flooding.
 */
async function handleLocationUpdate(io, socket, data) {
  try {
    const { busId, latitude, longitude, speed, heading, accuracy } = data;

    // Validate data
    if (!busId || latitude === undefined || longitude === undefined) {
      socket.emit('error', { message: 'Invalid location data' });
      return;
    }

    // Access control - verify driver is assigned to this bus
    const user = await User.findById(socket.userId);
    if (user.assignedBus?.toString() !== busId) {
      socket.emit('error', { message: 'Not authorized for this bus' });
      return;
    }

    const locationData = {
      busId,
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      accuracy,
      driverId: socket.userId,
      timestamp: new Date(),
    };

    // ==========================================
    // Broadcast to subscribers (always)
    // ==========================================
    // Real-time broadcast happens immediately
    io.to(`bus:${busId}`).emit('location:updated', {
      busId,
      location: {
        latitude,
        longitude,
        speed,
        heading,
      },
      timestamp: locationData.timestamp,
    });

    // ==========================================
    // Throttled database write
    // ==========================================
    // Only write to DB every N milliseconds to prevent flooding
    
    const lastWrite = locationThrottleMap.get(busId);
    const now = Date.now();
    const throttleMs = config.socket.locationThrottleMs;

    if (!lastWrite || (now - lastWrite) >= throttleMs) {
      // Write to database
      await BusLocation.recordLocation(locationData);
      locationThrottleMap.set(busId, now);
      logger.debug(`Location saved to DB for bus ${busId}`);
    }

  } catch (error) {
    logger.error('Location update error:', error);
    socket.emit('error', { message: 'Location update failed' });
  }
}

/**
 * Handle trip start event.
 */
async function handleTripStart(io, socket, data) {
  try {
    const { busId, tripType } = data; // tripType: 'morning' or 'afternoon'

    const bus = await Bus.findById(busId);
    if (!bus) {
      socket.emit('error', { message: 'Bus not found' });
      return;
    }

    // Update bus status
    bus.status = 'en_route';
    await bus.save();

    // Notify subscribers
    io.to(`bus:${busId}`).emit('trip:started', {
      busId,
      busNumber: bus.busNumber,
      tripType,
      startTime: new Date(),
    });

    // Notify admins
    io.to('admins').emit('bus:status-changed', {
      busId,
      busNumber: bus.busNumber,
      status: 'en_route',
    });

    logger.info(`Trip started: Bus ${bus.busNumber} (${tripType})`);
  } catch (error) {
    logger.error('Trip start error:', error);
    socket.emit('error', { message: 'Failed to start trip' });
  }
}

/**
 * Handle trip end event.
 */
async function handleTripEnd(io, socket, data) {
  try {
    const { busId } = data;

    const bus = await Bus.findById(busId);
    if (!bus) return;

    bus.status = 'completed';
    await bus.save();

    io.to(`bus:${busId}`).emit('trip:ended', {
      busId,
      busNumber: bus.busNumber,
      endTime: new Date(),
    });

    io.to('admins').emit('bus:status-changed', {
      busId,
      busNumber: bus.busNumber,
      status: 'completed',
    });

    logger.info(`Trip ended: Bus ${bus.busNumber}`);
  } catch (error) {
    logger.error('Trip end error:', error);
  }
}

/**
 * Handle student scan event (Four-Step Commute Logic).
 * Unified handler for all scan types: morning_pickup, morning_dropoff, evening_pickup, evening_dropoff
 */
async function handleStudentScan(io, socket, data) {
  try {
    const { studentId, busId, location, scanType = 'morning_pickup' } = data;

    const student = await Student.findById(studentId)
      .populate('parents', '_id');

    if (!student) {
      socket.emit('error', { message: 'Student not found' });
      return;
    }

    // Validate scan sequence (Four-Step validation)
    const validationResult = student.validateScanSequence(scanType);
    if (!validationResult.valid) {
      socket.emit('scan:validation-error', {
        studentId: student._id,
        studentName: student.name,
        scanType,
        message: validationResult.message,
        requiredPrevious: validationResult.requiredPrevious,
      });
      return;
    }

    // Update student status using Four-Step logic
    const updateResult = await student.updateBoardingStatus(scanType, {
      location: location ? {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      } : undefined,
      busId,
      verifiedBy: socket.userId,
    });

    // Human-readable scan type
    const scanTypeDisplay = scanType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    // Messages for each scan type
    const scanMessages = {
      morning_pickup: `${student.name} has been picked up for school`,
      morning_dropoff: `${student.name} has arrived at school`,
      evening_pickup: `${student.name} has been picked up from school`,
      evening_dropoff: `${student.name} has arrived home safely`,
    };

    const eventData = {
      studentId: student._id,
      studentName: student.name,
      scanType,
      scanTypeDisplay,
      status: updateResult.status,
      timestamp: new Date(),
      busId,
    };

    // Notify bus room (including parents)
    io.to(`bus:${busId}`).emit('student:status-changed', eventData);

    // Direct notification to parents
    for (const parent of student.parents || []) {
      const parentSocket = connectedUsers.get(parent._id.toString());
      if (parentSocket) {
        io.to(parentSocket.socketId).emit('child:scan', {
          ...eventData,
          message: scanMessages[scanType] || `${student.name} - ${scanTypeDisplay}`,
        });
      }
    }

    // Confirm to driver
    socket.emit('scan:success', {
      ...eventData,
      message: `${student.name} - ${scanTypeDisplay} recorded`,
    });

    logger.info(`Student scan: ${student.name} - ${scanType} on bus ${busId}`);
  } catch (error) {
    logger.error('Student scan error:', error);
    socket.emit('scan:error', { message: 'Failed to record scan' });
  }
}

/**
 * Handle location request from parent.
 */
async function handleLocationRequest(socket, busId) {
  try {
    const location = await BusLocation.getLatestLocation(busId);
    const bus = await Bus.findById(busId);

    socket.emit('location:current', {
      busId,
      busNumber: bus?.busNumber,
      status: bus?.status,
      location: location ? {
        latitude: location.location.coordinates[1],
        longitude: location.location.coordinates[0],
        speed: location.speed,
        heading: location.heading,
        timestamp: location.timestamp,
      } : null,
    });
  } catch (error) {
    logger.error('Location request error:', error);
    socket.emit('error', { message: 'Failed to get location' });
  }
}

/**
 * Handle buses status request from admin.
 */
async function handleBusesStatus(socket) {
  try {
    const buses = await Bus.find({ isActive: true })
      .populate('driver', 'name')
      .lean();

    const busesWithLocation = await Promise.all(
      buses.map(async (bus) => {
        const location = await BusLocation.getLatestLocation(bus._id);
        return {
          id: bus._id,
          busNumber: bus.busNumber,
          routeName: bus.routeName,
          status: bus.status,
          driver: bus.driver?.name,
          lastLocation: location ? {
            coordinates: location.location.coordinates,
            timestamp: location.timestamp,
          } : null,
        };
      })
    );

    socket.emit('buses:status', busesWithLocation);
  } catch (error) {
    logger.error('Buses status error:', error);
  }
}

export default { initializeSocket };
