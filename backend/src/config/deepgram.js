// deepgram.js
import dotenv from 'dotenv';
dotenv.config(); // ensure env variables are loaded

import { createClient } from '@deepgram/sdk';

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error(
    'DEEPGRAM_API_KEY is missing! Make sure .env exists and dotenv.config() is called first.'
  );
}

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);

export default deepgramClient;
