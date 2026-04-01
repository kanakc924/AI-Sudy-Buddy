import { NextResponse } from "next/server";
import connectDB from "../../../../../../lib/db";
import Topic from "../../../../../../models/Topic";
import Flashcard from "../../../../../../models/Flashcard";
import { withAuth, AuthenticatedRequest } from "../../../../../../lib/middleware";
import { aiRateLimiter } from "../../../../../../lib/rateLimiter";
import { generateFlashcards } from "../../../../../../services/ai.service";
import { errorResponse } from "../../../../../../lib/handleApiError";

async function generateFlashcardsRoute(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;

    // Check rate limit
    const rateLimitResponse = await aiRateLimiter(req, userId);
    if (rateLimitResponse) return rateLimitResponse;

    // Check for replace flag in body
    let replace = false;
    try {
      const body = await req.json();
      replace = body.replace === true;
    } catch (e) {
      // Body may be empty or not JSON, which is fine for default behavior
    }

    const topic = await Topic.findOne({ _id: id, userId });

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Topic not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!topic.notes || topic.notes.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Topic has no notes to generate from", code: "NO_CONTENT" },
        { status: 400 }
      );
    }

    const flashcardsData = await generateFlashcards(topic.notes);

    // If replace is requested, remove existing cards for this topic
    if (replace) {
      await Flashcard.deleteMany({ topicId: id, userId });
    }

    // Save to DB
    const savedCards = await Flashcard.insertMany(
      flashcardsData.map((card) => ({
        topicId: topic._id,
        userId,
        question: card.question,
        answer: card.answer,
      }))
    );

    return NextResponse.json({ success: true, data: savedCards }, { status: 201 });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export const POST = withAuth(generateFlashcardsRoute);
