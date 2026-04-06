import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "../../../../lib/db";
import { withAuth, AuthenticatedRequest } from "../../../../lib/middleware";
import { aiRateLimiter } from "../../../../lib/rateLimiter";
import { generateFlashcardsFromImage, generateQuizFromImage } from "../../../../services/ai.service";
import { errorResponse } from "../../../../lib/handleApiError";
import Flashcard from "../../../../models/Flashcard";
import Quiz from "../../../../models/Quiz";
import Topic from "../../../../models/Topic";

export const maxDuration = 60; // Allows longer timeout if supported by vercel/deployment

async function generateFromImageRoute(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user.id;

    // Check rate limit
    const { limitedResponse, limit, remaining, reset } = await aiRateLimiter(req, userId);
    if (limitedResponse) return limitedResponse;

    const headers = {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
    };

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "flashcard" or "quiz"
    const topicId = formData.get("topicId") as string | null;

    if (!file || !type || !topicId) {
      return NextResponse.json(
        { success: false, error: "File, type, and topicId are required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return NextResponse.json(
        { success: false, error: "Invalid topic ID format", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }


    const topic = await Topic.findOne({ _id: topicId, userId });
    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Topic not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid image type. Only JPG, PNG, WEBP allowed.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let generatedData: any = null;

    if (type === "flashcard") {
      const generatedFlashcards = await generateFlashcardsFromImage(uint8Array, file.type);
      
      const savedCards = await Flashcard.insertMany(
        generatedFlashcards.map((card: any) => ({
          topicId: topic._id,
          userId,
          question: card.question,
          answer: card.answer,
        }))
      );
      generatedData = savedCards;
    } else if (type === "quiz") {
      const generatedQuestions = await generateQuizFromImage(uint8Array, file.type);
      
      const savedQuiz = await Quiz.create({
        topicId: topic._id,
        userId,
        questions: generatedQuestions,
      });
      generatedData = [savedQuiz]; // Match the array expectation for quizzes
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be 'flashcard' or 'quiz'.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: generatedData }, { status: 201, headers });
  } catch (error: any) {
    return errorResponse(error);
  }
}

export const POST = withAuth(generateFromImageRoute);
