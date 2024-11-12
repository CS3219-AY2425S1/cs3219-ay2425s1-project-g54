import mongoose, { InferSchemaType } from "mongoose";

const Schema = mongoose.Schema;

const chatHistorySchema = new Schema({
  roomId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },

  username: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Create index to optimize query performance by roomId and timestamp
chatHistorySchema.index({ roomId: 1, timestamp: 1 });

type ChatMessage = InferSchemaType<typeof chatHistorySchema>;

export default mongoose.model<ChatMessage>("ChatMessage", chatHistorySchema);
