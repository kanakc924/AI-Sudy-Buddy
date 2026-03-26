import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Quiz from "../../../../../models/Quiz";
import { withAuth, AuthenticatedRequest } from "../../../../../lib/middleware";

async function getTopicQuizzes(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id: topicId } = await context.params;

    const quizzes = await Quiz.find({ topicId, userId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: quizzes }, { status: 200 });
  } catch (error: any) {
    console.error("Get Quizzes Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTopicQuizzes);
