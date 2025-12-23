import KnowledgeBase from '../models/KnowledgeBase.js';
import openaiService from './openaiService.js';
import mongoose from 'mongoose';
import Meeting from '../models/Meeting.js';

class VectorService {
  // Store content with embedding
  async storeContent(meetingId, userId, content, contentType = 'transcript', metadata = {}) {
    try {
      console.log(`💾 Generating embedding for ${contentType}...`);
      // Generate embedding
      const embedding = await openaiService.generateEmbedding(content);

      if (!embedding || embedding.length === 0) {
        console.warn(`⚠️  No embedding generated for ${contentType}`);
        return null;
      }

      console.log(`✅ Embedding generated (${embedding.length} dimensions)`);

      // Store in MongoDB with embedding
      const knowledgeEntry = await KnowledgeBase.create({
        meetingId,
        userId,
        content,
        contentType,
        metadata,
        embedding,
      });

      console.log(`📍 Stored knowledge base entry:`, { _id: knowledgeEntry._id, contentType });
      return knowledgeEntry;
    } catch (error) {
      console.error('❌ Vector storage error:', error.message);
      throw new Error(`Failed to store content: ${error.message}`);
    }
  }

  // Semantic + structured search
  async searchSimilar(userId, query, limit = 10, filters = {}) {
    try {
      console.log(`🔎 Knowledge Base search initiated:`, { userId, query, limit, filters });

      // 1) Structured search shortcuts
      const titleMatch = query.match(/^title:\s*(.+)$/i);
      if (titleMatch) {
        const title = titleMatch[1].trim();
        const results = await KnowledgeBase.find({
          userId,
          'metadata.title': new RegExp(title, 'i'),
        })
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate('meetingId')
          .lean();

        return results.map((result) => ({
          _id: result._id,
          content: result.content,
          contentType: result.contentType,
          metadata: result.metadata,
          meeting: result.meetingId,
          score: 1.0,
          createdAt: result.createdAt,
        }));
      }

      const idMatch = query.match(/^(id|meeting):\s*(.+)$/i);
      if (idMatch) {
        const id = idMatch[2].trim();
        const meetingId = mongoose.Types.ObjectId.isValid(id)
          ? new mongoose.Types.ObjectId(id)
          : id;
        const results = await KnowledgeBase.find({ userId, meetingId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate('meetingId')
          .lean();

        return results.map((result) => ({
          _id: result._id,
          content: result.content,
          contentType: result.contentType,
          metadata: result.metadata,
          meeting: result.meetingId,
          score: 1.0,
          createdAt: result.createdAt,
        }));
      }

      // 2) Semantic search using MongoDB Atlas Vector Search
      const queryEmbedding = await openaiService.generateEmbedding(query);

      // Build filter object
      const matchFilter = { userId };
      if (filters.meetingId) {
        matchFilter.meetingId = filters.meetingId;
      }
      if (filters.contentType) {
        matchFilter.contentType = filters.contentType;
      }
      if (filters.title) {
        matchFilter['metadata.title'] = new RegExp(filters.title, 'i');
      }
      if (filters.startDate || filters.endDate) {
        matchFilter.createdAt = {};
        if (filters.startDate) {
          matchFilter.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          matchFilter.createdAt.$lte = new Date(filters.endDate);
        }
      }

      const pipeline = [
        {
          $vectorSearch: {
            index: 'vector_search',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: Math.min(limit * 10, 100),
            limit: limit,
          },
        },
        { $match: matchFilter },
        { $addFields: { score: { $meta: 'vectorSearchScore' } } },
        { $sort: { score: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'meetings',
            localField: 'meetingId',
            foreignField: '_id',
            as: 'meeting',
          },
        },
        { $unwind: { path: '$meeting', preserveNullAndEmptyArrays: true } },
      ];

      console.log('🔍 Vector search query:', { index: 'vector_search', queryLength: query.length, limit });
      const results = await KnowledgeBase.aggregate(pipeline);
      console.log(`✅ Vector search returned ${results.length} results`);

      return results.map((result) => ({
        _id: result._id,
        content: result.content,
        contentType: result.contentType,
        metadata: result.metadata,
        meeting: result.meeting,
        score: result.score,
        createdAt: result.createdAt,
      }));
    } catch (error) {
      console.warn('Vector search error (using fallback):', error.message);
      console.log('Falling back to text-based search...');
      return this.fallbackTextSearch(userId, query, limit, filters);
    }
  }

  // Fallback text search if vector search is not configured
  async fallbackTextSearch(userId, query, limit = 10, filters = {}) {
    try {
      // Structured title/id shortcuts
      const titleMatch = query.match(/^title:\s*(.+)$/i);
      const idMatch = query.match(/^(id|meeting):\s*(.+)$/i);

      const matchFilter = { userId };
      if (titleMatch) {
        matchFilter['metadata.title'] = new RegExp(titleMatch[1].trim(), 'i');
      } else if (!idMatch) {
        matchFilter.content = { $regex: query, $options: 'i' };
      }

      if (filters.meetingId) matchFilter.meetingId = filters.meetingId;
      if (filters.contentType) matchFilter.contentType = filters.contentType;

      if (idMatch) {
        const id = idMatch[2].trim();
        matchFilter.meetingId = mongoose.Types.ObjectId.isValid(id)
          ? new mongoose.Types.ObjectId(id)
          : id;
      }

      const results = await KnowledgeBase.find(matchFilter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('meetingId')
        .lean();

      return results.map((result) => ({
        _id: result._id,
        content: result.content,
        contentType: result.contentType,
        metadata: result.metadata,
        meeting: result.meetingId,
        score: 0.5,
        createdAt: result.createdAt,
      }));
    } catch (error) {
      console.error('Fallback text search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Store multiple content items for a meeting
  async storeMeetingContent(meetingId, userId, transcript, summary, minutes, actionItems = []) {
    try {
      const meeting = await Meeting.findById(meetingId).lean();
      if (!meeting) {
        console.warn(`Meeting not found for ID: ${meetingId}`);
        return false;
      }
      const title = meeting?.title || 'Meeting';
      console.log(`📚 Storing knowledge base content for meeting: ${title}`);
      const operations = [];

      if (transcript) {
        operations.push(
          this.storeContent(meetingId, userId, transcript, 'transcript', {
            type: 'full_transcript',
            title,
          })
        );
      }

      if (summary) {
        operations.push(
          this.storeContent(meetingId, userId, summary, 'summary', {
            type: 'meeting_summary',
            title,
          })
        );
      }

      if (minutes) {
        operations.push(
          this.storeContent(meetingId, userId, minutes, 'minutes', {
            type: 'meeting_minutes',
            title,
          })
        );
      }

      for (const item of actionItems) {
        const actionItemText = `${item.title}${item.description ? ': ' + item.description : ''}`;
        operations.push(
          this.storeContent(meetingId, userId, actionItemText, 'action-item', {
            actionItemId: item._id || item.id,
            assignee: item.assignee,
            dueDate: item.dueDate,
            priority: item.priority,
            title,
          })
        );
      }

      await Promise.all(operations);
      console.log(`✅ Stored ${operations.length} knowledge base entries for meeting: ${title}`);
      return true;
    } catch (error) {
      console.error('❌ Store meeting content error:', error.message);
      throw new Error(`Failed to store meeting content: ${error.message}`);
    }
  }
}

export default new VectorService();
