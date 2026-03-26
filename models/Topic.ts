import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISourceImage {
  url: string;
  publicId: string;
  extractedText?: string;
  uploadedAt: Date;
}

export interface ITopic extends Document {
  subjectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  notes?: string;
  summary?: string;
  sourceImages: ISourceImage[];
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    notes: { type: String, default: "" },
    summary: { type: String },
    sourceImages: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        extractedText: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Topic: Model<ITopic> =
  mongoose.models.Topic || mongoose.model<ITopic>("Topic", topicSchema);

export default Topic;
