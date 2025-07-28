import express from 'express';
import { validateDeployment } from '../middleware/validation.js';
import { frontendDeploymentController } from '../controllers/frontendController/index.js';

const router = express.Router();

// Static Deployments
router.post('/static', validateDeployment, frontendDeploymentController);

export default router;
