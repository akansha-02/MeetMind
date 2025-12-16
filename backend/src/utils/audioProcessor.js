import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const validateAudioFile = (file) => {
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/m4a',
  ];
  
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid audio file type' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 100MB limit' };
  }

  return { valid: true };
};

export const getAudioFileExtension = (mimetype) => {
  const extensions = {
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/webm': '.webm',
    'audio/ogg': '.ogg',
    'audio/m4a': '.m4a',
  };
  return extensions[mimetype] || '.mp3';
};
