import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Meeting from "../models/Meeting.js";
import deepgramService from "../services/deepgramService.js";

// Store active connections
const activeConnections = new Map(); // meetingId -> Set of socketIds
const meetingSockets = new Map(); // socketId -> { meetingId, deepgramConnection, transcript }

export const initializeSocket = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = user._id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join meeting room
    socket.on("join-meeting", async ({ meetingId }) => {
      try {
        const meeting = await Meeting.findById(meetingId);

        if (!meeting) {
          socket.emit("error", { message: "Meeting not found" });
          return;
        }

        // Check if user is owner or invited participant
        const isOwner = meeting.userId.toString() === socket.userId.toString();
        const isInvited = meeting.participants?.some(
          (p) => p.email.toLowerCase() === socket.user.email.toLowerCase()
        );

        console.log(`🔑 Access check for meeting ${meetingId}:`);
        console.log(`   User ID: ${socket.userId}`);
        console.log(`   User Email: ${socket.user.email}`);
        console.log(`   Meeting Owner: ${meeting.userId}`);
        console.log(`   Is Owner: ${isOwner}`);
        console.log(`   Is Invited: ${isInvited}`);
        console.log(
          `   Participants:`,
          meeting.participants?.map((p) => p.email)
        );

        if (!isOwner && !isInvited) {
          socket.emit("error", { message: "Access denied to this meeting" });
          console.log(`❌ Access denied for user ${socket.user.email}`);
          return;
        }

        socket.join(`meeting:${meetingId}`);
        socket.meetingId = meetingId;

        // Track active connections
        if (!activeConnections.has(meetingId)) {
          activeConnections.set(meetingId, new Set());
        }
        activeConnections.get(meetingId).add(socket.id);

        socket.emit("joined-meeting", { meetingId, meeting });
        console.log(`User ${socket.userId} joined meeting ${meetingId}`);
      } catch (error) {
        socket.emit("error", { message: "Failed to join meeting" });
        console.error("Join meeting error:", error);
      }
    });

    // Start live transcription
    socket.on("start-transcription", async ({ meetingId, language = "en" }) => {
      try {
        // Verify meeting access
        const meeting = await Meeting.findById(meetingId);

        if (!meeting) {
          socket.emit("error", { message: "Meeting not found" });
          return;
        }

        // Check if user is owner or invited participant
        const isOwner = meeting.userId.toString() === socket.userId.toString();
        const isInvited = meeting.participants?.some(
          (p) => p.email.toLowerCase() === socket.user.email.toLowerCase()
        );

        if (!isOwner && !isInvited) {
          socket.emit("error", { message: "Access denied to this meeting" });
          return;
        }

        // Create Deepgram live connection
        const deepgramConnection = deepgramService.createLiveConnection({
          language,
          interim_results: true,
        });

        let fullTranscript = meeting.transcript || "";

        // Handle Deepgram events
        deepgramConnection.on("open", () => {
          console.log(`Deepgram connection opened for meeting ${meetingId}`);
          io.to(`meeting:${meetingId}`).emit("transcription-started", {
            meetingId,
          });
        });

        deepgramConnection.on("message", async (data) => {
          try {
            const transcript = JSON.parse(data);

            if (transcript.channel?.alternatives?.[0]) {
              const alt = transcript.channel.alternatives[0];
              const text = alt.transcript;
              const isFinal = transcript.is_final;

              if (text) {
                if (isFinal) {
                  // Append final transcript
                  fullTranscript += (fullTranscript ? " " : "") + text;

                  // Update meeting in database
                  meeting.transcript = fullTranscript;
                  await meeting.save();

                  // Broadcast to all participants in the meeting room
                  console.log(
                    `📡 Broadcasting final transcript to meeting:${meetingId}`
                  );
                  io.to(`meeting:${meetingId}`).emit("transcript-final", {
                    text,
                    fullTranscript,
                    meetingId,
                  });
                } else {
                  // Send interim results to all participants
                  io.to(`meeting:${meetingId}`).emit("transcript-interim", {
                    text,
                    fullTranscript,
                    meetingId,
                  });
                }
              }
            }
          } catch (error) {
            console.error("Error processing Deepgram message:", error);
          }
        });

        deepgramConnection.on("error", (error) => {
          console.error("Deepgram connection error:", error);
          socket.emit("transcription-error", { message: error.message });
        });

        deepgramConnection.on("close", () => {
          console.log(`Deepgram connection closed for meeting ${meetingId}`);
          io.to(`meeting:${meetingId}`).emit("transcription-stopped", {
            meetingId,
          });
        });

        // Store connection info
        meetingSockets.set(socket.id, {
          meetingId,
          deepgramConnection,
          transcript: fullTranscript,
        });

        socket.deepgramConnection = deepgramConnection;
      } catch (error) {
        socket.emit("error", { message: "Failed to start transcription" });
        console.error("Start transcription error:", error);
      }
    });

    // Receive audio data from client
    socket.on("audio-data", (audioBuffer) => {
      if (socket.deepgramConnection) {
        socket.deepgramConnection.send(audioBuffer);
      }
    });

    // Stop transcription
    socket.on("stop-transcription", async () => {
      try {
        const connectionInfo = meetingSockets.get(socket.id);

        if (connectionInfo?.deepgramConnection) {
          connectionInfo.deepgramConnection.finish();
          socket.deepgramConnection = null;
          socket.emit("transcription-stopped", {
            meetingId: connectionInfo.meetingId,
          });
        }
      } catch (error) {
        console.error("Stop transcription error:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      try {
        const connectionInfo = meetingSockets.get(socket.id);

        // Clean up Deepgram connection
        if (connectionInfo?.deepgramConnection) {
          connectionInfo.deepgramConnection.finish();
        }

        // Remove from active connections
        if (socket.meetingId && activeConnections.has(socket.meetingId)) {
          activeConnections.get(socket.meetingId).delete(socket.id);
          if (activeConnections.get(socket.meetingId).size === 0) {
            activeConnections.delete(socket.meetingId);
          }
        }

        // Clean up socket tracking
        meetingSockets.delete(socket.id);

        console.log(`User disconnected: ${socket.userId}`);
      } catch (error) {
        console.error("Disconnect cleanup error:", error);
      }
    });
  });
};
