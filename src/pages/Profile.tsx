import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'

const ProfilePage: React.FC = () => {
  const { profile, user } = useAuthStore()
  const [postCount, setPostCount] = useState(0)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
  })

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      try {
        // Fetch post count
        const { count: posts } = await supabase
          .from('posts')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)

        // Fetch follower count
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('following_id', user.id)

        // Fetch following count
        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('follower_id', user.id)

        setPostCount(posts || 0)
        setFollowerCount(followers || 0)
        setFollowingCount(following || 0)
      } catch (error) {
        console.error('Error fetching profile stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update(editData)
        .eq('id', user.id)

      if (error) throw error

      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader className="w-8 h-8 text-syndrome-primary" />
          </motion.div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Header */}
          <div className="glass-effect p-8 rounded-2xl border border-dark-700 space-y-6">
            {/* Avatar and Info */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full object-cover border-2 border-syndrome-primary"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-syndrome-primary to-syndrome-secondary flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {profile?.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-black text-white">
                  {profile?.username}
                </h1>
                <p className="text-dark-400 mt-1">{profile?.full_name}</p>
                <p className="text-dark-500 mt-2">{profile?.bio}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-dark-600">
              {[
                { label: 'Posts', value: postCount },
                { label: 'Followers', value: followerCount },
                { label: 'Following', value: followingCount },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-3 rounded-lg bg-dark-800/50 hover:bg-dark-700 transition-colors"
                >
                  <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-xs text-dark-400 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Edit Profile Section */}
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect p-8 rounded-2xl border border-dark-700 space-y-4"
            >
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) =>
                    setEditData({ ...editData, full_name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-dark-800/50 border border-dark-600 focus:border-syndrome-primary focus:outline-none transition-colors text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData({ ...editData, bio: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-dark-800/50 border border-dark-600 focus:border-syndrome-primary focus:outline-none transition-colors text-white resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveProfile}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-syndrome-primary to-syndrome-secondary text-white font-semibold hover:shadow-glow-lg transition-all"
                >
                  Save
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-lg border border-dark-600 text-white font-semibold hover:bg-dark-700 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(true)}
              className="w-full py-3 rounded-lg border border-syndrome-primary text-syndrome-primary font-semibold hover:bg-syndrome-primary/10 transition-colors"
            >
              Edit Profile
            </motion.button>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}

export default ProfilePage
