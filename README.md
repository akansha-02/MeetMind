# MeetMind - AI-Powered Meeting Assistant

A full-stack web application for AI-powered meeting assistance using the MERN stack, enhanced with speech-to-text and natural language processing models.

## Features

- 🎙️ **Real-time Transcription**: Transcribe meetings in real-time using Deepgram
- 📝 **AI-Powered Summaries**: Automatically generate concise summaries and meeting minutes
- ✅ **Action Item Detection**: Automatically detect and assign action items from meetings
- 🔔 **Reminders**: Get reminders for follow-ups on action items
- 📚 **Knowledge Base**: Maintain a searchable knowledge base of past discussions using MongoDB Atlas Vector Search
- 🌍 **Multi-language Support**: Support multi-language transcription and cultural context adaptation

## Technology Stack

### Frontend
- React (with Vite)
- React Router
- Socket.IO Client
- Tailwind CSS
- Axios
- React Hot Toast

### Backend
- Node.js + Express
- Socket.IO (WebSocket handling)
- MongoDB + Mongoose
- MongoDB Atlas Vector Search
- Deepgram SDK (Speech-to-text)
- OpenAI API (GPT for summarization and task extraction)
- JWT Authentication

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (with Vector Search enabled)
- Deepgram API key
- OpenAI API key

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend` directory:
```env
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_here
DEEPGRAM_API_KEY=your_deepgram_api_key
OPENAI_API_KEY=your_openai_api_key
```

4. Create the `uploads` directory:
```bash
mkdir uploads
```

5. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

4. Start the frontend development server:
```bash
npm run dev
```

## MongoDB Atlas Vector Search Setup

1. Create a MongoDB Atlas cluster (M10 or higher recommended)
2. Enable Vector Search on your cluster
3. Create a vector search index on your `knowledgebases` collection:
   - Field name: `embedding`
   - Type: `knnVector`
   - Dimensions: `1536` (for OpenAI embeddings)
   - Similarity: `cosine`

Example index definition:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

## Usage

1. Start both backend and frontend servers
2. Open your browser and navigate to `http://localhost:5173`
3. Register a new account or login
4. Create a new meeting
5. Start recording or upload an audio file
6. View real-time transcription
7. Complete the meeting to generate AI summaries and extract action items
8. Search the knowledge base for past meeting context

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Meetings
- `GET /api/meetings` - Get all meetings (protected)
- `GET /api/meetings/:id` - Get single meeting (protected)
- `POST /api/meetings` - Create meeting (protected)
- `PUT /api/meetings/:id` - Update meeting (protected)
- `DELETE /api/meetings/:id` - Delete meeting (protected)
- `POST /api/meetings/:id/complete` - Complete meeting and generate AI content (protected)
- `POST /api/meetings/:id/process` - Process meeting with AI (protected)

### Transcripts
- `POST /api/transcripts/upload` - Upload and transcribe audio file (protected)
- `GET /api/transcripts/:meetingId` - Get transcript for meeting (protected)

### Action Items
- `GET /api/action-items` - Get all action items (protected)
- `GET /api/action-items/:id` - Get single action item (protected)
- `POST /api/action-items` - Create action item (protected)
- `PUT /api/action-items/:id` - Update action item (protected)
- `DELETE /api/action-items/:id` - Delete action item (protected)

### Knowledge Base
- `POST /api/knowledge-base/search` - Search knowledge base (protected)

## Socket.IO Events

### Client to Server
- `join-meeting` - Join a meeting room
- `start-transcription` - Start live transcription
- `stop-transcription` - Stop live transcription
- `audio-data` - Send audio data chunks

### Server to Client
- `joined-meeting` - Confirmation of joining meeting
- `transcription-started` - Transcription has started
- `transcription-stopped` - Transcription has stopped
- `transcript-interim` - Interim transcription results
- `transcript-final` - Final transcription results
- `transcription-error` - Transcription error occurred

## Project Structure

```
MeetMind/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   ├── socket/         # Socket.IO handlers
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API and Socket services
│   │   ├── contexts/       # React contexts
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   └── package.json
└── README.md
```

## Development

- Backend runs on `http://localhost:5001`
- Frontend runs on `http://localhost:5173`

## Troubleshooting

- Backend not starting or login/register failing:
  - Ensure `MONGODB_URI` and `JWT_SECRET` are set in `backend/.env`.
  - AI keys (`OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, etc.) are optional; without them, AI features are disabled but auth works.
  - Check the backend health: `GET http://localhost:5001/api/health`.
  - If port 5001 is in use, free it on Windows:
    ```powershell
    Get-NetTCPConnection -LocalPort 5001 | Select-Object OwningProcess
    Stop-Process -Id <PID> -Force
    ```
- Frontend cannot reach backend:
  - Set `VITE_API_URL` in `frontend/.env` to `http://localhost:5001/api`.
  - Verify CORS origin matches `FRONTEND_URL` in backend `.env`.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
