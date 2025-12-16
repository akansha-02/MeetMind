import express from 'express';
import {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  completeMeeting,
} from '../controllers/meetingController.js';
import { processMeeting } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getMeetings)
  .post(createMeeting);

router.route('/:id')
  .get(getMeeting)
  .put(updateMeeting)
  .delete(deleteMeeting);

router.post('/:id/complete', completeMeeting);
router.post('/:id/process', processMeeting);

export default router;
