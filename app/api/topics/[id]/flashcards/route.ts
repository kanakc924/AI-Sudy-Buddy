import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Flashcard from "../../../../../models/Flashcard";
import { withAuth, AuthenticatedRequest } from "../../../../../lib/middleware";

async function getTopicFlashcards(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id: topicId } = await context.params;

    const flashcards = await Flashcard.find({ topicId, userId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: flashcards }, { status: 200 });
  } catch (error: any) {
    console.error("Get Flashcards Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTopicFlashcards);
