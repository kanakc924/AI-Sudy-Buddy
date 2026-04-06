import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Topic from "../../../../models/Topic";
import Subject from "../../../../models/Subject";
import Flashcard from "../../../../models/Flashcard";
import Quiz from "../../../../models/Quiz";
import Session from "../../../../models/Session";
import { withAuth, AuthenticatedRequest } from "../../../../lib/middleware";
import { UpdateTopicSchema } from "../../../../schemas/topic.schema";
import mongoose from "mongoose";

async function getTopic(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectDB();
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid topic ID", code: "VALIDATION_ERROR" } }, 
        { status: 400 }
      );
    }

    const topic = await Topic.findOne({ _id: id, userId }).populate({ path: "subjectId", model: Subject });

    if (!topic) {
      return NextResponse.json(
        { success: false, error: { message: "Topic not found", code: "NOT_FOUND" } }, 
        { status: 404 }
      );
    }

    // Include counts for frontend logic
    const [flashcardsCount, quizCount] = await Promise.all([
      Flashcard.countDocuments({ topicId: id, userId }),
      Quiz.countDocuments({ topicId: id, userId })
    ]);

    const topicData = {
      ...topic.toObject(),
      flashcardsCount,
      quizCount
    };

    return NextResponse.json({ success: true, data: topicData });
  } catch (error: any) {
    console.error("Topic GET error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } }, 
      { status: 500 }
    );
  }
}

async function updateTopic(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectDB();
    const userId = req.user.id;
    const body = await req.json();
    const validation = UpdateTopicSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: validation.error.issues[0].message, 
            code: "VALIDATION_ERROR",
            details: validation.error.issues
          } 
        },
        { status: 400 }
      );
    }

    const topic = await Topic.findOneAndUpdate(
      { _id: id, userId },
      { $set: validation.data },
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
    console.error("Topic PUT error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } }, 
      { status: 500 }
    );
  }
}

async function deleteTopic(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectDB();
    const userId = req.user.id;

    const topic = await Topic.findOneAndDelete({ _id: id, userId });

    if (!topic) {
      return NextResponse.json(
        { success: false, error: { message: "Topic not found", code: "NOT_FOUND" } }, 
        { status: 404 }
      );
    }

    // Cascade delete related entities
    await Flashcard.deleteMany({ topicId: id, userId });
    await Quiz.deleteMany({ topicId: id, userId });
    await Session.deleteMany({ topicId: id, userId });

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    console.error("Topic DELETE error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } }, 
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTopic);
export const PUT = withAuth(updateTopic);
export const DELETE = withAuth(deleteTopic);