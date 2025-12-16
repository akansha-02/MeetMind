import express from 'express';
import { searchKnowledgeBase } from '../controllers/vectorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/search', searchKnowledgeBase);

export default router;
