import { Student, Bus, User } from '../models/index.js';

/**
 * Get dashboard statistics for the admin dashboard
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getStats = async (req, res) => {
  try {
    const studentCount = await Student.countDocuments({ isActive: true });
    const driverCount = await User.countDocuments({ role: 'driver', isActive: true });
    const busCount = await Bus.countDocuments({ status: { $ne: 'maintenance' } });
    const activeRouteCount = await Bus.countDocuments({ status: 'active' });

    // Let's get today's stats by querying students' attendanceHistory
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Aggregate scans
    const studentsWithTodayAttendance = await Student.find({
      'attendanceHistory.date': { $gte: startOfDay, $lt: endOfDay }
    }).select('attendanceHistory.$');

    let pickups = 0;
    let dropoffs = 0;

    studentsWithTodayAttendance.forEach(student => {
      const todayRecord = student.attendanceHistory[0];
      if (todayRecord) {
        if (todayRecord.morningPickup?.scanned) pickups++;
        if (todayRecord.eveningPickup?.scanned) pickups++;
        if (todayRecord.morningDropoff?.scanned) dropoffs++;
        if (todayRecord.eveningDropoff?.scanned) dropoffs++;
      }
    });

    const scansToday = pickups + dropoffs;

    res.json({
      students: studentCount,
      drivers: driverCount,
      buses: busCount,
      activeRoutes: activeRouteCount,
      scansToday,
      pickups,
      dropoffs,
    });
  } catch (error) {
    console.error('Error in getStats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
};

/**
 * Get recent activity for the dashboard
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getRecentActivity = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get students who have had activity today
    const students = await Student.find({
      'attendanceHistory.date': { $gte: startOfDay }
    }).populate('assignedBus', 'busNumber').select('name assignedBus attendanceHistory.$');

    const activities = [];

    students.forEach(student => {
      const record = student.attendanceHistory[0];
      if (record) {
        if (record.morningPickup?.scanned) {
          activities.push({
            id: `${student._id}_mp`,
            type: 'pickup',
            student: student.name,
            time: record.morningPickup.timestamp,
            bus: student.assignedBus?.busNumber || 'N/A'
          });
        }
        if (record.morningDropoff?.scanned) {
          activities.push({
            id: `${student._id}_md`,
            type: 'dropoff',
            student: student.name,
            time: record.morningDropoff.timestamp,
            bus: student.assignedBus?.busNumber || 'N/A'
          });
        }
        if (record.eveningPickup?.scanned) {
          activities.push({
            id: `${student._id}_ep`,
            type: 'pickup',
            student: student.name,
            time: record.eveningPickup.timestamp,
            bus: student.assignedBus?.busNumber || 'N/A'
          });
        }
        if (record.eveningDropoff?.scanned) {
          activities.push({
            id: `${student._id}_ed`,
            type: 'dropoff',
            student: student.name,
            time: record.eveningDropoff.timestamp,
            bus: student.assignedBus?.busNumber || 'N/A'
          });
        }
      }
    });

    // Sort by most recent first and take top 10
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivities = activities.slice(0, 10);

    res.json({
      success: true,
      activities: recentActivities
    });
  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent activity' });
  }
};
