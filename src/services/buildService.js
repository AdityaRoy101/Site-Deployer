import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import logger from '../../setup/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';

const buildProject = async (projectPath, options = {}) => {
  const startTime = Date.now();
  const buildCommand = options.buildCommand || 'npm run build';
  const outputDir = options.outputDir || 'build';

  try {
    logger.info(`Starting build process for project at: ${projectPath}`);

    // Check if package.json exists
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      throw new AppError('package.json not found in project root', 400);
    }

    // Set build environment variables
    const buildEnv = {
      ...process.env,
      NODE_ENV: 'production',
      CI: 'true' // This helps with build optimizations
    };

    if (options.noSourceMap) {
      buildEnv.GENERATE_SOURCEMAP = 'false';
      buildEnv.REACT_APP_GENERATE_SOURCEMAP = 'false';
    }

    // Install dependencies
    logger.info('Installing dependencies...');
    const installStartTime = Date.now();

    try {
      // Use npm install for development, npm ci for production
      const installCommand =
        config.nodeEnv === 'production'
          ? 'npm ci --only=production --silent'
          : 'npm install --legacy-peer-deps --silent';

      execSync(installCommand, {
        cwd: projectPath,
        stdio: 'pipe',
        env: buildEnv,
        timeout: config.build.timeout
      });
    } catch (installError) {
      // Fallback to npm install if npm ci fails
      logger.warn('Primary install command failed, falling back to npm install');
      execSync('npm install --legacy-peer-deps --silent', {
        cwd: projectPath,
        stdio: 'pipe',
        env: buildEnv,
        timeout: config.build.timeout
      });
    }

    const installTime = Date.now() - installStartTime;
    logger.info(`Dependencies installed in ${installTime}ms`);

    // Run build command
    logger.info(`Running build command: ${buildCommand}`);
    const buildStartTime = Date.now();

    execSync(buildCommand, {
      cwd: projectPath,
      stdio: 'pipe',
      env: buildEnv,
      timeout: config.build.timeout
    });

    const buildTime = Date.now() - buildStartTime;
    logger.info(`Build completed in ${buildTime}ms`);

    // Check for build output directory
    const possibleOutputDirs = [
      path.join(projectPath, outputDir),
      path.join(projectPath, 'dist'),
      path.join(projectPath, 'build'),
      path.join(projectPath, 'public')
    ];

    let finalBuildPath = null;
    for (const dirPath of possibleOutputDirs) {
      if (await fs.pathExists(dirPath)) {
        const stats = await fs.stat(dirPath);
        if (stats.isDirectory()) {
          finalBuildPath = dirPath;
          break;
        }
      }
    }

    if (!finalBuildPath) {
      throw new AppError(
        `Build output directory not found. Looked for: ${possibleOutputDirs.join(', ')}`,
        500
      );
    }

    // Verify build output has files
    const buildFiles = await fs.readdir(finalBuildPath);
    if (buildFiles.length === 0) {
      throw new AppError('Build output directory is empty', 500);
    }

    const totalTime = Date.now() - startTime;
    logger.info(`Build process completed successfully in ${totalTime}ms`, {
      projectPath,
      buildCommand,
      outputDir: finalBuildPath,
      fileCount: buildFiles.length
    });

    return finalBuildPath;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error(`Build process failed after ${totalTime}ms`, {
      projectPath,
      buildCommand,
      error: error.message,
      stack: error.stack
    });

    // Handle specific build errors
    if (error.code === 'ENOENT') {
      throw new AppError('Build command not found. Make sure npm is installed.', 500);
    }

    if (error.signal === 'SIGTERM' || error.killed) {
      throw new AppError('Build process was terminated due to timeout', 408);
    }

    if (error.message.includes('ENOSPC')) {
      throw new AppError('Build failed due to insufficient disk space', 507);
    }

    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(`Build failed: ${error.message}`, 500);
  }
};

export default buildProject;
