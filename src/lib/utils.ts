/**
 * Utility functions for the Syndrome platform
 */

import { formatDistanceToNow } from 'date-fns'

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export const formatTimeAgo = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/**
 * Format number with commas (e.g., 1000 -> 1,000)
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

/**
 * Truncate string to specified length with ellipsis
 */
export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + '...'
}

/**
 * Extract hashtags from text
 */
export const extractHashtags = (text: string): string[] => {
  const regex = /#(\w+)/g
  const matches = text.match(regex)
  return matches ? matches.map(tag => tag.slice(1)) : []
}

/**
 * Extract mentions from text
 */
export const extractMentions = (text: string): string[] => {
  const regex = /@(\w+)/g
  const matches = text.match(regex)
  return matches ? matches.map(mention => mention.slice(1)) : []
}

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate username format
 */
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
  return usernameRegex.test(username)
}

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format file size (bytes to human readable)
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Generate random color (for avatars)
 */
export const generateRandomColor = (): string => {
  const colors = [
    'from-syndrome-primary to-syndrome-secondary',
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
  ]

  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Sleep function (for delays)
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
