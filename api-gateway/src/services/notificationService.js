/**
 * ============================================
 * SafeRide v2.0 - Notification Service
 * ============================================
 * 
 * Feature #2: Email/SMS Notifications
 * 
 * Sends real-time notifications to parents when their child
 * is scanned during the Four-Step Commute process.
 * 
 * Supports:
 * - Email via Nodemailer (SMTP) or SendGrid
 * - SMS via Twilio
 * 
 * Each scan type triggers a contextual notification:
 * - morning_pickup: "Your child has been picked up from home"
 * - morning_dropoff: "Your child has arrived safely at school"
 * - evening_pickup: "Your child has been picked up from school"
 * - evening_dropoff: "Your child has arrived safely home"
 */

import nodemailer from 'nodemailer';
import twilio from 'twilio';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import User from '../models/User.model.js';

// ============================================
// MESSAGE TEMPLATES
// ============================================

/**
 * Notification message templates for each scan type.
 * Supports variable substitution: {studentName}, {time}, {busNumber}
 */
const MESSAGE_TEMPLATES = {
  morning_pickup: {
    subject: '🚌 {studentName} Picked Up for School',
    email: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">🚌 Morning Pickup Confirmed</h2>
        <p>Hello,</p>
        <p><strong>{studentName}</strong> has been picked up from home and is on the school bus.</p>
        <ul style="list-style: none; padding: 0;">
          <li>📍 <strong>Status:</strong> On the bus to school</li>
          <li>🕐 <strong>Time:</strong> {time}</li>
          <li>🚌 <strong>Bus:</strong> {busNumber}</li>
        </ul>
        <p>You can track the bus location in real-time on the SafeRide Parent Portal.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">SafeRide - Keeping your children safe</p>
      </div>
    `,
    sms: '🚌 {studentName} has been picked up for school at {time}. Bus: {busNumber}. Track live on SafeRide.',
  },
  
  morning_dropoff: {
    subject: '🏫 {studentName} Arrived at School',
    email: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">🏫 Safe Arrival at School</h2>
        <p>Hello,</p>
        <p><strong>{studentName}</strong> has arrived safely at school.</p>
        <ul style="list-style: none; padding: 0;">
          <li>📍 <strong>Status:</strong> At school</li>
          <li>🕐 <strong>Time:</strong> {time}</li>
          <li>🚌 <strong>Bus:</strong> {busNumber}</li>
        </ul>
        <p>Have a great day!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">SafeRide - Keeping your children safe</p>
      </div>
    `,
    sms: '🏫 {studentName} has arrived safely at school at {time}. Have a great day!',
  },
  
  evening_pickup: {
    subject: '🚌 {studentName} Leaving School',
    email: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5CF6;">🚌 Evening Pickup Confirmed</h2>
        <p>Hello,</p>
        <p><strong>{studentName}</strong> has been picked up from school and is on the way home.</p>
        <ul style="list-style: none; padding: 0;">
          <li>📍 <strong>Status:</strong> On the bus home</li>
          <li>🕐 <strong>Time:</strong> {time}</li>
          <li>🚌 <strong>Bus:</strong> {busNumber}</li>
        </ul>
        <p>You can track the bus location in real-time on the SafeRide Parent Portal.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">SafeRide - Keeping your children safe</p>
      </div>
    `,
    sms: '🚌 {studentName} is on the bus home from school. Left at {time}. Bus: {busNumber}. Track live on SafeRide.',
  },
  
  evening_dropoff: {
    subject: '🏠 {studentName} Arrived Home Safely',
    email: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">🏠 Safe Arrival Home</h2>
        <p>Hello,</p>
        <p><strong>{studentName}</strong> has arrived safely home.</p>
        <ul style="list-style: none; padding: 0;">
          <li>📍 <strong>Status:</strong> Home safe</li>
          <li>🕐 <strong>Time:</strong> {time}</li>
          <li>🚌 <strong>Bus:</strong> {busNumber}</li>
        </ul>
        <p>Today's commute is complete. See you tomorrow!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">SafeRide - Keeping your children safe</p>
      </div>
    `,
    sms: '🏠 {studentName} has arrived home safely at {time}. Today\'s commute complete!',
  },
  
  // Attendance/absence notifications
  absent: {
    subject: '⚠️ {studentName} Marked Absent',
    email: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">⚠️ Absence Notification</h2>
        <p>Hello,</p>
        <p><strong>{studentName}</strong> has been marked absent for today.</p>
        <ul style="list-style: none; padding: 0;">
          <li>📅 <strong>Date:</strong> {time}</li>
        </ul>
        <p>If this is unexpected, please contact the school immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">SafeRide - Keeping your children safe</p>
      </div>
    `,
    sms: '⚠️ {studentName} has been marked absent for today ({time}). Contact school if unexpected.',
  },
};

// ============================================
// EMAIL TRANSPORT SETUP
// ============================================

let emailTransporter = null;

/**
 * Initialize the email transporter based on configuration.
 */
const initEmailTransporter = () => {
  if (!config.notifications.email.enabled) {
    logger.info('Email notifications disabled');
    return null;
  }
  
  const { provider, smtp, sendgrid } = config.notifications.email;
  
  if (provider === 'sendgrid' && sendgrid.apiKey) {
    // SendGrid transport
    emailTransporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: sendgrid.apiKey,
      },
    });
    logger.info('Email transporter initialized with SendGrid');
  } else if (smtp.auth.user && smtp.auth.pass) {
    // SMTP transport
    emailTransporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.auth.user,
        pass: smtp.auth.pass,
      },
    });
    logger.info(`Email transporter initialized with SMTP (${smtp.host})`);
  } else {
    logger.warn('Email notifications enabled but no valid credentials configured');
  }
  
  return emailTransporter;
};

// Initialize on module load
initEmailTransporter();

// ============================================
// SMS CLIENT SETUP (TWILIO)
// ============================================

let twilioClient = null;

/**
 * Initialize the Twilio client for SMS.
 */
const initTwilioClient = () => {
  if (!config.notifications.sms.enabled) {
    logger.info('SMS notifications disabled');
    return null;
  }
  
  const { accountSid, authToken } = config.notifications.sms.twilio;
  
  if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
    logger.info('Twilio SMS client initialized');
  } else {
    logger.warn('SMS notifications enabled but Twilio credentials not configured');
  }
  
  return twilioClient;
};

// Initialize on module load
initTwilioClient();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Replace template variables with actual values.
 * @param {string} template - Template string with {variable} placeholders
 * @param {Object} data - Data object with variable values
 * @returns {string} Processed string
 */
const processTemplate = (template, data) => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
};

/**
 * Format time for display in notifications.
 * @param {Date} date - Date object
 * @returns {string} Formatted time string
 */
const formatTime = (date = new Date()) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get parents/guardians for a student.
 * @param {Object} student - Student document (should have parents populated)
 * @returns {Promise<Array>} Array of parent user documents
 */
const getStudentParents = async (student) => {
  // If parents are already populated as objects
  if (student.parents && student.parents.length > 0 && typeof student.parents[0] === 'object') {
    return student.parents;
  }
  
  // If we have parent IDs, fetch them
  if (student.parents && student.parents.length > 0) {
    return await User.find({
      _id: { $in: student.parents },
      isActive: true,
    }).select('email phone name');
  }
  
  // Try primary guardian
  if (student.primaryGuardian) {
    const guardian = await User.findById(student.primaryGuardian).select('email phone name');
    return guardian ? [guardian] : [];
  }
  
  // Fallback: find users who have this student as a child
  return await User.find({
    children: student._id,
    role: 'parent',
    isActive: true,
  }).select('email phone name');
};

// ============================================
// NOTIFICATION SENDING FUNCTIONS
// ============================================

/**
 * Send an email notification.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<boolean>} Success status
 */
const sendEmail = async (to, subject, html) => {
  if (!emailTransporter) {
    logger.debug('Email transporter not available, skipping email');
    return false;
  }
  
  try {
    const result = await emailTransporter.sendMail({
      from: config.notifications.email.from,
      to,
      subject,
      html,
    });
    
    logger.info(`Email sent successfully to ${to}`, { messageId: result.messageId });
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error.message);
    return false;
  }
};

/**
 * Send an SMS notification via Twilio.
 * @param {string} to - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<boolean>} Success status
 */
const sendSMS = async (to, message) => {
  if (!twilioClient) {
    logger.debug('Twilio client not available, skipping SMS');
    return false;
  }
  
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: config.notifications.sms.twilio.fromNumber,
      to,
    });
    
    logger.info(`SMS sent successfully to ${to}`, { sid: result.sid });
    return true;
  } catch (error) {
    logger.error(`Failed to send SMS to ${to}:`, error.message);
    return false;
  }
};

// ============================================
// MAIN NOTIFICATION FUNCTION
// ============================================

/**
 * Send scan notification to all parents of a student.
 * This is the main function called by the scan controller.
 * 
 * @param {Object} options - Notification options
 * @param {Object} options.student - Student document
 * @param {string} options.scanType - One of: morning_pickup, morning_dropoff, evening_pickup, evening_dropoff
 * @param {Object} options.bus - Bus document (optional)
 * @param {Date} options.timestamp - Scan timestamp (optional)
 * @returns {Promise<Object>} Result with email and sms counts
 */
export const notifyParentsOfScan = async ({ student, scanType, bus = null, timestamp = new Date() }) => {
  const result = {
    emailsSent: 0,
    emailsFailed: 0,
    smsSent: 0,
    smsFailed: 0,
    skipped: false,
  };
  
  // Check if this scan type has notifications enabled
  const enabledTypes = config.notifications.preferences.enabledScanTypes;
  if (!enabledTypes.includes(scanType)) {
    logger.debug(`Notifications disabled for scan type: ${scanType}`);
    result.skipped = true;
    return result;
  }
  
  // Get message template
  const template = MESSAGE_TEMPLATES[scanType];
  if (!template) {
    logger.warn(`No notification template for scan type: ${scanType}`);
    result.skipped = true;
    return result;
  }
  
  // Get parents for this student
  const parents = await getStudentParents(student);
  if (parents.length === 0) {
    logger.debug(`No parents found for student ${student.name}, skipping notification`);
    result.skipped = true;
    return result;
  }
  
  // Prepare template data
  const templateData = {
    studentName: student.name,
    time: formatTime(timestamp),
    busNumber: bus?.busNumber || 'Unknown',
  };
  
  // Process templates
  const subject = processTemplate(template.subject, templateData);
  const emailHtml = processTemplate(template.email, templateData);
  const smsMessage = processTemplate(template.sms, templateData);
  
  // Send notifications to all parents
  const notificationPromises = [];
  
  for (const parent of parents) {
    // Send email if available
    if (parent.email && config.notifications.email.enabled) {
      notificationPromises.push(
        sendEmail(parent.email, subject, emailHtml)
          .then(success => {
            if (success) result.emailsSent++;
            else result.emailsFailed++;
          })
      );
    }
    
    // Send SMS if available
    if (parent.phone && config.notifications.sms.enabled) {
      notificationPromises.push(
        sendSMS(parent.phone, smsMessage)
          .then(success => {
            if (success) result.smsSent++;
            else result.smsFailed++;
          })
      );
    }
  }
  
  // Wait for all notifications to complete
  await Promise.all(notificationPromises);
  
  logger.info(`Notifications sent for ${student.name} (${scanType}):`, {
    emailsSent: result.emailsSent,
    smsSent: result.smsSent,
    parents: parents.length,
  });
  
  return result;
};

/**
 * Send absence notification to parents.
 * Called by the Absentee Auto-Detection feature.
 * 
 * @param {Object} options - Notification options
 * @param {Object} options.student - Student document
 * @param {Date} options.date - Absence date
 * @returns {Promise<Object>} Result with email and sms counts
 */
export const notifyParentsOfAbsence = async ({ student, date = new Date() }) => {
  return notifyParentsOfScan({
    student,
    scanType: 'absent',
    bus: null,
    timestamp: date,
  });
};

/**
 * Send a custom notification to specific users.
 * @param {Object} options - Notification options
 * @param {Array<string>} options.emails - Email addresses
 * @param {Array<string>} options.phones - Phone numbers
 * @param {string} options.subject - Email subject
 * @param {string} options.emailContent - Email HTML content
 * @param {string} options.smsContent - SMS message
 * @returns {Promise<Object>} Result with email and sms counts
 */
export const sendCustomNotification = async ({ emails = [], phones = [], subject, emailContent, smsContent }) => {
  const result = {
    emailsSent: 0,
    emailsFailed: 0,
    smsSent: 0,
    smsFailed: 0,
  };
  
  const promises = [];
  
  for (const email of emails) {
    promises.push(
      sendEmail(email, subject, emailContent)
        .then(success => {
          if (success) result.emailsSent++;
          else result.emailsFailed++;
        })
    );
  }
  
  for (const phone of phones) {
    promises.push(
      sendSMS(phone, smsContent)
        .then(success => {
          if (success) result.smsSent++;
          else result.smsFailed++;
        })
    );
  }
  
  await Promise.all(promises);
  return result;
};

/**
 * Check if notifications are configured and available.
 * @returns {Object} Status of email and SMS availability
 */
export const getNotificationStatus = () => {
  return {
    email: {
      enabled: config.notifications.email.enabled,
      configured: !!emailTransporter,
      provider: config.notifications.email.provider,
    },
    sms: {
      enabled: config.notifications.sms.enabled,
      configured: !!twilioClient,
      provider: 'twilio',
    },
    enabledScanTypes: config.notifications.preferences.enabledScanTypes,
  };
};

// Export for testing
export const _internal = {
  processTemplate,
  formatTime,
  getStudentParents,
  sendEmail,
  sendSMS,
  MESSAGE_TEMPLATES,
};

export default {
  notifyParentsOfScan,
  notifyParentsOfAbsence,
  sendCustomNotification,
  getNotificationStatus,
};
