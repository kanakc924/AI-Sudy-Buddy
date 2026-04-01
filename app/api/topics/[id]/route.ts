import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Topic from "../../../../models/Topic";
import Subject from "../../../../models/Subject";
import Flashcard from "../../../../models/Flashcard";
import Quiz from "../../../../models/Quiz";
import Session from "../../../../models/Session";
import { withAuth, AuthenticatedRequest } from "../../../../lib/middleware";
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

    return NextResponse.json({ success: true, data: topic });
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

    const topic = await Topic.findOneAndUpdate(
      { _id: id, userId },
      { $set: body },
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
    await Flashcard.deleteMany({ topicId: id });
    await Quiz.deleteMany({ topicId: id });
    await Session.deleteMany({ topicId: id });

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