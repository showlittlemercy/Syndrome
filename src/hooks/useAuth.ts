import { useEffect, useState } from 'react'
import { supabase, getCurrentUser, getUserProfile } from '../lib/supabase'
import { useAuthStore } from '../lib/store'
import { AuthUser, Profile } from '../types'

export const useAuth = () => {
  const { user, profile, setUser, setProfile, setIsLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          setUser(currentUser as AuthUser)
          const userProfile = await getUserProfile(currentUser.id)
          if (userProfile) {
            setProfile(userProfile as Profile)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize auth')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user as AuthUser)
          const userProfile = await getUserProfile(session.user.id)
          if (userProfile) {
            setProfile(userProfile as Profile)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [setUser, setProfile, setIsLoading])

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setError(null)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (signUpError) throw signUpError

      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          full_name: email.split('@')[0],
        })

        if (profileError) throw profileError
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      setError(message)
      throw err
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      setError(message)
      throw err
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign in failed'
      setError(message)
      throw err
    }
  }

  const signInWithGithub = async () => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'GitHub sign in failed'
      setError(message)
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed'
      setError(message)
      throw err
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed'
      setError(message)
      throw err
    }
  }

  return {
    user,
    profile,
    error,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    resetPassword,
  }
}
