import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISourceMaterial {
  type: 'image' | 'pdf' | 'text' | 'note' | 'diagram';
  title: string;
  url?: string;
  publicId?: string;
  extractedText?: string;
  content?: string;
  fileName?: string;
  fileExtension?: string;
  uploadedAt: Date;
}

export interface ITopic extends Document {
  subjectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  notes?: string;
  summary?: any;
  sourceImages: any[]; // Deprecated, move to sourceMaterials
  sourceMaterials: ISourceMaterial[];
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    notes: { type: String, default: "" },
    summary: { type: Schema.Types.Mixed },
    sourceImages: [],
    sourceMaterials: [
      {
        type: { type: String, enum: ['image', 'pdf', 'text', 'note', 'diagram'], required: true },
        title: { type: String, required: true },
        url: { type: String },
        publicId: { type: String },
        extractedText: { type: String },
        content: { type: String },
        fileName: { type: String },
        fileExtension: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Force schema refresh in development to ensure new fields like sourceMaterials are recognized
if (process.env.NODE_ENV === 'development' && mongoose.models.Topic) {
  delete mongoose.models.Topic;
}

const Topic: Model<ITopic> =
  mongoose.models.Topic || mongoose.model<ITopic>("Topic", topicSchema);

export default Topic;
