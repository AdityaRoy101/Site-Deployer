import express from 'express';
import deployApp from '../controllers/deployController.js';

const router = express.Router();

router.post('/deploy', deployApp);

export default router;
