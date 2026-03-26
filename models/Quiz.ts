import mongoose, { Document, Model, Schema } from "mongoose";

export interface IQuizQuestion {
  question: string;
  options: string[]; // exactly 4
  correctIndex: number; // 0-3
  explanation: string;
}

export interface IQuiz extends Document {
  topicId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  questions: IQuizQuestion[];
  isEdited: boolean;
  createdAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questions: [
      {
        question: { type: String, required: true },
        options: { type: [String], required: true },
        correctIndex: { type: Number, required: true },
        explanation: { type: String, required: true },
      },
    ],
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", quizSchema);

export default Quiz;
