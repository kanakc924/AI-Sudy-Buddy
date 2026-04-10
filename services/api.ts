/**
 * API Service for Study Buddy
 * This file handles all client-side communication with the Next.js API routes.
 */

// Helper to handle fetch requests consistently
async function apiFetch(url: string, options: RequestInit = {}) {
  const defaultHeaders: Record<string, string> = {};
  
  // If we're sending JSON, add content-type header
  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong');
    (error as any).status = response.status;
    (error as any).code = data.code;
    throw error;
  }

  // Some responses include usage metadata from AI providers
  if (data._usage) {
    // This allows components to track AI usage easily
  }

  return data;
}

// AUTH
export const getMe = () => apiFetch('/api/auth/me');
export const loginUser = (credentials: any) => 
  apiFetch('/api/auth/login', { 
    method: 'POST', 
    body: JSON.stringify(credentials) 
  });
export const registerUser = (credentials: any) => 
  apiFetch('/api/auth/register', { 
    method: 'POST', 
    body: JSON.stringify(credentials) 
  });

// SUBJECTS
export const getSubjects = () => apiFetch('/api/subjects');
export const createSubject = (data: any) => 
  apiFetch('/api/subjects', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
export const updateSubject = (id: string, data: any) => 
  apiFetch(`/api/subjects/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  });
export const deleteSubject = (id: string) => 
  apiFetch(`/api/subjects/${id}`, { method: 'DELETE' });

// TOPICS
export const getTopics = (subjectId: string) => apiFetch(`/api/subjects/${subjectId}/topics`);
export const createTopic = (subjectId: string, data: { title: string }) => 
  apiFetch(`/api/subjects/${subjectId}/topics`, { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
export const updateTopic = (id: string, data: any) => 
  apiFetch(`/api/topics/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  });
export const deleteTopic = (id: string) => 
  apiFetch(`/api/topics/${id}`, { method: 'DELETE' });
export const updateNotes = (id: string, notes: string) => 
  apiFetch(`/api/topics/${id}/notes`, { 
    method: 'PUT', 
    body: JSON.stringify({ notes }) 
  });
export const deleteSourceMaterial = (topicId: string, materialId: string) => 
  apiFetch(`/api/topics/${topicId}/materials?materialId=${materialId}`, { 
    method: 'DELETE' 
  });

// CONTENT (Flashcards / Quizzes)
export const getFlashcards = (topicId: string) => apiFetch(`/api/topics/${topicId}/flashcards`);
export const getQuizzes = (topicId: string) => apiFetch(`/api/topics/${topicId}/quizzes`);
export const updateFlashcard = (id: string, data: any) => 
  apiFetch(`/api/flashcards/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  });
export const deleteFlashcard = (id: string) => 
  apiFetch(`/api/flashcards/${id}`, { method: 'DELETE' });
export const updateQuiz = (id: string, data: any) => 
  apiFetch(`/api/quizzes/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  });
export const deleteQuiz = (id: string) => 
  apiFetch(`/api/quizzes/${id}`, { method: 'DELETE' });

// AI GENERATION
export const generateFlashcards = (topicId: string, replace: boolean = false) => 
  apiFetch(`/api/topics/${topicId}/generate/flashcards?replace=${replace}`, { method: 'POST' });
export const generateQuiz = (topicId: string, count: number, replace: boolean = false) => 
  apiFetch(`/api/topics/${topicId}/generate/quiz?count=${count}&replace=${replace}`, { method: 'POST' });
export const generateSummary = (topicId: string) => 
  apiFetch(`/api/topics/${topicId}/generate/summary`, { method: 'POST' });
export const generateFromImage = (topicId: string, type: 'flashcard' | 'quiz', file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return apiFetch(`/api/topics/${topicId}/upload-image`, { 
    method: 'POST', 
    body: formData 
  });
};
export const explainDiagram = (topicId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch(`/api/topics/${topicId}/explain-diagram`, { 
    method: 'POST', 
    body: formData 
  });
};

// PROGRESS & STATS
export const logSession = (data: any) => 
  apiFetch('/api/sessions', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
export const getStats = () => apiFetch('/api/sessions/stats');
export const getStreak = () => apiFetch('/api/sessions/streak');
export const getHeatmap = () => apiFetch('/api/sessions/heatmap');

// UPLOADS
export const uploadImage = (topicId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch(`/api/topics/${topicId}/upload-image`, { 
    method: 'POST', 
    body: formData 
  });
};
export const uploadDocument = (topicId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch(`/api/topics/${topicId}/upload`, { 
    method: 'POST', 
    body: formData 
  });
};
