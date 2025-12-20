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
          // User authenticated successfully
          navigate('/home')
        } else {
          // No session, redirect to sign in
          navigate('/auth/signin')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/auth/signin')
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
