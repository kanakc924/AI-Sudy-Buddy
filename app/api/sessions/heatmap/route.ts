import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Session from "@/models/Session";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";

async function getHeatmap(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user.id;
    const url = new URL(req.url);
    const topicId = url.searchParams.get("topicId");

    const query: any = { userId };
    if (topicId) {
      query.topicId = topicId;
    }

    const sessions = await Session.find(query).sort({ completedAt: 1 }).select("completedAt");

    const activityHeatmapMap: Record<string, number> = {};
    sessions.forEach(session => {
      if (!session.completedAt) return;
      
      const d = new Date(session.completedAt);
      if (isNaN(d.getTime())) return;
      
      const dateStr = d.toISOString().split("T")[0];
      if (!activityHeatmapMap[dateStr]) {
        activityHeatmapMap[dateStr] = 0;
      }
      activityHeatmapMap[dateStr] += 1;
    });

    const activityHeatmap = Object.keys(activityHeatmapMap).map(date => ({
      date,
      count: activityHeatmapMap[date]
    }));

    // If a specific topic heatmap is requested, we can return just that since the route might be generic
    return NextResponse.json({
      success: true,
      data: activityHeatmap,
    });
  } catch (error: any) {
    console.error("Heatmap API Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHeatmap);
