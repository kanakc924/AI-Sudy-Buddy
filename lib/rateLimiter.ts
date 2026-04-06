import { NextRequest, NextResponse } from "next/server";
import connectDB from "./db";
import ApiUsage from "../models/ApiUsage";

const rateLimitMap = new Map<string, number[]>();

export async function aiRateLimiter(req: NextRequest, userId: string): Promise<{
  limitedResponse?: NextResponse;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const now = Date.now();
  const dailyLimit = 200;
  
  // Calculate reset time (seconds until midnight)
  const tomorrow = new Date();
  tomorrow.setUTCHours(23, 59, 59, 999);
  const reset = Math.ceil((tomorrow.getTime() - now) / 1000);

  // 1. Short-term in-memory limit (prevent spamming)
  const windowMs = 60 * 1000;
  const maxRequestsMinute = 15;

  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, []);
  }

  let timestamps = rateLimitMap.get(userId)!.filter((t) => now - t < windowMs);
  
  if (timestamps.length >= maxRequestsMinute) {
    return {
      limitedResponse: NextResponse.json(
        {
          success: false,
          error: "You are generating too fast. Please wait a moment.",
          code: "AI_RATE_LIMIT",
          retryAfter: Math.ceil(windowMs / 1000),
        },
        { status: 429 }
      ),
      limit: dailyLimit,
      remaining: 0,
      reset
    };
  }

  // 2. Daily limit from DB
  try {
    await connectDB();
    const todayStr = new Date().toISOString().split("T")[0];
    let usage = await ApiUsage.findOne({ userId, date: todayStr });
    
    if (usage && usage.count >= dailyLimit) {
      return {
        limitedResponse: NextResponse.json(
          {
            success: false,
            error: "Daily free-tier AI limit reached.",
            code: "AI_DAILY_LIMIT",
          },
          { status: 429 }
        ),
        limit: dailyLimit,
        remaining: 0,
        reset
      };
    }

    // Increment usage
    if (!usage) {
      usage = new ApiUsage({ userId, date: todayStr, count: 1 });
    } else {
      usage.count += 1;
    }
    await usage.save();

    // Update in-memory for minute limit
    timestamps.push(now);
    rateLimitMap.set(userId, timestamps);

    return {
      limit: dailyLimit,
      remaining: dailyLimit - usage.count,
      reset
    };
  } catch (error) {
    console.error("Rate limiter error:", error);
    return {
      limit: dailyLimit,
      remaining: 0,
      reset
    };
  }
}
