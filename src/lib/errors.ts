/**
 * Error handling and logging utilities
 */

export class SyndromeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'SyndromeError'
  }
}

/**
 * Log error to console (development only)
 */
export const logError = (error: unknown, context?: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error(
      `[${context || 'Error'}]`,
      error instanceof Error ? error.message : error
    )
  }
}

/**
 * Handle Supabase errors
 */
export const handleSupabaseError = (error: any): string => {
  if (error.code === 'PGRST116') {
    return 'Resource not found'
  }

  if (error.code === '23505') {
    return 'This item already exists'
  }

  if (error.code === '42P01') {
    return 'Database table not found'
  }

  if (error.status === 401) {
    return 'Unauthorized. Please sign in.'
  }

  if (error.status === 403) {
    return 'You do not have permission to perform this action'
  }

  if (error.message?.includes('duplicate')) {
    return 'This item already exists'
  }

  return error.message || 'An error occurred'
}

/**
 * Handle auth errors
 */
export const handleAuthError = (error: any): string => {
  const message = error.message?.toLowerCase() || ''

  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password'
  }

  if (message.includes('user already registered')) {
    return 'This email is already registered'
  }

  if (message.includes('email not confirmed')) {
    return 'Please verify your email'
  }

  if (message.includes('weak password')) {
    return 'Password must be at least 6 characters'
  }

  return handleSupabaseError(error)
}

/**
 * Retry function for failed requests
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) throw error
    await new Promise(resolve => setTimeout(resolve, delay))
    return retryAsync(fn, retries - 1, delay * 2)
  }
}
