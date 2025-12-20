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
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/ogg',
    'video/3gpp',
    'video/mpeg',
  ];
  
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error:'Invalid file type. Only audio and video files are supported.' };
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
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'video/x-matroska': '.mkv',
    'video/ogg': '.ogv',
    'video/3gpp': '.3gp',
    'video/mpeg': '.mpeg',
  };
  return extensions[mimetype] || '.mp3';
};
