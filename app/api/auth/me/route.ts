import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import ApiUsage from "../../../../models/ApiUsage";
import { withAuth, AuthenticatedRequest } from "../../../../lib/middleware";

async function getMeHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user.id;
    
    const user = await User.findById(userId).select("-passwordHash -__v");
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "User not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    // Fetch AI usage for today
    const todayStr = new Date().toISOString().split("T")[0];
    const usageDoc = await ApiUsage.findOne({ userId, date: todayStr });
    
    const userData = {
      ...user.toObject(),
      aiUsageToday: usageDoc ? usageDoc.count : 0,
      aiDailyLimit: 200 // Constant from PRD
    };

    return NextResponse.json({ success: true, data: userData });
  } catch (error: any) {
    console.error("GetMe Error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getMeHandler);
