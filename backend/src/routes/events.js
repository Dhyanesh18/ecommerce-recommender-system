import express from 'express';
import { logEvent } from '../controllers/eventControllers.js';

const router = express.Router();
router.post('/', logEvent);

export default router;