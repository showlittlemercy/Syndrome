import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session from URL
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        if (session) {
          // Check if profile exists, create if needed (for Google OAuth users)
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!existingProfile) {
            // Create profile for OAuth user
            const username = session.user.email?.split('@')[0] || 'user'
            await supabase.from('profiles').insert({
              id: session.user.id,
              username,
              full_name: session.user.user_metadata?.full_name || username,
              avatar_url: session.user.user_metadata?.avatar_url,
            })
          }

          // User authenticated successfully
          navigate('/home', { replace: true })
        } else {
          // No session, redirect to sign in
          navigate('/auth/signin', { replace: true })
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/auth/signin', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-syndrome-dark via-dark-900 to-dark-800 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="flex flex-col items-center gap-4"
      >
        <Loader className="w-12 h-12 text-syndrome-primary" />
        <p className="text-white text-lg">Completing authentication...</p>
      </motion.div>
    </div>
  )
}

export default AuthCallbackPage
