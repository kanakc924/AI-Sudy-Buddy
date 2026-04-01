import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";

export interface IApiUsage extends Document {
  userId: IUser["_id"];
  date: string; // YYYY-MM-DD
  count: number;
}

const ApiUsageSchema = new Schema<IApiUsage>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String, // String representation of the date (YYYY-MM-DD)
    required: true,
  },
  count: {
    type: Number,
    required: true,
    default: 0,
  },
}, { timestamps: true });

// Create a compound unique index so we can quickly find or upsert a user's usage for a specific day
ApiUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.ApiUsage || mongoose.model<IApiUsage>("ApiUsage", ApiUsageSchema);
