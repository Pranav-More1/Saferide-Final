/**
 * ============================================
 * GuardianSync v2.0 - Bus Location Model
 * ============================================
 * 
 * Schema for real-time bus location tracking.
 * Designed for time-series data with efficient querying.
 * 
 * ARCHITECTURE NOTE:
 * In production, consider using Redis for real-time location
 * and MongoDB for historical location storage only.
 */

import mongoose from 'mongoose';

// ============================================
// Schema Definition
// ============================================

const busLocationSchema = new mongoose.Schema({
  // Reference to bus
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true,
    index: true,
  },
  
  // GeoJSON Point location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 &&
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates'
      }
    }
  },
  
  // Additional location data
  speed: {
    type: Number, // km/h
    min: 0,
    default: 0,
  },
  
  heading: {
    type: Number, // Degrees (0-360)
    min: 0,
    max: 360,
    default: 0,
  },
  
  accuracy: {
    type: Number, // Meters
    default: null,
  },
  
  // Driver who sent this update
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Timestamp (for querying historical data)
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },

}, {
  timestamps: false, // We use our own timestamp field
});

// ============================================
// Indexes
// ============================================

// Geospatial index for location queries
busLocationSchema.index({ location: '2dsphere' });

// Compound index for efficient time-series queries
busLocationSchema.index({ bus: 1, timestamp: -1 });

// TTL index - automatically delete locations older than 24 hours
// Adjust retention period as needed
busLocationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

// ============================================
// Static Methods
// ============================================

/**
 * Get the latest location for a bus.
 * 
 * @param {ObjectId} busId - Bus ID
 * @returns {Promise<BusLocation|null>}
 */
busLocationSchema.statics.getLatestLocation = function(busId) {
  return this.findOne({ bus: busId })
    .sort({ timestamp: -1 })
    .lean();
};

/**
 * Get location history for a bus within a time range.
 * 
 * @param {ObjectId} busId - Bus ID
 * @param {Date} startTime - Start of time range
 * @param {Date} endTime - End of time range
 * @returns {Promise<BusLocation[]>}
 */
busLocationSchema.statics.getLocationHistory = function(busId, startTime, endTime) {
  return this.find({
    bus: busId,
    timestamp: { $gte: startTime, $lte: endTime }
  })
    .sort({ timestamp: 1 })
    .lean();
};

/**
 * Create a new location entry.
 * Used by the throttled location update service.
 * 
 * @param {Object} locationData - Location data
 * @returns {Promise<BusLocation>}
 */
busLocationSchema.statics.recordLocation = function(locationData) {
  return this.create({
    bus: locationData.busId,
    location: {
      type: 'Point',
      coordinates: [locationData.longitude, locationData.latitude],
    },
    speed: locationData.speed || 0,
    heading: locationData.heading || 0,
    accuracy: locationData.accuracy,
    driver: locationData.driverId,
    timestamp: new Date(),
  });
};

// ============================================
// Export Model
// ============================================

const BusLocation = mongoose.model('BusLocation', busLocationSchema);

export default BusLocation;
