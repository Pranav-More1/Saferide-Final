/**
 * ============================================
 * GuardianSync v2.0 - Scheduler Service
 * ============================================
 * 
 * Manages scheduled tasks using node-cron.
 * 
 * Current scheduled jobs:
 * 1. Absentee Auto-Detection (Feature #3)
 *    - Runs daily at configured time (default: 9:30 AM weekdays)
 *    - Detects and marks absent students
 *    - Notifies parents
 * 
 * 2. Daily Status Reset (optional)
 *    - Resets all students to 'not_boarded' at start of day
 * 
 * Cron format: second minute hour dayOfMonth month dayOfWeek
 * Example: '0 30 9 * * 1-5' = 9:30 AM, Monday-Friday
 */

import cron from 'node-cron';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { processAbsentees } from './absenteeService.js';
import { Student } from '../models/index.js';

// Store active cron jobs for management
const activeJobs = new Map();

// ============================================
// SCHEDULED JOBS
// ============================================

/**
 * Job: Absentee Auto-Detection
 * Runs at configured time to detect and mark absent students.
 */
const absenteeDetectionJob = async () => {
  logger.info('🔍 Running scheduled absentee detection...');
  
  try {
    const results = await processAbsentees();
    
    const totalAbsent = results.marked.success.length;
    const notificationsSent = results.notifications.sent;
    
    logger.info(`✅ Absentee detection complete: ${totalAbsent} students marked absent, ${notificationsSent} notifications sent`);
    
    return results;
  } catch (error) {
    logger.error('❌ Absentee detection job failed:', error);
    throw error;
  }
};

/**
 * Job: Daily Status Reset
 * Resets all students to 'not_boarded' at the start of each school day.
 * This ensures clean tracking for each new day.
 */
const dailyStatusResetJob = async () => {
  logger.info('🔄 Running daily status reset...');
  
  try {
    const result = await Student.updateMany(
      { 
        isActive: true,
        boardingStatus: { $ne: 'not_boarded' }
      },
      { 
        $set: { boardingStatus: 'not_boarded' }
      }
    );
    
    logger.info(`✅ Daily reset complete: ${result.modifiedCount} students reset to not_boarded`);
    
    return { resetCount: result.modifiedCount };
  } catch (error) {
    logger.error('❌ Daily status reset failed:', error);
    throw error;
  }
};

// ============================================
// SCHEDULER MANAGEMENT
// ============================================

/**
 * Initialize all scheduled jobs.
 * Call this on application startup.
 */
export const initializeScheduler = () => {
  logger.info('📅 Initializing scheduler service...');
  
  // Job 1: Absentee Detection
  if (config.absenteeDetection.enabled) {
    const absenteeCron = config.absenteeDetection.cronSchedule;
    const timezone = config.absenteeDetection.timezone;
    
    if (cron.validate(absenteeCron)) {
      const job = cron.schedule(absenteeCron, absenteeDetectionJob, {
        scheduled: true,
        timezone: timezone,
      });
      
      activeJobs.set('absenteeDetection', {
        job,
        schedule: absenteeCron,
        timezone,
        description: 'Auto-detect and mark absent students',
        lastRun: null,
      });
      
      logger.info(`📅 Absentee detection scheduled: ${absenteeCron} (${timezone})`);
    } else {
      logger.error(`Invalid cron expression for absentee detection: ${absenteeCron}`);
    }
  } else {
    logger.info('📅 Absentee detection is disabled');
  }
  
  // Job 2: Daily Status Reset (runs at 5:00 AM on weekdays)
  const resetCron = process.env.DAILY_RESET_CRON || '0 0 5 * * 1-5';
  const resetEnabled = process.env.DAILY_RESET_ENABLED !== 'false';
  
  if (resetEnabled && cron.validate(resetCron)) {
    const job = cron.schedule(resetCron, dailyStatusResetJob, {
      scheduled: true,
      timezone: config.absenteeDetection.timezone,
    });
    
    activeJobs.set('dailyReset', {
      job,
      schedule: resetCron,
      timezone: config.absenteeDetection.timezone,
      description: 'Reset all students to not_boarded',
      lastRun: null,
    });
    
    logger.info(`📅 Daily status reset scheduled: ${resetCron}`);
  }
  
  logger.info(`📅 Scheduler initialized with ${activeJobs.size} active jobs`);
  
  return getSchedulerStatus();
};

/**
 * Stop all scheduled jobs.
 * Call this on application shutdown.
 */
export const stopScheduler = () => {
  logger.info('📅 Stopping scheduler...');
  
  for (const [name, jobInfo] of activeJobs) {
    jobInfo.job.stop();
    logger.info(`Stopped job: ${name}`);
  }
  
  activeJobs.clear();
  logger.info('📅 Scheduler stopped');
};

/**
 * Get status of all scheduled jobs.
 * @returns {Object} Scheduler status
 */
export const getSchedulerStatus = () => {
  const jobs = [];
  
  for (const [name, jobInfo] of activeJobs) {
    jobs.push({
      name,
      schedule: jobInfo.schedule,
      timezone: jobInfo.timezone,
      description: jobInfo.description,
      running: jobInfo.job.running || false,
      lastRun: jobInfo.lastRun,
    });
  }
  
  return {
    active: activeJobs.size > 0,
    jobCount: activeJobs.size,
    jobs,
  };
};

/**
 * Manually trigger a specific job.
 * Useful for testing or admin-triggered runs.
 * 
 * @param {string} jobName - Name of job to trigger
 * @returns {Promise<Object>} Job result
 */
export const triggerJob = async (jobName) => {
  logger.info(`🔧 Manually triggering job: ${jobName}`);
  
  switch (jobName) {
    case 'absenteeDetection':
      return await absenteeDetectionJob();
    case 'dailyReset':
      return await dailyStatusResetJob();
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }
};

/**
 * Update job schedule dynamically.
 * @param {string} jobName - Name of job to update
 * @param {string} newSchedule - New cron expression
 * @returns {boolean} Success status
 */
export const updateJobSchedule = (jobName, newSchedule) => {
  if (!cron.validate(newSchedule)) {
    logger.error(`Invalid cron expression: ${newSchedule}`);
    return false;
  }
  
  const jobInfo = activeJobs.get(jobName);
  if (!jobInfo) {
    logger.error(`Job not found: ${jobName}`);
    return false;
  }
  
  // Stop old job
  jobInfo.job.stop();
  
  // Create new job with updated schedule
  let jobFunction;
  switch (jobName) {
    case 'absenteeDetection':
      jobFunction = absenteeDetectionJob;
      break;
    case 'dailyReset':
      jobFunction = dailyStatusResetJob;
      break;
    default:
      return false;
  }
  
  const newJob = cron.schedule(newSchedule, jobFunction, {
    scheduled: true,
    timezone: jobInfo.timezone,
  });
  
  activeJobs.set(jobName, {
    ...jobInfo,
    job: newJob,
    schedule: newSchedule,
  });
  
  logger.info(`Updated ${jobName} schedule to: ${newSchedule}`);
  return true;
};

export default {
  initializeScheduler,
  stopScheduler,
  getSchedulerStatus,
  triggerJob,
  updateJobSchedule,
};
