import express from 'express';
import { searchKnowledgeBase } from '../controllers/vectorController.js';
import knowledgeBaseService from '../services/knowledgeBaseService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Search knowledge base with vector search
router.post('/search', async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await knowledgeBaseService.searchKnowledgeBase(
      req.user._id,
      query
    );

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
});

// Get meetings by month (NEW ENDPOINT)
router.get('/monthly/:year/:month', async (req, res, next) => {
  try {
    const { year, month } = req.params;

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    const data = await knowledgeBaseService.getMeetingsByMonth(
      req.user._id,
      parseInt(year),
      parseInt(month)
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
