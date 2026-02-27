/**
 * ============================================
 * GuardianSync v2.0 - Storage Service
 * ============================================
 * 
 * Abstraction layer for cloud storage operations.
 * Supports S3, Cloudinary, or local storage.
 * 
 * CRITICAL: Images should be stored here, NOT in the database.
 * Only the URL is stored in MongoDB.
 */

import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// ============================================
// Storage Provider Interface
// ============================================

class StorageService {
  constructor() {
    this.provider = config.cloudStorage.provider;
    logger.info(`Storage service initialized with provider: ${this.provider}`);
  }

  /**
   * Upload an image to cloud storage.
   * Returns the public URL of the uploaded image.
   * 
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} folder - Storage folder/path
   * @param {string} filename - Optional custom filename
   * @returns {Promise<{url: string, key: string}>} Upload result
   * 
   * @example
   * const { url, key } = await storageService.uploadImage(buffer, 'students');
   * // url: 'https://s3.amazonaws.com/bucket/students/abc123.jpg'
   */
  async uploadImage(imageBuffer, folder = 'uploads', filename = null) {
    const uniqueFilename = filename || `${uuidv4()}.jpg`;
    const key = `${folder}/${uniqueFilename}`;

    switch (this.provider) {
      case 's3':
        return this.uploadToS3(imageBuffer, key);
      case 'cloudinary':
        return this.uploadToCloudinary(imageBuffer, folder, uniqueFilename);
      default:
        return this.uploadLocally(imageBuffer, key);
    }
  }

  /**
   * Delete an image from storage.
   * 
   * @param {string} keyOrUrl - Storage key or full URL
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteImage(keyOrUrl) {
    try {
      switch (this.provider) {
        case 's3':
          return this.deleteFromS3(keyOrUrl);
        case 'cloudinary':
          return this.deleteFromCloudinary(keyOrUrl);
        default:
          return this.deleteLocally(keyOrUrl);
      }
    } catch (error) {
      logger.error('Failed to delete image:', error);
      return false;
    }
  }

  // ============================================
  // AWS S3 Implementation
  // ============================================

  /**
   * Upload image to AWS S3.
   * 
   * TODO: Uncomment and configure when AWS credentials are available.
   */
  async uploadToS3(imageBuffer, key) {
    /*
    // Uncomment when using AWS S3:
    
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: config.cloudStorage.s3.region,
      credentials: {
        accessKeyId: config.cloudStorage.s3.accessKeyId,
        secretAccessKey: config.cloudStorage.s3.secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: config.cloudStorage.s3.bucket,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read', // Or use presigned URLs for private access
    });

    await s3Client.send(command);

    const url = `https://${config.cloudStorage.s3.bucket}.s3.${config.cloudStorage.s3.region}.amazonaws.com/${key}`;
    
    logger.info(`Image uploaded to S3: ${key}`);
    
    return { url, key };
    */

    // Placeholder implementation - returns mock URL
    logger.warn('S3 not configured - using mock URL');
    const mockUrl = `https://mock-s3.example.com/${key}`;
    return { url: mockUrl, key };
  }

  async deleteFromS3(key) {
    /*
    // Uncomment when using AWS S3:
    
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: config.cloudStorage.s3.region,
      credentials: {
        accessKeyId: config.cloudStorage.s3.accessKeyId,
        secretAccessKey: config.cloudStorage.s3.secretAccessKey,
      },
    });

    const command = new DeleteObjectCommand({
      Bucket: config.cloudStorage.s3.bucket,
      Key: key,
    });

    await s3Client.send(command);
    
    logger.info(`Image deleted from S3: ${key}`);
    return true;
    */

    logger.warn('S3 not configured - mock delete');
    return true;
  }

  // ============================================
  // Cloudinary Implementation
  // ============================================

  /**
   * Upload image to Cloudinary.
   * 
   * TODO: Uncomment and configure when Cloudinary credentials are available.
   */
  async uploadToCloudinary(imageBuffer, folder, filename) {
    /*
    // Uncomment when using Cloudinary:
    
    const cloudinary = await import('cloudinary');
    
    cloudinary.v2.config({
      cloud_name: config.cloudStorage.cloudinary.cloudName,
      api_key: config.cloudStorage.cloudinary.apiKey,
      api_secret: config.cloudStorage.cloudinary.apiSecret,
    });

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: folder,
          public_id: filename.replace('.jpg', ''),
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            logger.info(`Image uploaded to Cloudinary: ${result.public_id}`);
            resolve({
              url: result.secure_url,
              key: result.public_id,
            });
          }
        }
      );

      uploadStream.end(imageBuffer);
    });
    */

    // Placeholder implementation
    logger.warn('Cloudinary not configured - using mock URL');
    const mockUrl = `https://mock-cloudinary.example.com/${folder}/${filename}`;
    return { url: mockUrl, key: `${folder}/${filename}` };
  }

  async deleteFromCloudinary(publicId) {
    /*
    // Uncomment when using Cloudinary:
    
    const cloudinary = await import('cloudinary');
    
    cloudinary.v2.config({
      cloud_name: config.cloudStorage.cloudinary.cloudName,
      api_key: config.cloudStorage.cloudinary.apiKey,
      api_secret: config.cloudStorage.cloudinary.apiSecret,
    });

    await cloudinary.v2.uploader.destroy(publicId);
    
    logger.info(`Image deleted from Cloudinary: ${publicId}`);
    return true;
    */

    logger.warn('Cloudinary not configured - mock delete');
    return true;
  }

  // ============================================
  // Local Storage Implementation
  // ============================================

  /**
   * Local storage for development.
   * Stores files in the local filesystem.
   */
  async uploadLocally(imageBuffer, key) {
    // For development/testing - store locally
    // In production, always use cloud storage
    
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const uploadDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, key);
    const dirPath = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, imageBuffer);
    
    // Return local URL (would be served by Express static in dev)
    const url = `/uploads/${key}`;
    
    logger.info(`Image uploaded locally: ${filePath}`);
    
    return { url, key };
  }

  async deleteLocally(key) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filePath = path.join(process.cwd(), 'uploads', key);
    
    try {
      await fs.unlink(filePath);
      logger.info(`Image deleted locally: ${filePath}`);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      return false;
    }
  }
}

// Export singleton instance
const storageService = new StorageService();

export default storageService;
