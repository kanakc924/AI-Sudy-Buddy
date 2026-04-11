/**
 * Global constants for the AI Study Buddy application.
 */

// Subject colors cycling array
export const SUBJECT_COLORS = [
  '#4CAF50',
  '#F7DF1E',
  '#E91E63',
  '#00BCD4',
  '#FF5722',
  '#7C5CFC',
  '#9C27B0',
  '#D4A853',
]

// AI model lists
export const AI_MODELS = [
  'google/gemma-3-27b-it:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openrouter/free',
]

export const VISION_MODELS = [
  'google/gemma-3-27b-it:free',
  'google/gemma-4-31b-it:free',
  'openrouter/free',
]

export const SUMMARY_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'openrouter/free',
]

// Session types
export const SESSION_TYPES = {
  FLASHCARD: 'flashcard',
  QUIZ: 'quiz',
  SUMMARY: 'summary',
} as const

// File size limit
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

// Rate limits
export const AI_RATE_LIMIT_PER_MINUTE = 15
export const AI_RATE_LIMIT_PER_DAY = 200
