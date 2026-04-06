import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import Topic from "../../../../../models/Topic";
import Subject from "../../../../../models/Subject";
import { withAuth, AuthenticatedRequest } from "../../../../../lib/middleware";
import { CreateTopicSchema } from "../../../../../schemas/topic.schema";

async function getTopics(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;
    const subjectId = id;

    const topics = await Topic.find({ subjectId, userId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: topics });
  } catch (error: any) {
    console.error("Get Topics Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

async function createTopic(req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const userId = req.user.id;
    const { id } = await context.params;
    const subjectId = id;
    const body = await req.json();
    const validation = CreateTopicSchema.safeParse(body);

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

    const { title, notes } = validation.data;

    // Verify subject belongs to user
    const subject = await Subject.findOne({ _id: subjectId, userId });
    if (!subject) {
      return NextResponse.json(
        { success: false, error: { message: "Subject not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    const topic = await Topic.create({
      subjectId,
      userId,
      title,
      notes: notes || "",
    });

    return NextResponse.json({ success: true, data: topic }, { status: 201 });
  } catch (error: any) {
    console.error("Create Topic Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTopics);
export const POST = withAuth(createTopic);
