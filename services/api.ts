const apiFetch = async (path: string, options?: RequestInit) => {
  const token = localStorage.getItem('study_buddy_token')
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

// Auth
export const registerUser = (data: { name: string; email: string; password: string }) =>
  apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) })
export const loginUser = (data: { email: string; password: string }) =>
  apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) })
export const getMe = () => apiFetch('/auth/me')

// Subjects
export const getSubjects = () => apiFetch('/subjects')
export const createSubject = (data: { title: string; description?: string }) =>
  apiFetch('/subjects', { method: 'POST', body: JSON.stringify(data) })
export const updateSubject = (id: string, data: object) =>
  apiFetch(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteSubject = (id: string) =>
  apiFetch(`/subjects/${id}`, { method: 'DELETE' })

// Topics
export const getTopics = (subjectId: string) =>
  apiFetch(`/subjects/${subjectId}/topics`)
export const createTopic = (subjectId: string, data: { title: string }) =>
  apiFetch(`/subjects/${subjectId}/topics`, { method: 'POST', body: JSON.stringify(data) })
export const updateTopic = (id: string, data: object) =>
  apiFetch(`/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteTopic = (id: string) =>
  apiFetch(`/topics/${id}`, { method: 'DELETE' })

// Notes & Upload
export const updateNotes = (topicId: string, notes: string) =>
  apiFetch(`/topics/${topicId}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) })

export const uploadFile = async (topicId: string, file: File): Promise<{ extractedText: string }> => {
  const token = localStorage.getItem('study_buddy_token')
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`/api/topics/${topicId}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    // DO NOT set Content-Type — browser sets it automatically with boundary
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error || err?.message || 'Upload failed')
  }

  return res.json()
}

export const uploadImage = async (topicId: string, file: File): Promise<{ extractedText: string }> => {
  const token = localStorage.getItem('study_buddy_token')
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`/api/topics/${topicId}/upload-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error || err?.message || 'Upload failed')
  }

  return res.json()
}

// AI Generation
export const generateFlashcards = (topicId: string, replace: boolean = false) =>
  apiFetch(`/topics/${topicId}/generate/flashcards`, { method: 'POST', body: JSON.stringify({ replace }) })
export const generateQuiz = (topicId: string, replace: boolean = false) =>
  apiFetch(`/topics/${topicId}/generate/quiz`, { method: 'POST', body: JSON.stringify({ replace }) })
export const generateSummary = (topicId: string) =>
  apiFetch(`/topics/${topicId}/generate/summary`, { method: 'POST' })

export const generateFromImage = async (topicId: string, type: 'flashcard' | 'quiz', file: File) => {
  const form = new FormData()
  form.append('file', file)
  form.append('type', type)
  form.append('topicId', topicId)
  const token = localStorage.getItem('study_buddy_token')
  const res = await fetch(`/api/generate/from-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

// Flashcards & Quizzes
export const getFlashcards = (topicId: string) =>
  apiFetch(`/topics/${topicId}/flashcards`)
export const updateFlashcard = (id: string, data: object) =>
  apiFetch(`/flashcards/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteFlashcard = (id: string) =>
  apiFetch(`/flashcards/${id}`, { method: 'DELETE' })
export const getQuizzes = (topicId: string) =>
  apiFetch(`/topics/${topicId}/quizzes`)
export const updateQuiz = (id: string, data: object) =>
  apiFetch(`/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteQuiz = (id: string) =>
  apiFetch(`/quizzes/${id}`, { method: 'DELETE' })

// Sessions & Progress
export const logSession = (data: object) =>
  apiFetch('/sessions', { method: 'POST', body: JSON.stringify(data) })
export const getProgress = () => apiFetch('/progress')


// Explain Diagram
export const explainDiagram = async (
  topicId: string,
  file: File
): Promise<{ explanation: string; imageUrl: string }> => {
  const token = localStorage.getItem('study_buddy_token')
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`/api/topics/${topicId}/explain-diagram`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.error || 'Failed to explain diagram')
  }

  return res.json()
}