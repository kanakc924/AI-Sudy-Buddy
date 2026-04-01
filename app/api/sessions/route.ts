import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Session from "../../../models/Session";
import Topic from "../../../models/Topic";
import { withAuth, AuthenticatedRequest } from "../../../lib/middleware";

async function logSession(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user.id;
    const body = await req.json();
    const { topicId, type, score, totalQuestions, correctAnswers, duration } = body;
    
    if (!topicId || !type || score === undefined || totalQuestions === undefined || correctAnswers === undefined) {
      return NextResponse.json(
        { success: false, error: { message: "Missing required fields", code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const session = await Session.create({
      userId,
      topicId,
      type,
      score,
      totalQuestions,
      correctAnswers,
      duration: duration || 0,
    });

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error: any) {
    console.error("Log Session Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

async function getSessions(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user.id;

    // Optional query parameters like limit or topicId
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const topicId = searchParams.get("topicId");
    const subjectId = searchParams.get("subjectId");

    const query: any = { userId };
    if (topicId) query.topicId = topicId;
    if (subjectId) {
      // Find all topics for this subject
      const topics = await Topic.find({ subjectId, userId }).select("_id");
      const topicIds = topics.map(t => t._id);
      query.topicId = { $in: topicIds };
    }

    const sessions = await Session.find(query)
      .sort({ completedAt: -1 })
      .limit(limit)
      .populate("topicId", "title");

    return NextResponse.json({ success: true, data: sessions }, { status: 200 });
  } catch (error: any) {
    console.error("Get Sessions Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const POST = withAuth(logSession);
export const GET = withAuth(getSessions);
