import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import Session from "@/models/Session";
import ObjectUsage from "@/models/ApiUsage";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";

function getRelativeTime(date: Date) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diffInMs = date.getTime() - Date.now();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  
  if (Math.abs(diffInDays) < 1) {
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
    if (Math.abs(diffInHours) < 1) {
      const diffInMins = Math.round(diffInMs / (1000 * 60));
      return rtf.format(diffInMins, 'minute');
    }
    return rtf.format(diffInHours, 'hour');
  }
  return rtf.format(diffInDays, 'day');
}

async function getStats(req: AuthenticatedRequest) {
  try {
    await connectDB();
    const userId = req.user.id;

    const totalSubjects = await Subject.countDocuments({ userId });
    const totalTopics = await Topic.countDocuments({ userId });
    const totalSessions = await Session.countDocuments({ userId });

    const sessionsForBasicStats = await Session.find({ userId });
    let averageQuizScore = 0;
    let totalStudyTime = 0; // in seconds

    if (sessionsForBasicStats.length > 0) {
      const quizSessions = sessionsForBasicStats.filter(s => s.type === 'quiz');
      if (quizSessions.length > 0) {
        const totalScore = quizSessions.reduce((acc, curr) => acc + curr.score, 0);
        averageQuizScore = Math.round(totalScore / quizSessions.length);
      }
      totalStudyTime = sessionsForBasicStats.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    }

    const sessions = await Session.find({ userId }).sort({ completedAt: 1 }).select("completedAt score type");
    
    // Score Trend
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentQuizSessions = sessions.filter(
      (s: any) => s.type === 'quiz' && new Date(s.completedAt) > last7Days
    );
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const scoreTrendMap: Record<string, { total: number, count: number }> = {};
    recentQuizSessions.forEach((s: any) => {
      const day = days[new Date(s.completedAt).getDay()];
      if (!scoreTrendMap[day]) scoreTrendMap[day] = { total: 0, count: 0 };
      scoreTrendMap[day].total += s.score;
      scoreTrendMap[day].count += 1;
    });
    const scoreTrend = Object.keys(scoreTrendMap).map(day => ({
      date: day,
      score: Math.round(scoreTrendMap[day].total / scoreTrendMap[day].count)
    }));

    // Recent Sessions
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

    // Weak Topics & Subject Mastery
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

    const topicScores: Record<string, { total: number, count: number, title: string, subject: string }> = {};
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
    });

    const weakTopics = Object.keys(topicScores)
      .map(tId => ({
        _id: tId,
        title: topicScores[tId].title,
        subject: topicScores[tId].subject,
        score: Math.round(topicScores[tId].total / topicScores[tId].count)
      }))
      .filter(t => t.score < 75)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    const subjects = await Subject.find({ userId }).select("title");
    const subjectMasteryMap: Record<string, { total: number; count: number }> = {};
    subjects.forEach(s => { subjectMasteryMap[s.title] = { total: 0, count: 0 }; });
    recentSessionsForWeakItems.forEach((s: any) => {
      if (!s.topicId?.subjectId?.title) return;
      const sTitle = s.topicId.subjectId.title;
      if (subjectMasteryMap[sTitle]) {
        subjectMasteryMap[sTitle].total += s.score;
        subjectMasteryMap[sTitle].count += 1;
      }
    });
    const subjectMastery = await Promise.all(subjects.map(async (s) => {
      const title = s.title;
      const topicCount = await Topic.countDocuments({ subjectId: s._id });
      return {
        subject: title,
        topicCount,
        score: subjectMasteryMap[title].count > 0 
          ? Math.round(subjectMasteryMap[title].total / subjectMasteryMap[title].count) 
          : 0
      };
    }));

    const completedTopicsCount = Object.keys(topicScores).filter(tId => topicScores[tId].count > 0).length;

    // Today's Session Count
    const todayStr = new Date().toISOString().split("T")[0];
    const todaySessionsArray = sessions.filter(s => s.completedAt && new Date(s.completedAt).toISOString().split("T")[0] === todayStr);
    const todaySessionCount = todaySessionsArray.length;

    // Daily AI Usage
    let aiUsageCount = 0;
    const usageDoc = await ObjectUsage.findOne({ userId, date: todayStr });
    if (usageDoc) {
      aiUsageCount = usageDoc.count;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSubjects,
        totalTopics,
        totalSessions,
        totalStudyTime,
        averageQuizScore,
        todaySessionCount,
        aiUsage: { count: aiUsageCount, max: 200 },
        topicProgress: {
          total: totalTopics,
          completed: completedTopicsCount,
          percentage: totalTopics > 0 ? Math.round((completedTopicsCount / totalTopics) * 100) : 0
        },
        subjectMastery,
        scoreTrend: scoreTrend.length > 0 ? scoreTrend : undefined,
        recentSessions: recentSessions.length > 0 ? recentSessions : undefined,
        weakTopics: weakTopics.length > 0 ? weakTopics : undefined,
      },
    });
  } catch (error: any) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStats);
