import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  type: "flashcard" | "quiz";
  score: number; // percentage, 0-100
  totalQuestions: number;
  correctAnswers: number;
  answers: Array<{
    questionId: string;
    isCorrect: boolean;
  }>;
  duration: number; // in seconds
  completedAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
  type: { type: String, enum: ["flashcard", "quiz"], required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  answers: [
    {
      questionId: { type: String, required: true },
      isCorrect: { type: Boolean, required: true },
    },
  ],
  duration: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
});

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", sessionSchema);

export default Session;
