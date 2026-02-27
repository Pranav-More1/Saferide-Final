/**
 * ============================================
 * GuardianSync v2.0 - AI Service Client
 * ============================================
 * 
 * HTTP client for communicating with the Python AI service.
 * Handles face encoding and comparison requests.
 * 
 * This service abstracts all AI-related API calls,
 * keeping the controllers clean and focused.
 */

import axios from 'axios';
import FormData from 'form-data';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// ============================================
// Create Axios Instance
// ============================================

const aiClient = axios.create({
  baseURL: config.aiService.url,
  timeout: config.aiService.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
aiClient.interceptors.request.use(
  (request) => {
    logger.debug(`AI Service Request: ${request.method?.toUpperCase()} ${request.url}`);
    return request;
  },
  (error) => {
    logger.error('AI Service Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
aiClient.interceptors.response.use(
  (response) => {
    logger.debug(`AI Service Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      logger.error(`AI Service Error: ${error.response.status} - ${error.response.data?.detail || error.message}`);
    } else if (error.request) {
      logger.error('AI Service Error: No response received');
    } else {
      logger.error('AI Service Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ============================================
// Service Class
// ============================================

class AIServiceClient {
  /**
   * Check if the AI service is healthy.
   * 
   * @returns {Promise<boolean>} True if service is healthy
   */
  async healthCheck() {
    try {
      const response = await aiClient.get(config.aiService.endpoints.health);
      return response.data.status === 'healthy';
    } catch (error) {
      logger.error('AI Service health check failed:', error.message);
      return false;
    }
  }

  /**
   * Generate face encoding from an image file buffer.
   * Sends the image to the Python service for processing.
   * 
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} filename - Original filename
   * @returns {Promise<Object>} Face encoding result
   * 
   * @example
   * const result = await aiService.encodeFaceFromBuffer(buffer, 'photo.jpg');
   * // result: { success: true, face_encoding: [...], faces_detected: 1, message: '...' }
   */
  async encodeFaceFromBuffer(imageBuffer, filename = 'image.jpg') {
    try {
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename,
        contentType: 'image/jpeg',
      });

      const response = await aiClient.post(
        config.aiService.endpoints.encode,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Face encoding failed:', error.message);
      throw new Error(`Face encoding failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Generate face encoding from a base64-encoded image.
   * Useful for mobile app integration where images are sent as base64.
   * 
   * @param {string} base64Image - Base64 encoded image (with or without data URI prefix)
   * @returns {Promise<Object>} Face encoding result
   * 
   * @example
   * const result = await aiService.encodeFaceFromBase64(base64String);
   */
  async encodeFaceFromBase64(base64Image) {
    try {
      // Remove data URI prefix if present
      let cleanBase64 = base64Image;
      if (base64Image.includes(',')) {
        cleanBase64 = base64Image.split(',')[1];
      }

      const response = await aiClient.post(
        config.aiService.endpoints.encodeBase64,
        { image_base64: cleanBase64 }
      );

      return response.data;
    } catch (error) {
      logger.error('Base64 face encoding failed:', error.message);
      throw new Error(`Face encoding failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Compare two face encodings to determine if they match.
   * 
   * @param {number[]} encoding1 - First face encoding (128 floats)
   * @param {number[]} encoding2 - Second face encoding (128 floats)
   * @param {number} tolerance - Match tolerance (default: 0.6)
   * @returns {Promise<Object>} Comparison result
   * 
   * @example
   * const result = await aiService.compareFaces(enc1, enc2, 0.5);
   * // result: { is_match: true, distance: 0.35, confidence: 85.5 }
   */
  async compareFaces(encoding1, encoding2, tolerance = 0.6) {
    try {
      const response = await aiClient.post(
        config.aiService.endpoints.compare,
        {
          encoding_1: encoding1,
          encoding_2: encoding2,
          tolerance,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Face comparison failed:', error.message);
      throw new Error(`Face comparison failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Identify a face by comparing against multiple known encodings.
   * This is the primary method for face scanning during bus boarding.
   * 
   * @param {number[]} probeEncoding - Face encoding to identify
   * @param {Array<{id: string, encoding: number[]}>} knownEncodings - Database of known encodings
   * @param {number} tolerance - Match tolerance (default: 0.6)
   * @returns {Promise<Object>} Identification result
   * 
   * @example
   * const result = await aiService.identifyFace(probeEncoding, knownStudents, 0.5);
   * // result: { found: true, matched_id: '...', distance: 0.32, confidence: 88.2 }
   */
  async identifyFace(probeEncoding, knownEncodings, tolerance = 0.6) {
    try {
      const response = await aiClient.post(
        config.aiService.endpoints.identify,
        {
          probe_encoding: probeEncoding,
          known_encodings: knownEncodings,
          tolerance,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Face identification failed:', error.message);
      throw new Error(`Face identification failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Alternative: Perform face comparison locally using math.
   * Avoids network call to Python service for simple comparisons.
   * Useful as fallback or for low-latency scenarios.
   * 
   * @param {number[]} encoding1 - First encoding
   * @param {number[]} encoding2 - Second encoding
   * @param {number} tolerance - Match tolerance
   * @returns {Object} Comparison result
   */
  compareLocally(encoding1, encoding2, tolerance = 0.6) {
    // Calculate Euclidean distance
    let sum = 0;
    for (let i = 0; i < encoding1.length; i++) {
      const diff = encoding1[i] - encoding2[i];
      sum += diff * diff;
    }
    const distance = Math.sqrt(sum);

    // Determine match
    const isMatch = distance <= tolerance;

    // Calculate confidence
    const confidence = isMatch
      ? Math.min(100, (1 - distance / tolerance) * 100)
      : Math.max(0, (1 - distance) * 100);

    return {
      isMatch,
      distance: Math.round(distance * 1000000) / 1000000,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Identify a face locally without calling the AI service.
   * Performs Euclidean distance comparison in Node.js.
   * 
   * @param {number[]} probeEncoding - Face encoding to identify
   * @param {Array<{id: string, encoding: number[]}>} knownEncodings - Known encodings
   * @param {number} tolerance - Match tolerance
   * @returns {Object} Identification result
   */
  identifyLocally(probeEncoding, knownEncodings, tolerance = 0.6) {
    let bestMatch = null;
    let bestDistance = Infinity;
    const allDistances = [];

    for (const known of knownEncodings) {
      const result = this.compareLocally(probeEncoding, known.encoding, tolerance);

      allDistances.push({
        id: known.id,
        distance: result.distance,
        confidence: result.confidence,
      });

      if (result.distance < bestDistance) {
        bestDistance = result.distance;
        bestMatch = {
          id: known.id,
          distance: result.distance,
          confidence: result.confidence,
        };
      }
    }

    // Sort by distance
    allDistances.sort((a, b) => a.distance - b.distance);

    if (bestMatch && bestDistance <= tolerance) {
      return {
        found: true,
        matchedId: bestMatch.id,
        distance: bestMatch.distance,
        confidence: bestMatch.confidence,
        allDistances: allDistances.slice(0, 5),
      };
    }

    return {
      found: false,
      matchedId: null,
      distance: bestDistance,
      confidence: bestMatch?.confidence || 0,
      allDistances: allDistances.slice(0, 5),
    };
  }
}

// Export singleton instance
const aiService = new AIServiceClient();

export default aiService;
