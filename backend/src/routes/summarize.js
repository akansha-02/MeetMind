import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  uploadAndSummarize,
  getSummaries,
  getSummary,
  deleteSummary,
} from '../controllers/standalonesummary.js';
import { protect } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'summary-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
    storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        // Audio formats
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/aac',
        // Video formats
        'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
        'video/ogg', 'video/3gpp', 'video/mpeg',
      ];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only audio/video files are allowed.'));
      }
    },
  });

  const router = express.Router();

  // All routes are protected
  router.use(protect);
  
  router.post('/upload', upload.single('file'), uploadAndSummarize);
  router.get('/', getSummaries);
  router.get('/:id', getSummary);
  router.delete('/:id', deleteSummary);
  
  export default router;