import gitService from '../services/gitService.js';
import buildService from '../services/buildService.js';
import s3Service from '../services/s3Service.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

dotenv.config();

const updatePackageHomepage = (projectPath) => {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }

  const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  // Modify the homepage field
  packageData.homepage = ".";

  // Save it back
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2), 'utf-8');

  console.log(`✅ Updated homepage in package.json`);
};

const deployApp = async (req, res) => {
  const { githubUrl, projectName } = req.body;
  const tempDir = `/tmp/${uuidv4()}`;

  try {
    const localPath = await gitService(githubUrl, tempDir, { shallow: true }); // shallow clone
    updatePackageHomepage(tempDir);
    const buildPath = await buildService(localPath, { noSourceMap: true }); // disable sourcemaps
    await s3Service(buildPath, projectName);

    const cloudfrontUrl = `${process.env.CLOUDFRONT_URL}/${projectName}/index.html`;
    res.status(200).json({ success: true, url: cloudfrontUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default deployApp;
