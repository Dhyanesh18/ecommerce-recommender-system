import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import requireSeller from '../middleware/requireSeller.js';
import { uploadImage, deleteImage } from '../controllers/uploadController.js';

const router = express.Router();

// Only authenticated sellers can upload images
router.post('/image', authenticate, requireSeller, uploadImage);
router.delete('/image', authenticate, requireSeller, deleteImage);

export default router;
