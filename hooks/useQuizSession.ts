import { useState, useEffect, useCallback } from "react";
import { getQuizzes, logSession as apiLogSession } from "../services/api";

export interface QuizQuestion {
  _id: string; // the subdocument ID if returned
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  _id: string;
  topicId: string;
  questions: QuizQuestion[];
}

export function useQuizSession(topicId: string) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [results, setResults] = useState({ correct: 0, total: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuizzes(topicId);
      if (data.success !== false && (data.data || data).length > 0) {
        // Just take the most recently generated quiz for this topic
        const mainQuiz = (data.data || data)[0];
        setQuiz(mainQuiz);
        setQuestions(mainQuiz.questions);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    if (topicId) fetchQuiz();
  }, [topicId, fetchQuiz]);

  const answerQuestion = (index: number) => {
    const currentQ = questions[currentIndex];
    
    // Create new array of selected answers
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentIndex] = index;
    setSelectedAnswers(newSelectedAnswers);
  };

  const advance = () => {
      // Proceed to next question OR finish
      if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
      } else {
          finishQuiz();
      }
  };

  const finishQuiz = () => {
    let numCorrect = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctIndex) {
        numCorrect++;
      }
    });

    setResults({ correct: numCorrect, total: questions.length });
    setIsFinished(true);
  };

  const saveSessionStats = async () => {
      if (!isFinished || questions.length === 0) return;
      try {
         await apiLogSession({
             topicId,
             type: "quiz",
             score: Math.round((results.correct / results.total) * 100),
             totalQuestions: results.total,
             correctAnswers: results.correct,
         });
      } catch (error) {
         console.error("Failed to log quiz score");
      }
  };

  return {
    quiz,
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex],
    isFinished,
    results,
    loading,
    error,
    selectedAnswers,
    answerQuestion,
    advance,
    saveSessionStats
  };
}
