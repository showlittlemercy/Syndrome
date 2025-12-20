import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { signUp } = useAuth()

  const handleGoogleSignUp = async () => {
    try {
      setIsOAuthLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
    } catch (err) {
      console.error('Google sign up error:', err)
      setError(err instanceof Error ? err.message : 'Google sign up failed')
      setIsOAuthLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!email || !password || !confirmPassword || !username) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    try {
      setIsLoading(true)
      await signUp(email, password, username)
      navigate('/auth/verify-email')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-syndrome-dark via-dark-900 to-dark-800 flex items-center justify-center px-4">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-syndrome-primary opacity-10 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-black gradient-text mb-2">Syndrome</h1>
          <p className="text-dark-400">Create your account to get started</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="glass-effect p-8 rounded-2xl border border-dark-700 space-y-6"
        >
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Username Input */}
            <motion.div
              whileFocus={{ scale: 1.02 }}
              className="relative"
            >
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-syndrome-primary pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@your_username"
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-dark-800/50 border border-dark-600 focus:border-syndrome-primary focus:outline-none transition-colors text-white placeholder-dark-500"
                />
              </div>
            </motion.div>

            {/* Email Input */}
            <motion.div
              whileFocus={{ scale: 1.02 }}
              className="relative"
            >
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-syndrome-primary pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-dark-800/50 border border-dark-600 focus:border-syndrome-primary focus:outline-none transition-colors text-white placeholder-dark-500"
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div
              whileFocus={{ scale: 1.02 }}
              className="relative"
            >
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-syndrome-primary pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-lg bg-dark-800/50 border border-dark-600 focus:border-syndrome-primary focus:outline-none transition-colors text-white placeholder-dark-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-dark-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Confirm Password Input */}
            <motion.div
              whileFocus={{ scale: 1.02 }}
              className="relative"
            >
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-syndrome-primary pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-lg bg-dark-800/50 border border-dark-600 focus:border-syndrome-primary focus:outline-none transition-colors text-white placeholder-dark-500"
                />
              </div>
            </motion.div>

            {/* Sign Up Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-syndrome-primary to-syndrome-secondary text-white font-bold hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-dark-800 text-dark-400">Or continue with</span>
            </div>
          </div>

          {/* Social Sign Up Buttons */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isOAuthLoading}
            className="w-full py-3 rounded-lg border border-dark-600 text-white font-semibold hover:bg-dark-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOAuthLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <img 
                  src="https://www.svgrepo.com/show/475656/google-color.svg" 
                  alt="Google" 
                  className="w-5 h-5"
                />
                Google
              </>
            )}
          </motion.button>

          {/* Sign In Link */}
          <p className="text-center text-dark-400">
            Already have an account?{' '}
            <a href="/auth/signin" className="text-syndrome-primary hover:text-syndrome-accent transition-colors font-semibold">
              Sign In
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default SignUpPage
