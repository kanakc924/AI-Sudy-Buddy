import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFlashcard extends Document {
  topicId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  isEdited: boolean;
  createdAt: Date;
}

const flashcardSchema = new Schema<IFlashcard>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

const Flashcard: Model<IFlashcard> =
  mongoose.models.Flashcard || mongoose.model<IFlashcard>("Flashcard", flashcardSchema);

export default Flashcard;
