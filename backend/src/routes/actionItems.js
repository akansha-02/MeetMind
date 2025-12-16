import express from 'express';
import {
  getActionItems,
  getActionItem,
  createActionItem,
  updateActionItem,
  deleteActionItem,
} from '../controllers/actionItemController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getActionItems)
  .post(createActionItem);

router.route('/:id')
  .get(getActionItem)
  .put(updateActionItem)
  .delete(deleteActionItem);

export default router;
