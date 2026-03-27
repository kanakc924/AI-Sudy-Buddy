import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import Session from "@/models/Session";
import User from "@/models/User";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";

function getRelativeTime(date: Date) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysDifference === 0) {
    const hoursDifference = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60));
    if (hoursDifference === 0) {
      const minutesDifference = Math.round((date.getTime() - Date.now()) / (1000 * 60));
      return rtf.format(minutesDifference, 'minute');
    }
    return rtf.format(hoursDifference, 'hour');
  }
  return rtf.format(daysDifference, 'day');
}

async function getProgressStats(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user.id;

    // Total Subjects
    const totalSubjects = await Subject.countDocuments({ userId });

    // Total Sessions
    const totalSessions = await Session.countDocuments({ userId });

    // Average Quiz Score
    const quizSessions = await Session.find({ userId, type: "quiz" });
    let averageQuizScore = 0;
    if (quizSessions.length > 0) {
      const totalScore = quizSessions.reduce((acc, curr) => acc + curr.score, 0);
      averageQuizScore = Math.round(totalScore / quizSessions.length);
    }

    // Process stats for heatmap and streak
    const sessions = await Session.find({ userId }).sort({ completedAt: 1 }).select("completedAt score type");
    const activityMap: Record<string, number> = {};
    let currentStreak = 0;
    
    // Process stats for heatmap and streak
    if (sessions.length > 0) {
      // Create a map of date strings (YYYY-MM-DD) -> counts
      sessions.forEach(session => {
        if (!session.completedAt) return;
        const d = new Date(session.completedAt);
        if (isNaN(d.getTime())) return;
        const dateStr = d.toISOString().split("T")[0];
        if (!activityMap[dateStr]) activityMap[dateStr] = 0;
        activityMap[dateStr]++;
      });

      // Calculate streak
      let dateToCheck = new Date();
      dateToCheck.setHours(0, 0, 0, 0);
      
      // Look back day by day
      while (true) {
        let dateStr = dateToCheck.toISOString().split("T")[0];
        
        // Check if there was activity today or yesterday. 
        // We account for 'yesterday' if today has no activity yet but the streak shouldn't break.
        if (activityMap[dateStr] && activityMap[dateStr] > 0) {
          currentStreak++;
          dateToCheck.setDate(dateToCheck.getDate() - 1);
        } else if (currentStreak === 0) {
          // If we haven't started counting a streak, maybe yesterday was the last activity
          const yesterday = new Date(dateToCheck);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          
          if (activityMap[yesterdayStr] && activityMap[yesterdayStr] > 0) {
            currentStreak++;
            dateToCheck.setDate(dateToCheck.getDate() - 2); // move to day before yesterday
          } else {
            break; // No activity today or yesterday, streak is 0
          }
        } else {
          break; // Streak broken
        }
      }
    }

    // 1. Score Trend (last 7 days of quiz sessions)
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    
    const recentQuizSessions = sessions.filter(
      (s: any) => s.type === 'quiz' && new Date(s.completedAt) > last7Days
    )
    
    // Group by day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const scoreTrendMap: Record<string, { total: number, count: number }> = {}
    
    recentQuizSessions.forEach((s: any) => {
      const day = days[new Date(s.completedAt).getDay()]
      if (!scoreTrendMap[day]) scoreTrendMap[day] = { total: 0, count: 0 }
      scoreTrendMap[day].total += s.score
      scoreTrendMap[day].count += 1
    })
    
    const scoreTrend = Object.keys(scoreTrendMap).map(day => ({
      date: day,
      score: Math.round(scoreTrendMap[day].total / scoreTrendMap[day].count)
    }))

    // 2. Recent Sessions (last 5)
    // We already have `sessions` but they don't have topic populated. Let's fetch the actual last 5 sessions deeply.
    const last5Sessions = await Session.find({ userId })
      .sort({ completedAt: -1 })
      .limit(5)
      .populate({ 
        path: 'topicId', 
        model: Topic,
        select: 'title subjectId',
        populate: { path: 'subjectId', model: Subject, select: 'title' }
      })
      .lean();

    const recentSessions = last5Sessions.map((s: any) => {
      const compDate = s.completedAt ? new Date(s.completedAt) : new Date();
      return {
        _id: s._id.toString(),
        type: s.type,
        topic: s.topicId?.title || 'Unknown Topic',
        subject: s.topicId?.subjectId?.title || 'Unknown Subject',
        score: s.score,
        timeAgo: isNaN(compDate.getTime()) ? 'Recently' : getRelativeTime(compDate)
      };
    });


    // 3. Weak Topics (Topics with avg score < 70)
    // We'll calculate it from the last 50 sessions
    const recentSessionsForWeakItems = await Session.find({ userId })
      .sort({ completedAt: -1 })
      .limit(50)
      .populate({ 
        path: 'topicId', 
        model: Topic,
        select: 'title subjectId',
        populate: { path: 'subjectId', model: Subject, select: 'title' }
      })
      .lean();

    const topicScores: Record<string, { total: number, count: number, title: string, subject: string }> = {}
    
    recentSessionsForWeakItems.forEach((s: any) => {
      if (!s.topicId) return;
      const tId = s.topicId._id.toString();
      if (!topicScores[tId]) {
        topicScores[tId] = {
          total: 0, count: 0, 
          title: s.topicId.title, 
          subject: s.topicId.subjectId?.title || 'Unknown Subject'
        };
      }
      topicScores[tId].total += s.score;
      topicScores[tId].count += 1;
    })

    const weakTopics = Object.keys(topicScores)
      .map(tId => ({
        _id: tId,
        title: topicScores[tId].title,
        subject: topicScores[tId].subject,
        score: Math.round(topicScores[tId].total / topicScores[tId].count)
      }))
      .filter(t => t.score < 75)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3); // top 3 weakest

    // 4. Subject Mastery (Average score per subject)
    const subjects = await Subject.find({ userId }).select("title");
    const subjectMasteryMap: Record<string, { total: number; count: number }> = {};
    
    // Initialize map for all subjects
    subjects.forEach(s => {
      subjectMasteryMap[s.title] = { total: 0, count: 0 };
    });

    recentSessionsForWeakItems.forEach((s: any) => {
      if (!s.topicId?.subjectId?.title) return;
      const sTitle = s.topicId.subjectId.title;
      if (subjectMasteryMap[sTitle]) {
        subjectMasteryMap[sTitle].total += s.score;
        subjectMasteryMap[sTitle].count += 1;
      }
    });

    const subjectMastery = Object.keys(subjectMasteryMap).map(title => ({
      subject: title,
      score: subjectMasteryMap[title].count > 0 
        ? Math.round(subjectMasteryMap[title].total / subjectMasteryMap[title].count) 
        : 0
    }));

    // 5. Topic Progress (Completed vs Total)
    const totalTopics = await Topic.countDocuments({ userId });
    const completedTopicsCount = Object.keys(topicScores).filter(tId => topicScores[tId].count > 0).length;

    // 6. Today's Session Count
    const todayStr = new Date().toISOString().split("T")[0];
    const todaySessionCount = activityMap[todayStr] || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalSubjects,
        totalTopics,
        totalSessions,
        averageQuizScore,
        currentStreak,
        todaySessionCount,
        topicProgress: {
          total: totalTopics,
          completed: completedTopicsCount,
          percentage: totalTopics > 0 ? Math.round((completedTopicsCount / totalTopics) * 100) : 0
        },
        subjectMastery,
        activityHeatmap: activityMap,
        scoreTrend: scoreTrend.length > 0 ? scoreTrend : undefined,
        recentSessions: recentSessions.length > 0 ? recentSessions : undefined,
        weakTopics: weakTopics.length > 0 ? weakTopics : undefined,
      },
    });
  } catch (error: any) {
    console.error("Progress API Error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getProgressStats);
