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

  // Attempt to parse JSON regardless of status to catch structured errors
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json?.error || 'Request failed') as any
    err.status = res.status
    err.code = json?.code || 'UNKNOWN_ERROR'
    err.error = json?.error
    throw err
  }

  // Capture rate limit headers for real-time usage sync
  const limit = res.headers.get('X-RateLimit-Limit');
  const remaining = res.headers.get('X-RateLimit-Remaining');
  if (limit && remaining && json && typeof json === 'object') {
    json._usage = {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10)
    };
  }

  return json
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

export const deleteSourceMaterial = (topicId: string, materialId: string) =>
  apiFetch(`/topics/${topicId}/materials?materialId=${materialId}`, { method: 'DELETE' })

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

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(json?.error || 'Upload failed') as any
    err.status = res.status
    err.code = json?.code || 'UPLOAD_ERROR'
    err.error = json?.error
    throw err
  }

  return json
}

export const uploadDocument = async (topicId: string, file: File): Promise<{ extractedText: string, data?: any }> => {
  const token = localStorage.getItem('study_buddy_token')
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`/api/topics/${topicId}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(json?.error || 'Upload failed') as any
    err.status = res.status
    err.code = json?.code || 'UPLOAD_ERROR'
    err.error = json?.error
    throw err
  }

  return json
}

export const uploadImage = async (topicId: string, file: File): Promise<{ extractedText: string, data?: any }> => {
  const token = localStorage.getItem('study_buddy_token')
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`/api/topics/${topicId}/upload-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(json?.error || 'Upload failed') as any
    err.status = res.status
    err.code = json?.code || 'UPLOAD_ERROR'
    err.error = json?.error
    throw err
  }

  return json
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
  
  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(json?.error || 'Generation failed') as any
    err.status = res.status
    err.code = json?.code || 'GENERATION_ERROR'
    err.error = json?.error
    throw err
  }
  return json
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
export const getStats = () => apiFetch('/sessions/stats')
export const getStreak = () => apiFetch('/sessions/streak')
export const getHeatmap = (topicId?: string) => 
  apiFetch(topicId ? `/sessions/heatmap?topicId=${topicId}` : '/sessions/heatmap')


// Explain Diagram
export const explainDiagram = async (
  topicId: string,
  file: File
): Promise<{ extractedText: string; imageUrl: string }> => {
  const token = localStorage.getItem('study_buddy_token')
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`/api/topics/${topicId}/explain-diagram`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(json?.error || 'Failed to explain diagram') as any
    err.status = res.status
    err.code = json?.code || 'DIAGRAM_ERROR'
    err.error = json?.error
    throw err
  }

  return json
}