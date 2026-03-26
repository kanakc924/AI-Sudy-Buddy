export interface HeatmapDay {
  date: string;
  intensity: number;
}

export interface StudySession {
  id: string;
  type: "flashcard" | "quiz" | string;
  topicTitle: string;
  subjectTitle: string;
  score: number;
  completedAt: string;
}

export interface Subject {
  id: string;
  title: string;
  description: string;
  color: string;
  topicCount: number;
  lastStudied: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface ScoreDataPoint {
  date: string;
  score: number;
  topic: string;
}
