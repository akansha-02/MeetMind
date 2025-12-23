import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

let openai = null;
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is missing – OpenAI features will be disabled.');
} else {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export default openai;