/**
 * ============================================
 * GuardianSync v2.0 - Validation Middleware
 * ============================================
 * 
 * Express middleware for Zod schema validation.
 * Validates request body, params, and query against schemas.
 */

import { ZodError } from 'zod';
import logger from '../utils/logger.js';

/**
 * Creates validation middleware from a Zod schema.
 * Validates body, params, and query based on schema structure.
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 * 
 * @example
 * router.post('/students', validate(createStudentSchema), studentController.create);
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Build validation object based on what the schema expects
      const dataToValidate = {};
      
      if (schema.shape?.body) {
        dataToValidate.body = req.body;
      }
      if (schema.shape?.params) {
        dataToValidate.params = req.params;
      }
      if (schema.shape?.query) {
        dataToValidate.query = req.query;
      }
      
      // If schema doesn't have nested structure, validate body directly
      if (!schema.shape?.body && !schema.shape?.params && !schema.shape?.query) {
        dataToValidate.body = req.body;
      }
      
      // Perform validation
      const validated = await schema.parseAsync(
        Object.keys(dataToValidate).length > 0 ? dataToValidate : { body: req.body }
      );
      
      // Attach validated data to request
      if (validated.body) req.body = validated.body;
      if (validated.params) req.params = { ...req.params, ...validated.params };
      if (validated.query) req.query = validated.query;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for response
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        logger.warn('Validation failed:', { errors });
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }
      
      // Unexpected error
      logger.error('Validation error:', error);
      next(error);
    }
  };
};

/**
 * Validate only the request body.
 * Simpler middleware for body-only validation.
 * 
 * @param {z.ZodSchema} schema - Zod schema for body validation
 * @returns {Function} Express middleware
 */
export const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }
      next(error);
    }
  };
};

/**
 * Validate request params (URL parameters).
 * 
 * @param {z.ZodSchema} schema - Zod schema for params
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid URL parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

/**
 * Validate query string parameters.
 * 
 * @param {z.ZodSchema} schema - Zod schema for query
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

export default validate;
