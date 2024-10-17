import mongoose, { InferSchemaType } from "mongoose";

const Schema = mongoose.Schema;

const questionSchema = new Schema({
    qid: {
        type: Number,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    categories: {
        type: [String],
        required: true
    },
    complexity: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        default: "Easy",
        required: true
    }
})
type Question = InferSchemaType<typeof questionSchema>;

export default mongoose.model<Question>("Question", questionSchema);
