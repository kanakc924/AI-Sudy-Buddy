import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Topic from "../../../../../models/Topic";
import { withAuth, AuthenticatedRequest } from "../../../../../lib/middleware";

async function updateNotes(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;
    const body = await req.json();
    const { notes } = body;

    if (notes === undefined) {
      return NextResponse.json(
        { success: false, error: { message: "Notes content is required", code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const topic = await Topic.findOneAndUpdate(
      { _id: id, userId },
      { $set: { notes } },
      { new: true, runValidators: true }
    );

    if (!topic) {
      return NextResponse.json(
        { success: false, error: { message: "Topic not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: topic });
  } catch (error: any) {
    console.error("Update Notes Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(updateNotes);
