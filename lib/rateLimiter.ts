import { NextRequest, NextResponse } from "next/server";
import connectDB from "./db";
import ApiUsage from "../models/ApiUsage";

const rateLimitMap = new Map<string, number[]>();

export async function aiRateLimiter(req: NextRequest, userId: string) {
  // 1. Short-term in-memory limit (prevent spamming OpenRouter)
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 15; // Stay under OpenRouter's 20/min to have buffer

  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, []);
  }

  const timestamps = rateLimitMap
    .get(userId)!
    .filter((t) => now - t < windowMs);
    
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);

  if (timestamps.length > maxRequests) {
    return NextResponse.json(
      {
        success: false,
        error: "You are generating too fast. Please wait a moment before trying again.",
        code: "AI_RATE_LIMIT",
        retryAfter: Math.ceil(windowMs / 1000),
      },
      { status: 429 }
    );
  }

  // 2. Daily limit from Free Tier OpenRouter specs (mange via DB)
  try {
    await connectDB();
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    const maxDailyRequests = 200;

    let usage = await ApiUsage.findOne({ userId, date: today });
    
    if (!usage) {
      usage = new ApiUsage({ userId, date: today, count: 1 });
      await usage.save();
    } else {
      if (usage.count >= maxDailyRequests) {
        return NextResponse.json(
          {
            success: false,
            error: "Daily free-tier AI limit reached. Please try again tomorrow.",
            code: "AI_DAILY_LIMIT",
          },
          { status: 429 }
        );
      }
      usage.count += 1;
      await usage.save();
    }
  } catch (error) {
    console.error("Rate limiter DB error:", error);
    // Don't block the request if the usage tracker fails to connect, but log it
  }

  return null; // indicate no rate limit reached
}
