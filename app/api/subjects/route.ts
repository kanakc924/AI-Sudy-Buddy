import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Subject from "../../../models/Subject";
import Topic from "../../../models/Topic";
import { withAuth, AuthenticatedRequest } from "../../../lib/middleware";
import { CreateSubjectSchema } from "../../../schemas/subject.schema";

async function getSubjects(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user.id;
    const subjects = await Subject.find({ userId }).sort({ createdAt: -1 });
    
    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subject) => {
        const topicCount = await Topic.countDocuments({ subjectId: subject._id, userId });
        return {
          ...subject.toObject(),
          topicCount
        };
      })
    );

    return NextResponse.json({ success: true, data: subjectsWithCounts });
  } catch (error: any) {
    console.error("Get Subjects Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

async function createSubject(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user.id;
    const body = await req.json();
    const validation = CreateSubjectSchema.safeParse(body);

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

    const { title, description } = validation.data;

    const subject = await Subject.create({
      userId,
      title,
      description: description || "",
    });

    return NextResponse.json({ success: true, data: subject }, { status: 201 });
  } catch (error: any) {
    console.error("Create Subject Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getSubjects);
export const POST = withAuth(createSubject);
