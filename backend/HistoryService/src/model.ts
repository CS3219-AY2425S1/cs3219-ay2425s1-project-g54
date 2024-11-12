import mongoose, { InferSchemaType } from "mongoose";

const Schema = mongoose.Schema;

const historySchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  qid: {
    type: Number,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
  error: {
    type: Boolean,
    default: false
  }
});
historySchema.index({ userId: 1, timestamp: 1 }, { unique: true });

type Attempt = InferSchemaType<typeof historySchema>;

export default mongoose.model<Attempt>("Attempt", historySchema);
