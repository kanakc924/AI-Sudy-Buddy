import { NextResponse } from 'next/server'

interface ApiError {
  message?: string
  statusCode?: number
  status?: number
  reason?: string
  code?: string
}

export function classifyError(error: ApiError): {
  status: number
  message: string
  code: string
} {
  const isRateLimit =
    error?.statusCode === 429 ||
    error?.status === 429 ||
    error?.message?.includes('429') ||
    error?.message?.includes('rate') ||
    error?.message?.includes('rate-limited') ||
    error?.message?.includes('All AI models are currently busy') ||
    error?.reason === 'maxRetriesExceeded'

  const isNoContent =
    error?.message?.includes('no notes') ||
    error?.message?.includes('No notes') ||
    error?.code === 'NO_CONTENT'

  const isCastError = error?.code === 'CastError' || error?.message?.includes('Cast to ObjectId failed');

  const isNotFound =
    error?.statusCode === 404 ||
    error?.status === 404 ||
    error?.message?.includes('not found') ||
    error?.message?.includes('Not found');

  const isUnauthorized =
    error?.statusCode === 401 ||
    error?.status === 401 ||
    error?.message?.includes('Unauthorized') ||
    error?.message?.includes('Invalid token')

  if (isRateLimit) {
    return {
      status: 429,
      message:
        'Our AI is currently busy handling many requests. Please wait 1–2 minutes and try again.',
      code: 'AI_RATE_LIMITED',
    }
  }

  if (isNoContent) {
    return {
      status: 400,
      message:
        'This topic has no notes yet. Add some notes or upload a file before generating.',
      code: 'NO_CONTENT',
    }
  }

  if (isCastError) {
    return {
      status: 400,
      message: 'The provided ID is invalid. Please ensure you are accessing a valid resource.',
      code: 'INVALID_ID',
    }
  }

  if (isNotFound) {
    return {
      status: 404,
      message: error.message || 'The requested resource was not found.',
      code: 'NOT_FOUND',
    }
  }

  if (isUnauthorized) {
    return {
      status: 401,
      message: 'You are not authorized. Please log in again.',
      code: 'UNAUTHORIZED',
    }
  }

  return {
    status: 500,
    message: error.message || 'Something went wrong on our end. Please try again.',
    code: 'SERVER_ERROR',
  }
}

export function errorResponse(error: any) {
  const { status, message, code } = classifyError(error)
  console.error(`[${code}]`, error?.message || error)
  return NextResponse.json({ success: false, error: message, code }, { status })
}
