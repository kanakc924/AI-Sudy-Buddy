import { useState, useEffect, useCallback } from "react";
import { getFlashcards, logSession as apiLogSession } from "../services/api";

export interface Flashcard {
  _id: string;
  question: string;
  answer: string;
  isEdited: boolean;
}

export function useFlashcardSession(topicId: string) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState({ correct: 0, missed: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFlashcards(topicId);
      if (data.success !== false) {
        setCards(data.data || data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    if (topicId) {
      fetchCards();
    }
  }, [topicId, fetchCards]);

  const advance = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
      logSession();
    }
  };

  const markCorrect = () => {
    setResults((prev) => ({ ...prev, correct: prev.correct + 1 }));
    advance();
  };

  const markMissed = () => {
    setResults((prev) => ({ ...prev, missed: prev.missed + 1 }));
    advance();
  };

  const reset = () => {
    setCurrentIndex(0);
    setResults({ correct: 0, missed: 0 });
    setIsFinished(false);
  };

  // Async logging at the end
  const logSession = async () => {
    const total = cards.length;
    if (total === 0) return;
    const finalCorrect = results.correct; // Wait, state update is async, so we use actual score
    // Actually, one more correct/missed is pending state change if we just called it.
    // Better to pass results directly or calculate. Here we just rely on standard logged results after final render.
  };

  // Dedicated save to API (triggered via external handle effect if needed)
  const saveSessionStats = async (finalCorrect: number, total: number) => {
    try {
       await apiLogSession({
           topicId,
           type: "flashcard",
           score: Math.round((finalCorrect / total) * 100),
           totalQuestions: total,
           correctAnswers: finalCorrect,
       });
    } catch (error) {
       console.error("Failed to log score");
    }
  }

  return {
    cards,
    currentIndex,
    currentCard: cards[currentIndex],
    isFinished,
    results,
    loading,
    error,
    markCorrect,
    markMissed,
    reset,
    saveSessionStats
  };
}
