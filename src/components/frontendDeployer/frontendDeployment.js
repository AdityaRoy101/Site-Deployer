import logger from '../../../setup/logger.js';
import s3Service from '../../services/s3Service.js';
import cacheService from '../../services/cacheService.js';
import { v4 as uuidv4 } from 'uuid';
import gitService from '../../services/gitService.js';
import buildService from '../../services/buildService.js';
import path from 'path';
import fs from 'fs-extra';
import { AppError } from '../../middleware/errorHandler.js';
import { config } from '../../config/index.js';

export const deployStaticApp = async ({ githubUrl, projectName, buildCommand, outputDir }) => {
  const deploymentId = uuidv4();
  const tempDir = path.join(config.build.tempDir, deploymentId);

  const startTime = Date.now();

  logger.info(`Starting deployment for project: ${projectName}`, {
    deploymentId,
    githubUrl,
    projectName,
    buildCommand,
    outputDir
  });

  try {
    // Check if this project was recently deployed (cache check)
    const cacheKey = `deployment:${projectName}:${Buffer.from(githubUrl).toString('base64')}`;
    const cachedResult = await cacheService.get(cacheKey);

    if (cachedResult) {
      logger.info(`Returning cached deployment result for ${projectName}`);
      return {
        success: true,
        url: cachedResult.url,
        deploymentId,
        cached: true,
        message: 'Deployment served from cache'
      };
    }

    // Step 1: Clone repository
    logger.info(`Cloning repository: ${githubUrl}`);
    const localPath = await gitService(githubUrl, tempDir, { shallow: true });

    // Step 2: Update package.json configuration
    await updatePackageHomepage(localPath);

    // Step 3: Build the project
    logger.info(`Building project with command: ${buildCommand}`);
    const buildPath = await buildService(localPath, {
      noSourceMap: true,
      buildCommand,
      outputDir
    });

    // Step 4: Upload to S3
    logger.info(`Uploading build to S3 bucket: ${config.aws.s3Bucket}`);
    await s3Service(buildPath, projectName);

    // Step 5: Generate CloudFront URL
    const cloudfrontUrl = `${config.aws.cloudfrontUrl}/${projectName}/index.html`;

    // Step 6: Cache the result
    const result = {
      url: cloudfrontUrl,
      deployedAt: new Date().toISOString(),
      projectName,
      deploymentId
    };

    await cacheService.set(cacheKey, result, config.redis.ttl);

    const deploymentTime = Date.now() - startTime;

    logger.info(`Deployment completed successfully`, {
      deploymentId,
      projectName,
      url: cloudfrontUrl,
      deploymentTime
    });

    return {
      success: true,
      url: cloudfrontUrl,
      deploymentId,
      deploymentTime,
      message: 'Project deployed successfully'
    };
  } catch (error) {
    logger.error(`Deployment failed for ${projectName}`, {
      deploymentId,
      error: error.message,
      stack: error.stack
    });

    // Re-throw the error to be handled by the controller
    throw error;
  } finally {
    // Always cleanup temp directory
    await cleanupTempDirectory(tempDir);
  }
};

const updatePackageHomepage = async projectPath => {
  const packageJsonPath = path.join(projectPath, 'package.json');

  try {
    if (!(await fs.pathExists(packageJsonPath))) {
      throw new AppError('package.json not found', 400);
    }

    const packageData = await fs.readJson(packageJsonPath);

    // Modify the homepage field for proper relative path handling
    packageData.homepage = '.';

    // Save it back
    await fs.writeJson(packageJsonPath, packageData, { spaces: 2 });

    logger.info(`✅ Updated homepage in package.json for project at ${projectPath}`);
  } catch (error) {
    logger.error(`Failed to update package.json: ${error.message}`);
    throw new AppError('Failed to update package.json configuration', 500);
  }
};

const cleanupTempDirectory = async tempDir => {
  try {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
      logger.info(`Cleaned up temporary directory: ${tempDir}`);
    }
  } catch (error) {
    logger.warn(`Failed to cleanup temporary directory ${tempDir}: ${error.message}`);
  }
};
