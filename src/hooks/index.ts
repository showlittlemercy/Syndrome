/**
 * Custom hooks for Syndrome platform
 */

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Profile } from '../types'

/**
 * Hook to fetch a user's profile
 */
export const useProfile = (userId?: string) => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (fetchError) throw fetchError
        setProfile(data as Profile)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  return { profile, isLoading, error }
}

/**
 * Hook to track user online status
 */
export const usePresence = (userId: string) => {
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    // Subscribe to presence changes
    const subscription = supabase
      .from(`presence:user_id=eq.${userId}`)
      .on('*', (payload) => {
        const status = (payload.new as any)?.status || 'offline'
        setIsOnline(status === 'online')
        setLastSeen((payload.new as any)?.last_seen_at)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  return { isOnline, lastSeen }
}

/**
 * Hook to handle infinite scroll
 */
export const useInfiniteScroll = (
  callback: () => void,
  options = { threshold: 0.1 }
) => {
  const [observerTarget, setObserverTarget] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!observerTarget) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback()
        }
      },
      options
    )

    observer.observe(observerTarget)

    return () => {
      observer.disconnect()
    }
  }, [observerTarget, callback, options])

  return setObserverTarget
}

/**
 * Hook for media query matching
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    media.addListener(listener)

    return () => media.removeListener(listener)
  }, [matches, query])

  return matches
}

/**
 * Hook to detect if mobile device
 */
export const useIsMobile = (): boolean => {
  return useMediaQuery('(max-width: 768px)')
}

/**
 * Hook to detect if tablet device
 */
export const useIsTablet = (): boolean => {
  return useMediaQuery('(max-width: 1024px)')
}
