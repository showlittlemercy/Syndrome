import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader, MessageCircle } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'
import { Post, Profile } from '../types'

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { profile: currentUserProfile, user } = useAuthStore()
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null)
  const [postCount, setPostCount] = useState(0)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts')
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [isTabLoading, setIsTabLoading] = useState(false)
  const [listModal, setListModal] = useState<'followers' | 'following' | null>(null)
  const [listItems, setListItems] = useState<Profile[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [editData, setEditData] = useState({
    full_name: '',
    bio: '',
  })

  const isOwnProfile = !userId || userId === user?.id
  const profile = isOwnProfile ? currentUserProfile : viewedProfile
  const profileUserId = userId || user?.id

  // Update editData whenever currentUserProfile changes
  useEffect(() => {
    if (currentUserProfile && isOwnProfile) {
      setEditData({
        full_name: currentUserProfile.full_name || '',
        bio: currentUserProfile.bio || '',
      })
    }
  }, [currentUserProfile, isOwnProfile])

  const loadUserPosts = async () => {
    if (!profileUserId) return
    setIsTabLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, user:profiles(id, username, avatar_url)')
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserPosts(data || [])
    } catch (err) {
      console.error('Error loading user posts', err)
    } finally {
      setIsTabLoading(false)
    }
  }

  const loadSavedPosts = async () => {
    if (!user) return
    setIsTabLoading(true)
    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select('post:posts(*, user:profiles(id, username, avatar_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const posts = (data || [])
        .map((row: any) => ({ ...row.post, isSaved: true }))
        .filter(Boolean)

      setSavedPosts(posts)
    } catch (err) {
      console.error('Error loading saved posts', err)
    } finally {
      setIsTabLoading(false)
    }
  }

  const openList = async (type: 'followers' | 'following') => {
    if (!profileUserId) return
    setListModal(type)
    try {
      if (type === 'followers') {
        const { data } = await supabase
          .from('follows')
          .select('follower:profiles(id, username, avatar_url, full_name)')
          .eq('following_id', profileUserId)
        setListItems((data || []).map((row: any) => row.follower).filter(Boolean))
      } else {
        const { data } = await supabase
          .from('follows')
          .select('following:profiles(id, username, avatar_url, full_name)')
          .eq('follower_id', profileUserId)
        setListItems((data || []).map((row: any) => row.following).filter(Boolean))
      }
    } catch (err) {
      console.error('Error loading list', err)
    }
  }

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileUserId) return
      setIsLoading(true)

      try {
        // If viewing someone else's profile, fetch their data
        if (!isOwnProfile) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (profileError) throw profileError
          setViewedProfile(profileData as Profile)

          // Check if current user follows this profile
          if (user) {
            const { data: followData } = await supabase
              .from('follows')
              .select('id')
              .eq('follower_id', user.id)
              .eq('following_id', userId)
              .maybeSingle()
            
            setIsFollowing(!!followData)
          }
        }

        // Fetch post count
        const { count: posts } = await supabase
          .from('posts')
          .select('*', { count: 'exact' })
          .eq('user_id', profileUserId)

        // Fetch follower count
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('following_id', profileUserId)

        // Fetch following count
        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('follower_id', profileUserId)

        setPostCount(posts || 0)
        setFollowerCount(followers || 0)
        setFollowingCount(following || 0)
      } catch (error) {
        console.error('Error fetching profile data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
    loadUserPosts()
    if (isOwnProfile) {
      loadSavedPosts()
    }
  }, [userId, user, isOwnProfile])

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

  const toggleFollow = async () => {
    if (!user || !userId) return

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId)

        if (error) throw error
        setIsFollowing(false)
        setFollowerCount(prev => Math.max(0, prev - 1))
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: userId }])

        if (error) throw error
        setIsFollowing(true)
        setFollowerCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  const handleMessage = () => {
    if (!userId) return
    // Navigate to messages with the userId as query param
    navigate(`/messages?userId=${userId}`)
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
                { label: 'Posts', value: postCount, onClick: () => setActiveTab('posts') },
                { label: 'Followers', value: followerCount, onClick: () => openList('followers') },
                { label: 'Following', value: followingCount, onClick: () => openList('following') },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  onClick={stat.onClick}
                  className="text-center p-3 rounded-lg bg-dark-800/50 hover:bg-dark-700 transition-colors cursor-pointer"
                >
                  <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-xs text-dark-400 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {isOwnProfile ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(true)}
              className="w-full py-3 rounded-lg border border-syndrome-primary text-syndrome-primary font-semibold hover:bg-syndrome-primary/10 transition-colors"
            >
              Edit Profile
            </motion.button>
          ) : (
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleFollow}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  isFollowing
                    ? 'border border-dark-600 text-white hover:bg-dark-700'
                    : 'bg-gradient-to-r from-syndrome-primary to-syndrome-secondary text-white hover:shadow-glow-lg'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMessage}
                className="px-6 py-3 rounded-lg border border-syndrome-primary text-syndrome-primary font-semibold hover:bg-syndrome-primary/10 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </motion.button>
            </div>
          )}

          {/* Tabs */}
          <div className="glass-effect p-4 rounded-2xl border border-dark-700 space-y-4">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-dark-800/60 border border-dark-700">
              {(isOwnProfile ? ['posts', 'saved'] : ['posts']).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab as 'posts' | 'saved')
                    if (tab === 'posts') loadUserPosts()
                    else loadSavedPosts()
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-syndrome-primary text-white shadow-glow'
                      : 'text-dark-300 hover:text-white'
                  }`}
                >
                  {tab === 'posts' ? 'Posts' : 'Saved'}
                </button>
              ))}
            </div>

            {isTabLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Loader className="w-6 h-6 text-syndrome-primary" />
                </motion.div>
              </div>
            ) : activeTab === 'posts' ? (
              userPosts.length === 0 ? (
                <p className="text-center text-dark-400 py-8">No posts yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {userPosts.map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-xl border border-dark-700 bg-dark-900">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.caption || 'Post'} className="w-full h-full object-cover aspect-square" />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center p-4 bg-gradient-to-br from-dark-800 to-dark-900">
                          <p className="text-sm text-white line-clamp-4 text-center">{p.caption || 'Text post'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : savedPosts.length === 0 ? (
              <p className="text-center text-dark-400 py-8">No saved posts yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {savedPosts.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-xl border border-dark-700 bg-dark-900">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.caption || 'Saved post'} className="w-full h-full object-cover aspect-square" />
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center p-4 bg-gradient-to-br from-dark-800 to-dark-900">
                        <p className="text-sm text-white line-clamp-4 text-center">{p.caption || 'Text post'}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-lg glass-effect border border-dark-700 rounded-2xl p-6 space-y-4"
            >
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-dark-800/50 border border-dark-600 focus:border-syndrome-primary focus:outline-none transition-colors text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-dark-800/50 border border-dark-600 focus:border-syndrome-primary focus:outline-none transition-colors text-white resize-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
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
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {listModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md glass-effect border border-dark-700 rounded-2xl p-4 space-y-3 max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white capitalize">{listModal}</h3>
                <button
                  onClick={() => setListModal(null)}
                  className="text-dark-300 hover:text-white"
                >
                  Close
                </button>
              </div>

              {listItems.length === 0 ? (
                <p className="text-dark-400 text-sm">No users yet.</p>
              ) : (
                <div className="space-y-2">
                  {listItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800/50">
                      {item.avatar_url ? (
                        <img src={item.avatar_url} alt={item.username} className="w-10 h-10 rounded-full object-cover border border-dark-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-syndrome-primary to-syndrome-secondary flex items-center justify-center text-white font-semibold">
                          {item.username[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-semibold">{item.username}</p>
                        <p className="text-xs text-dark-400">{item.full_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

export default ProfilePage
