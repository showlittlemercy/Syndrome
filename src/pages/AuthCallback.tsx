import React, { useEffect, useState } from 'react'
import { Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const { setUser, setProfile } = useAuthStore()
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Processing OAuth callback...')
        console.log('🔄 Callback: Processing OAuth redirect')
        console.log('Current URL:', window.location.href)
        
        // Check for errors in URL
        const urlParams = new URLSearchParams(window.location.search)
        const error = urlParams.get('error')
        const errorCode = urlParams.get('error_code')
        const errorDescription = urlParams.get('error_description')
        
        if (error) {
          const fullError = `${error} (${errorCode}): ${errorDescription}`
          console.error('❌ OAuth Error:', fullError)
          setStatus(`Error: ${errorDescription || error}`)
          setTimeout(() => {
            navigate('/auth/signin', { replace: true })
          }, 3000)
          return
        }
        
        // Supabase automatically processes the hash/code on page load
        // We just need to wait a moment for it to process
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Now get the session
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        console.log('Session:', data.session)
        console.log('Session error:', sessionError)
        
        const session = data.session

        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        if (session && session.user) {
          setStatus('Creating profile...')
          console.log('✅ Session found for user:', session.user.email)
          
          // Update auth store
          setUser(session.user as any)

          // Check if profile exists
          const { data: existingProfile, error: profileFetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          console.log('Existing profile:', existingProfile)
          console.log('Profile fetch error:', profileFetchError)

          if (!existingProfile && profileFetchError?.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log('📝 Creating new profile for OAuth user')
            const username = session.user.email?.split('@')[0] || 'user' + Date.now()
            
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                username,
                full_name: session.user.user_metadata?.full_name || username,
                avatar_url: session.user.user_metadata?.avatar_url,
              })
              .select()
              .single()

            if (insertError) {
              console.error('Profile insert error:', insertError)
              throw insertError
            }

            console.log('✅ Profile created:', newProfile)
            setProfile(newProfile as any)
          } else if (existingProfile) {
            console.log('✅ Using existing profile')
            setProfile(existingProfile as any)
          }

          setStatus('Redirecting to home...')
          console.log('🏠 Navigating to /home')
          
          // Small delay to ensure state is updated
          setTimeout(() => {
            navigate('/home', { replace: true })
          }, 100)
        } else {
          console.log('❌ No session found, redirecting to sign in')
          setStatus('No session found...')
          setTimeout(() => {
            navigate('/auth/signin', { replace: true })
          }, 1000)
        }
      } catch (error) {
        console.error('❌ Auth callback error:', error)
        setStatus('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
        setTimeout(() => {
          navigate('/auth/signin', { replace: true })
        }, 2000)
      }
    }

    handleCallback()
  }, [navigate, setUser, setProfile])

  return (
    <div className="min-h-screen bg-gradient-to-br from-syndrome-dark via-dark-900 to-dark-800 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader className="w-12 h-12 text-syndrome-primary animate-spin" />
        <p className="text-white text-lg">{status}</p>
        <p className="text-dark-400 text-sm">Check console (F12) for details</p>
      </div>
    </div>
  )
}

export default AuthCallbackPage
