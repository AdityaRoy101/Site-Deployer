import express from 'express';
import { validateDeployment } from '../middleware/validation.js';
import deployApp from '../controllers/deployController.js';

const router = express.Router();

// Static Deployments
router.post('/static', validateDeployment, deployApp);


export default router;