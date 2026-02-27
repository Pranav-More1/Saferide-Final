/**
 * ============================================
 * GuardianSync v2.0 - Services Index
 * ============================================
 */

export { default as aiService } from './aiService.js';
export { default as storageService } from './storageService.js';
export { default as notificationService } from './notificationService.js';
export { 
  notifyParentsOfScan, 
  notifyParentsOfAbsence, 
  sendCustomNotification, 
  getNotificationStatus 
} from './notificationService.js';

// Feature #3: Absentee Auto-Detection
export { default as absenteeService } from './absenteeService.js';
export {
  detectAbsentStudents,
  processAbsentees,
  runManualDetection,
  getDetectionStatus,
} from './absenteeService.js';

export { default as schedulerService } from './schedulerService.js';
export {
  initializeScheduler,
  stopScheduler,
  getSchedulerStatus,
  triggerJob,
} from './schedulerService.js';
