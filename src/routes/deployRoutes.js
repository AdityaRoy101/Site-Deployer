import express from 'express';
import deployApp from '../controllers/deployController.js';
import { validateDeployment } from '../middleware/validation.js';

const router = express.Router();

// Deploy a new site
router.post('/deploy', validateDeployment, deployApp);

// Get deployment status (if needed in future)
// router.get('/deploy/:deploymentId/status', getDeploymentStatus);

export default router;
