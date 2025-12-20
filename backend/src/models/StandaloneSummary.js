import mongoose from 'mongoose';

const standaloneSummarySchema = new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      fileName: {
        type: String,
        required: true,
      },
      fileType: {
        type: String,
        required: true,
      },
      fileSize: {
        type: Number,
      },
      transcript: {
        type: String,
        default: '',
      },
      summary: {
        type: String,
        default: '',
      },
      // summaryWithDiagrams: {
      //   type: String, // Will contain Mermaid diagram syntax
      //   default: '',
      // },
      // flowDiagram: {
      //   type: String, // Mermaid flowchart syntax
      //   default: '',
      // },
      language: {
        type: String,
        default: 'en',
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

  standaloneSummarySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('StandaloneSummary', standaloneSummarySchema);