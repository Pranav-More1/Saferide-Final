/**
 * ============================================
 * GuardianSync v2.0 - Configuration Module
 * ============================================
 * 
 * Centralized configuration management.
 * All environment variables are validated and exported here.
 * 
 * NEVER hardcode secrets - always use process.env
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Validates that required environment variables are set.
 * Throws an error if any required variable is missing.
 */
const validateEnv = () => {
  const required = [
    'JWT_SECRET',
    'MONGODB_URI',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate in production
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}

/**
 * Application configuration object.
 * All configuration is derived from environment variables.
 */
const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/guardiansync',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Redis (optional)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    enabled: process.env.REDIS_HOST ? true : false,
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // AI Service
  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8001',
    timeout: parseInt(process.env.AI_SERVICE_TIMEOUT, 10) || 30000,
    endpoints: {
      encode: '/api/v1/face/encode',
      encodeBase64: '/api/v1/face/encode-base64',
      compare: '/api/v1/face/compare',
      identify: '/api/v1/face/identify',
      health: '/health',
    }
  },

  // Cloud Storage
  cloudStorage: {
    provider: process.env.AWS_S3_BUCKET ? 's3' : 
              process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local',
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET,
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    }
  },

  // Real-Time
  socket: {
    corsOrigins: (process.env.SOCKET_CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:8081')
      .split(',')
      .map(origin => origin.trim()),
    locationThrottleMs: parseInt(process.env.LOCATION_UPDATE_THROTTLE_MS, 10) || 5000,
  },

  // Security
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:8081')
      .split(',')
      .map(origin => origin.trim()),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'combined',
  },

  // ============================================
  // NOTIFICATION SETTINGS (Feature #2)
  // ============================================
  notifications: {
    // Email configuration (Nodemailer)
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      provider: process.env.EMAIL_PROVIDER || 'smtp', // 'smtp' or 'sendgrid'
      from: process.env.EMAIL_FROM || 'GuardianSync <noreply@guardiansync.com>',
      
      // SMTP settings
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      
      // SendGrid settings (alternative)
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
      },
    },
    
    // SMS configuration (Twilio)
    sms: {
      enabled: process.env.SMS_ENABLED === 'true',
      provider: 'twilio',
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER,
      },
    },
    
    // Notification preferences
    preferences: {
      // Send notifications for these scan types (all by default)
      enabledScanTypes: (process.env.NOTIFICATION_SCAN_TYPES || 'morning_pickup,morning_dropoff,evening_pickup,evening_dropoff').split(','),
      // Retry failed notifications
      retryAttempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS, 10) || 3,
      retryDelayMs: parseInt(process.env.NOTIFICATION_RETRY_DELAY_MS, 10) || 5000,
    },
  },

  // ============================================
  // ABSENTEE AUTO-DETECTION (Feature #3)
  // ============================================
  absenteeDetection: {
    // Enable/disable auto-detection
    enabled: process.env.ABSENTEE_DETECTION_ENABLED !== 'false', // Enabled by default
    
    // Cron schedule for running detection (default: 9:30 AM on weekdays)
    // Format: second minute hour dayOfMonth month dayOfWeek
    cronSchedule: process.env.ABSENTEE_CRON_SCHEDULE || '0 30 9 * * 1-5',
    
    // Timezone for the cron job
    timezone: process.env.ABSENTEE_TIMEZONE || 'America/New_York',
    
    // Cutoff times for determining absence
    cutoffTimes: {
      // If no morning_pickup by this time, consider checking for absence
      morningPickupCutoff: process.env.MORNING_PICKUP_CUTOFF || '08:30',
      // If morning_pickup but no morning_dropoff by this time, mark incomplete
      morningDropoffCutoff: process.env.MORNING_DROPOFF_CUTOFF || '09:30',
    },
    
    // Only check students on specific buses (comma-separated IDs) or 'all'
    busFilter: process.env.ABSENTEE_BUS_FILTER || 'all',
    
    // Notify parents when student is auto-marked absent
    notifyParents: process.env.ABSENTEE_NOTIFY_PARENTS !== 'false', // Enabled by default
    
    // Also notify school admin
    notifyAdmin: process.env.ABSENTEE_NOTIFY_ADMIN === 'true',
    adminEmail: process.env.ABSENTEE_ADMIN_EMAIL || '',
  },
};

export default config;
