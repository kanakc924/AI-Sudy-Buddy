import { useState, useEffect, useCallback } from "react";
import { getSubjects as apiGetSubjects, createSubject as apiCreateSubject, deleteSubject as apiDeleteSubject } from "../services/api";

export interface Subject {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetSubjects();
      if (data.success !== false) {
        setSubjects(data.data || data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const createSubject = async (data: { title: string; description?: string }) => {
    try {
      const resData = await apiCreateSubject({ title: data.title, description: data.description });
      if (resData.success !== false) {
        setSubjects([resData.data || resData, ...subjects]);
      }
      return resData;
    } catch (err: any) {
      throw new Error(err.response?.data?.error?.message || "Failed to create subject");
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      await apiDeleteSubject(id);
      setSubjects(subjects.filter((s) => s._id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.error?.message || "Failed to delete subject");
    }
  };

  return {
    subjects,
    loading,
    error,
    createSubject,
    deleteSubject,
    refresh: fetchSubjects,
  };
}
