/**
 * ============================================
 * GuardianSync v2.0 - Application Entry Point
 * ============================================
 * 
 * Main server file that initializes:
 * - Express application
 * - MongoDB connection
 * - Socket.io for real-time communication
 * - All middleware and routes
 */

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import config from './config/index.js';
import logger from './utils/logger.js';
import { initializeSocket } from './sockets/index.js';
import { initializeScheduler, stopScheduler } from './services/schedulerService.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import busRoutes from './routes/bus.routes.js';
import scanRoutes from './routes/scan.routes.js';
import userRoutes from './routes/user.routes.js';
import parentRoutes from './routes/parent.routes.js';
import driverRoutes from './routes/driver.routes.js';

// ============================================
// Initialize Express Application
// ============================================

const app = express();
const httpServer = createServer(app);

// ============================================
// Security Middleware
// ============================================

// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ============================================
// Request Parsing & Logging
// ============================================

// Parse JSON bodies (limit for security)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (config.env !== 'test') {
  app.use(morgan(config.logging.format, {
    stream: { write: (message) => logger.http(message.trim()) }
  }));
}

// ============================================
// Health Check Endpoint
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// ============================================
// API Routes
// ============================================

const apiPrefix = `/api/${config.apiVersion}`;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/students`, studentRoutes);
app.use(`${apiPrefix}/buses`, busRoutes);
app.use(`${apiPrefix}/scan`, scanRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/parent`, parentRoutes);
app.use(`${apiPrefix}/driver`, driverRoutes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// Database Connection
// ============================================

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('✅ Connected to MongoDB');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  logger.error('❌ MongoDB error:', err.message);
});

// ============================================
// Socket.io Initialization
// ============================================

const io = initializeSocket(httpServer);

// Make io available to routes via app.locals
app.locals.io = io;

// ============================================
// Graceful Shutdown
// ============================================

const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop scheduler jobs
  stopScheduler();
  logger.info('✅ Scheduler stopped');
  
  // Close HTTP server
  httpServer.close(() => {
    logger.info('✅ HTTP server closed');
  });

  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    logger.info('✅ MongoDB connection closed');
  } catch (err) {
    logger.error('Error closing MongoDB:', err);
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// Start Server
// ============================================

const startServer = async () => {
  // Connect to database first
  await connectDatabase();

  // Initialize scheduled jobs (Feature #3: Absentee Auto-Detection)
  initializeScheduler();

  // Start listening
  httpServer.listen(config.port, () => {
    logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🛡️  GuardianSync API Gateway v2.0                        ║
║                                                            ║
║   Environment: ${config.env.padEnd(40)}║
║   Port: ${config.port.toString().padEnd(47)}║
║   API: http://localhost:${config.port}/api/${config.apiVersion}                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
};

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export { app, httpServer };
