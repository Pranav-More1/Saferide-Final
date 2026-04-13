import { Bus, Student, BusLocation } from '../models/index.js';

/**
 * Get the current route stats for the logged-in driver
 */
export const getCurrentRoute = async (req, res) => {
  try {
    const driverId = req.user._id;
    const bus = await Bus.findOne({ driver: driverId, isActive: true });

    if (!bus) {
      return res.status(404).json({ success: false, error: 'No bus assigned to this driver' });
    }

    // Get all students assigned to this bus
    const students = await Student.find({ assignedBus: bus._id, isActive: true });
    
    let pickedUp = 0;
    let droppedOff = 0;
    
    // We check their current status
    students.forEach(student => {
      if (['morning_picked_up', 'evening_picked_up', 'at_school'].includes(student.boardingStatus)) {
        pickedUp++;
      }
      if (student.boardingStatus === 'dropped_home') {
        droppedOff++;
      }
    });

    res.json({
      success: true,
      data: {
        busId: bus._id,
        busNumber: bus.busNumber,
        active: bus.status !== 'inactive' && bus.status !== 'completed',
        totalStudents: students.length,
        pickedUp,
        droppedOff
      }
    });
  } catch (error) {
    console.error('Error fetching driver route:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch route data' });
  }
};

/**
 * Get all students for the current driver's bus
 */
export const getStudentsList = async (req, res) => {
  try {
    const driverId = req.user._id;
    const bus = await Bus.findOne({ driver: driverId, isActive: true });

    if (!bus) {
      return res.json({ success: true, data: { students: [] } });
    }

    const students = await Student.find({ assignedBus: bus._id, isActive: true })
      .select('name grade section boardingStatus pickupLocation dropoffLocation');

    // Format for mobile app
    const formattedStudents = students.map(s => ({
      _id: s._id,
      name: s.name,
      grade: s.grade,
      boardingStatus: s.boardingStatus,
      address: s.pickupLocation?.address || 'No address provided'
    }));

    res.json({
      success: true,
      data: { students: formattedStudents }
    });
  } catch (error) {
    console.error('Error fetching students list:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch students list' });
  }
};

/**
 * Start the route (mark bus as active)
 */
export const startRoute = async (req, res) => {
  try {
    const driverId = req.user._id;
    const bus = await Bus.findOne({ driver: driverId, isActive: true });

    if (!bus) {
      return res.status(404).json({ success: false, error: 'No bus assigned' });
    }

    bus.status = 'en_route';
    await bus.save();

    res.json({ success: true, message: 'Route started perfectly' });
  } catch (error) {
    console.error('Error starting route stack:', error.stack || error.message);
    res.status(500).json({ success: false, error: 'Failed to start route', msg: error.message });
  }
};

/**
 * End the route (mark bus as inactive)
 */
export const endRoute = async (req, res) => {
  try {
    const driverId = req.user._id;
    const bus = await Bus.findOne({ driver: driverId, isActive: true });

    if (!bus) {
      return res.status(404).json({ success: false, error: 'No bus assigned' });
    }

    bus.status = 'inactive';
    await bus.save();

    res.json({ success: true, message: 'Route ended perfectly' });
  } catch (error) {
    console.error('Error ending route:', error);
    res.status(500).json({ success: false, error: 'Failed to end route' });
  }
};

/**
 * Handle live location updates via HTTP
 * (Saves to DB and broadcasts via Socket.IO)
 */
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, speed, heading } = req.body;
    const driverId = req.user._id;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, error: 'Missing coordinates' });
    }

    const bus = await Bus.findOne({ driver: driverId, isActive: true });

    if (!bus) {
      return res.status(404).json({ success: false, error: 'No bus assigned' });
    }

    // Attempt to save to BusLocation model (historical)
    await BusLocation.recordLocation({
      busId: bus._id,
      longitude,
      latitude,
      speed: speed || 0,
      heading: heading || 0,
      driverId
    });

    // Broadcast live location to Socket.io namespace
    const locationData = {
      busId: bus._id,
      busNumber: bus.busNumber,
      driver: req.user.name,
      latitude,
      longitude,
      speed: speed || 0,
      lastUpdate: new Date().toISOString()
    };

    if (req.app.locals.io) {
      req.app.locals.io.emit('bus-location-update', locationData);
    }

    res.json({ success: true, message: 'Location updated via HTTP API' });
  } catch (error) {
    console.error('Error POST /location:', error.message, error.stack);
    res.status(500).json({ success: false, error: 'Failed to update location' });
  }
};
