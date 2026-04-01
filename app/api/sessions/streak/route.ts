import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Session from "@/models/Session";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";

async function getStreak(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user.id;

    const sessions = await Session.find({ userId }).sort({ completedAt: 1 }).select("completedAt");
    
    let currentStreak = 0;
    
    if (sessions.length > 0) {
      const activityMap: Record<string, number> = {};
      sessions.forEach(session => {
        if (!session.completedAt) return;
        const d = new Date(session.completedAt);
        if (isNaN(d.getTime())) return;
        const dateStr = d.toISOString().split("T")[0];
        if (!activityMap[dateStr]) activityMap[dateStr] = 0;
        activityMap[dateStr]++;
      });

      let dateToCheck = new Date();
      dateToCheck.setHours(0, 0, 0, 0);
      
      while (true) {
        let dateStr = dateToCheck.toISOString().split("T")[0];
        
        if (activityMap[dateStr] && activityMap[dateStr] > 0) {
          currentStreak++;
          dateToCheck.setDate(dateToCheck.getDate() - 1);
        } else if (currentStreak === 0) {
          const yesterday = new Date(dateToCheck);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          
          if (activityMap[yesterdayStr] && activityMap[yesterdayStr] > 0) {
            currentStreak++;
            dateToCheck.setDate(dateToCheck.getDate() - 2);
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        currentStreak
      },
    });
  } catch (error: any) {
    console.error("Streak API Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStreak);
