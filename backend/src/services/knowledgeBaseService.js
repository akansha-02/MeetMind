import axios from "axios";
import mongoose from "mongoose";
import Meeting from "../models/Meeting.js";
import ActionItem from "../models/ActionItem.js";

class KnowledgeBaseService {
  // Generate embeddings using OpenAI
  async generateEmbedding(text) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not configured");
      return null;
    }

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/embeddings",
        {
          input: text,
          model: "text-embedding-3-small",
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error.message);
      return null;
    }
  }

  // Store meeting summary with embedding
  async storeMeetingSummary(meetingId, summary, transcript) {
    try {
      const textToEmbed = `${summary} ${transcript}`.substring(0, 8191); // OpenAI limit
      const embedding = await this.generateEmbedding(textToEmbed);

      if (!embedding) {
        console.warn("Skipping embedding storage - API unavailable");
        return;
      }

      await Meeting.findByIdAndUpdate(meetingId, { embedding }, { new: true });

      console.log(`✅ Embedding stored for meeting ${meetingId}`);
    } catch (error) {
      console.error("Error storing meeting summary:", error.message);
    }
  }

  // Search knowledge base using vector search
  async searchKnowledgeBase(userId, query, limit = 5) {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error("Search query cannot be empty");
      }

      console.log(
        `🔍 Searching knowledge base for user: ${userId}, query: "${query}"`
      );

      // Generate embedding for search query
      const queryEmbedding = await this.generateEmbedding(query);

      if (!queryEmbedding) {
        console.warn(
          "⚠️  Could not generate embedding, falling back to text search"
        );
        return this.fallbackTextSearch(userId, query, limit);
      }

      // Try vector search first (MongoDB Atlas Vector Search)
      try {
        const results = await Meeting.aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryEmbedding,
              numCandidates: Math.min(limit * 10, 100),
              limit: limit,
            },
          },
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              status: "completed",
            },
          },
          {
            $addFields: {
              score: { $meta: "vectorSearchScore" },
            },
          },
          {
            $project: {
              title: 1,
              summary: 1,
              transcript: 1,
              startTime: 1,
              endTime: 1,
              participants: 1,
              score: 1,
            },
          },
          { $sort: { score: -1 } },
          { $limit: limit },
        ]);

        console.log(`✅ Vector search returned ${results.length} results`);

        // Format results to match expected structure
        return results.map((meeting) => ({
          _id: meeting._id,
          content:
            meeting.summary || meeting.transcript?.substring(0, 500) || "",
          contentType: "summary",
          metadata: {
            title: meeting.title,
            startTime: meeting.startTime,
          },
          meeting: {
            _id: meeting._id,
            title: meeting.title,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            participants: meeting.participants || [],
          },
          score: meeting.score || 0,
        }));
      } catch (vectorError) {
        console.warn(
          "⚠️  Vector search failed, falling back to text search:",
          vectorError.message
        );
        return this.fallbackTextSearch(userId, query, limit);
      }
    } catch (error) {
      console.error("❌ Error searching knowledge base:", error.message);
      throw error;
    }
  }

  // Fallback text search when vector search is unavailable
  async fallbackTextSearch(userId, query, limit = 5) {
    try {
      console.log(`📝 Using text-based search for: "${query}"`);

      const searchRegex = new RegExp(query, "i");

      const meetings = await Meeting.find({
        userId: new mongoose.Types.ObjectId(userId),
        status: "completed",
        $or: [
          { title: searchRegex },
          { summary: searchRegex },
          { transcript: searchRegex },
        ],
      })
        .sort({ startTime: -1 })
        .limit(limit)
        .select("title summary transcript startTime endTime participants")
        .lean();

      console.log(`✅ Text search returned ${meetings.length} results`);

      // Format results to match expected structure
      return meetings.map((meeting) => ({
        _id: meeting._id,
        content: meeting.summary || meeting.transcript?.substring(0, 500) || "",
        contentType: "summary",
        metadata: {
          title: meeting.title,
          startTime: meeting.startTime,
        },
        meeting: {
          _id: meeting._id,
          title: meeting.title,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          participants: meeting.participants || [],
        },
        score: 0.5,
      }));
    } catch (error) {
      console.error("❌ Fallback text search error:", error.message);
      return [];
    }
  }

  // Get meetings by month (NEW FEATURE)
  async getMeetingsByMonth(userId, year, month) {
    try {
      console.log(
        `Fetching meetings for userId: ${userId}, year: ${year}, month: ${month}`
      );

      const startDate = new Date(year, month - 1, 1); // First day of month
      const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

      console.log(`Date range: ${startDate} to ${endDate}`);

      const meetings = await Meeting.find({
        userId: new mongoose.Types.ObjectId(userId),
        status: "completed",
        startTime: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .sort({ startTime: -1 }) // Most recent first
        .select("title summary startTime endTime transcript")
        .lean();

      console.log(`Found ${meetings.length} meetings for ${year}-${month}`);

      // Fetch action items for all meetings
      const meetingIds = meetings.map((m) => m._id);
      const actionItems = await ActionItem.find({
        meetingId: { $in: meetingIds },
      })
        .select("meetingId title status priority dueDate")
        .lean();

      // Create a map of meetingId to action items
      const actionItemsMap = actionItems.reduce((acc, item) => {
        if (!acc[item.meetingId.toString()]) {
          acc[item.meetingId.toString()] = [];
        }
        acc[item.meetingId.toString()].push(item);
        return acc;
      }, {});

      // Attach action items to meetings
      const meetingsWithActions = meetings.map((meeting) => ({
        ...meeting,
        actionItems: actionItemsMap[meeting._id.toString()] || [],
      }));

      // Group by date
      const groupedByDate = meetingsWithActions.reduce((acc, meeting) => {
        const date = new Date(meeting.startTime).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(meeting);
        return acc;
      }, {});

      return {
        year,
        month,
        groupedByDate,
        totalMeetings: meetings.length,
      };
    } catch (error) {
      console.error("Error fetching meetings by month:", error.message);
      throw error;
    }
  }
}

export default new KnowledgeBaseService();
