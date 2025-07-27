import simpleGit from 'simple-git';
import logger from '../../setup/logger.js';
import { AppError } from '../middleware/errorHandler.js';

const cloneRepo = async (repoUrl, destPath, options = {}) => {
  const startTime = Date.now();
  
  try {
    logger.info(`Starting Git clone: ${repoUrl} -> ${destPath}`);
    
    const git = simpleGit();
    const cloneOptions = [];
    
    if (options.shallow) {
      cloneOptions.push('--depth=1');
    }
    
    if (options.branch) {
      cloneOptions.push('--branch', options.branch);
    }
    
    // Add timeout option
    const gitOptions = {
      timeout: {
        block: 300000 // 5 minutes timeout
      }
    };
    
    await git.clone(repoUrl, destPath, cloneOptions);
    
    const cloneTime = Date.now() - startTime;
    logger.info(`Git clone completed successfully in ${cloneTime}ms`, {
      repoUrl,
      destPath,
      shallow: options.shallow,
      branch: options.branch
    });
    
    return destPath;
  } catch (error) {
    const cloneTime = Date.now() - startTime;
    logger.error(`Git clone failed after ${cloneTime}ms`, {
      repoUrl,
      destPath,
      error: error.message,
      stack: error.stack
    });
    
    // Handle specific Git errors
    if (error.message.includes('Repository not found')) {
      throw new AppError('Repository not found or not accessible', 404);
    }
    
    if (error.message.includes('Permission denied')) {
      throw new AppError('Permission denied to access repository', 403);
    }
    
    if (error.message.includes('timeout')) {
      throw new AppError('Git clone operation timed out', 408);
    }
    
    throw new AppError(`Git clone failed: ${error.message}`, 500);
  }
};

export default cloneRepo;
