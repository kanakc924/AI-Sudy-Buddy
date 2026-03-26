import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubject extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

const Subject: Model<ISubject> =
  mongoose.models.Subject || mongoose.model<ISubject>("Subject", subjectSchema);

export default Subject;
