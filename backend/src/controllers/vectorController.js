import vectorService from '../services/vectorService.js';

// @desc    Search knowledge base
// @route   POST /api/knowledge/search
// @access  Private
export const searchKnowledgeBase = async (req, res, next) => {
  try {
    const { query, limit = 10, filters = {} } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const results = await vectorService.searchSimilar(
      req.user._id,
      query,
      parseInt(limit),
      filters
    );

    res.json({
      results,
      query,
      count: results.length,
    });
  } catch (error) {
    next(error);
  }
};
