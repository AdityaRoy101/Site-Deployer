import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const buildProject = async (projectPath, options = {}) => {
  try {
    execSync('npm install --legacy-peer-deps', { cwd: projectPath, stdio: 'inherit' });

    if (options.noSourceMap) {
      process.env.GENERATE_SOURCEMAP = 'false';
    }

    execSync('npm run build', { cwd: projectPath, stdio: 'inherit' });

    const distPath = path.join(projectPath, 'dist');
    const buildPath = path.join(projectPath, 'build');

    if (fs.existsSync(distPath)) return distPath;
    if (fs.existsSync(buildPath)) return buildPath;

    throw new Error('Build directory not found. Ensure your project has a dist or build directory.');
  } catch (error) {
    console.error('Build failed:', error);
    throw error;
  }
};

export default buildProject;