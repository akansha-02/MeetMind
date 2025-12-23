// deepgram.js
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@deepgram/sdk';

let deepgramClient = null;
if (!process.env.DEEPGRAM_API_KEY) {
  console.warn('DEEPGRAM_API_KEY is missing – Deepgram features will be disabled.');
} else {
  deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
}

export default deepgramClient;
