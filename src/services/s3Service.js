import AWS from 'aws-sdk';
import fs from 'fs-extra';
import path from 'path';
import mime from 'mime-types';
import logger from '../../setup/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import config from '../config/index.js';

const s3Config = new AWS.S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
  maxRetries: 3,
  retryDelayOptions: {
    customBackoff: function(retryCount) {
      return Math.pow(2, retryCount) * 100; // exponential backoff
    }
  }
});

const uploadFile = async (filePath, s3Key, bucketName) => {
  try {
    const fileContent = await fs.readFile(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    
    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: getCacheControl(contentType)
      // ACL removed - bucket should be configured with public access policies instead
    };
    
    // Add compression for text files
    if (contentType.startsWith('text/') || 
        contentType.includes('javascript') || 
        contentType.includes('json')) {
      uploadParams.ContentEncoding = 'gzip';
      const zlib = await import('zlib');
      uploadParams.Body = zlib.gzipSync(fileContent);
    }
    
    const result = await s3Config.upload(uploadParams).promise();
    logger.debug(`Uploaded file: ${s3Key}`);
    return result;
  } catch (error) {
    logger.error(`Failed to upload file ${filePath}:`, error);
    throw error;
  }
};

const getCacheControl = (contentType) => {
  // Set cache control based on file type
  if (contentType.includes('html')) {
    return 'no-cache, no-store, must-revalidate'; // HTML files should not be cached
  }
  if (contentType.includes('javascript') || contentType.includes('css')) {
    return 'public, max-age=31536000'; // JS/CSS files cached for 1 year
  }
  if (contentType.startsWith('image/') || contentType.startsWith('font/')) {
    return 'public, max-age=31536000'; // Images and fonts cached for 1 year
  }
  return 'public, max-age=86400'; // Default 1 day cache
};

const uploadDir = async (s3Path, bucketName, dirPath) => {
  const uploadPromises = [];
  
  const processDirectory = async (currentDir, currentS3Path) => {
    const files = await fs.readdir(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const fileStat = await fs.stat(filePath);
      
      if (fileStat.isDirectory()) {
        await processDirectory(filePath, `${currentS3Path}/${file}`);
      } else {
        const s3Key = `${currentS3Path}/${file}`;
        uploadPromises.push(uploadFile(filePath, s3Key, bucketName));
      }
    }
  };
  
  await processDirectory(dirPath, s3Path);
  
  // Execute all uploads in parallel with concurrency limit
  const concurrencyLimit = 10;
  const results = [];
  
  for (let i = 0; i < uploadPromises.length; i += concurrencyLimit) {
    const batch = uploadPromises.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.allSettled(batch);
    results.push(...batchResults);
  }
  
  // Check for failed uploads
  const failedUploads = results.filter(result => result.status === 'rejected');
  if (failedUploads.length > 0) {
    logger.error(`${failedUploads.length} files failed to upload`);
    failedUploads.forEach((result, index) => {
      logger.error(`Upload failed:`, result.reason);
    });
    throw new AppError(`${failedUploads.length} files failed to upload to S3`, 502);
  }
  
  logger.info(`Successfully uploaded ${results.length} files to S3`);
  return results;
};

const uploadToS3 = async (buildPath, projectName) => {
  const startTime = Date.now();
  
  try {
    logger.info(`Starting S3 upload for project: ${projectName}`);
    
    // Verify build path exists
    if (!(await fs.pathExists(buildPath))) {
      throw new AppError(`Build path does not exist: ${buildPath}`, 400);
    }
    
    // Get file count for logging
    const getAllFiles = async (dirPath) => {
      let files = [];
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          const subFiles = await getAllFiles(itemPath);
          files = files.concat(subFiles);
        } else {
          files.push(itemPath);
        }
      }
      
      return files;
    };
    
    const allFiles = await getAllFiles(buildPath);
    logger.info(`Uploading ${allFiles.length} files to S3 bucket: ${config.aws.s3Bucket}`);
    
    // Upload directory
    await uploadDir(projectName, config.aws.s3Bucket, buildPath);
    
    const uploadTime = Date.now() - startTime;
    logger.info(`S3 upload completed successfully in ${uploadTime}ms`, {
      projectName,
      fileCount: allFiles.length,
      bucket: config.aws.s3Bucket
    });
    
  } catch (error) {
    const uploadTime = Date.now() - startTime;
    logger.error(`S3 upload failed after ${uploadTime}ms`, {
      projectName,
      buildPath,
      error: error.message,
      stack: error.stack
    });
    
    // Handle specific AWS errors
    if (error.code === 'NoSuchBucket') {
      throw new AppError('S3 bucket does not exist', 404);
    }
    
    if (error.code === 'AccessDenied') {
      throw new AppError('Access denied to S3 bucket', 403);
    }
    
    if (error.code === 'NetworkingError') {
      throw new AppError('Network error while uploading to S3', 502);
    }
    
    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(`S3 upload failed: ${error.message}`, 500);
  }
};

export default uploadToS3;
