import { useState, useEffect, useCallback } from "react";
import { getTopics as apiGetTopics, createTopic as apiCreateTopic, deleteTopic as apiDeleteTopic } from "../services/api";

export interface Topic {
  _id: string;
  subjectId: string;
  title: string;
  notes: string;
  summary?: string;
  sourceImages: any[];
  createdAt: string;
  updatedAt: string;
}

export function useTopics(subjectId?: string) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetTopics(subjectId);
      if (data.success !== false) {
        setTopics(data.data || data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load topics");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const createTopic = async (data: { title: string; notes?: string }) => {
    if (!subjectId) return;
    try {
      const resData = await apiCreateTopic(subjectId, { name: data.title, notes: data.notes } as any);
      if (resData.success !== false) {
        setTopics([resData.data || resData, ...topics]);
      }
      return resData;
    } catch (err: any) {
      throw new Error(err.response?.data?.error?.message || "Failed to create topic");
    }
  };

  const deleteTopic = async (id: string) => {
    try {
      await apiDeleteTopic(id);
      setTopics(topics.filter((t) => t._id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.error?.message || "Failed to delete topic");
    }
  };

  // Specific single topic fetcher included for convenience on individual topic pages
  const getTopic = async (id: string) => {
    // If we only have an ID and need a quick update
    try {
      // Actually there's no single GET topic endpoint right now in the API. Wait, PRD doesn't have GET /api/topics/:id. 
      // We will rely on passing down state or finding it in `topics` array. 
      return topics.find((t) => t._id === id);
    } catch (error) {
       return null;
    }
  };

  return {
    topics,
    loading,
    error,
    createTopic,
    deleteTopic,
    getTopic,
    refresh: fetchTopics,
  };
}
