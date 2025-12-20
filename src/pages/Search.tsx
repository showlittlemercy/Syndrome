import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader, MessageCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { Profile, Post } from '../types'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store'

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [explorePosts, setExplorePosts] = useState<Post[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (query.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(10)

      if (error) throw error
      setResults(data || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExplore = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, user:profiles(id, username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(24)

      if (error) throw error

      const shuffled = (data || []).sort(() => 0.5 - Math.random())
      setExplorePosts(shuffled)
    } catch (err) {
      console.error('Error loading explore posts', err)
    }
  }

  const loadFollowing = async () => {
    if (!user) return
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    if (data) {
      setFollowingIds(new Set(data.map((f) => f.following_id)))
    }
  }

  useEffect(() => {
    loadExplore()
    loadFollowing()
  }, [])

  const toggleFollow = async (targetId: string) => {
    if (!user || targetId === user.id) return
    const isFollowing = followingIds.has(targetId)
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetId)
        if (error) throw error
        const updated = new Set(followingIds)
        updated.delete(targetId)
        setFollowingIds(updated)
      } else {
        const { error } = await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: targetId }])
        if (error) throw error
        const updated = new Set(followingIds)
        updated.add(targetId)
        setFollowingIds(updated)
      }
    } catch (err) {
      console.error('Follow toggle error', err)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-black gradient-text">Search</h1>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users by username..."
              className="w-full px-6 py-3 rounded-lg bg-dark-800/50 border border-dark-600 focus:border-syndrome-primary focus:outline-none transition-colors text-white placeholder-dark-500"
            />
          </div>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader className="w-8 h-8 text-syndrome-primary" />
            </motion.div>
          </div>
        ) : results.length === 0 && searchQuery ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-dark-400">No users found matching your search.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {results.map((profile) => (
              <motion.div
                key={profile.id}
                whileHover={{ scale: 1.02 }}
                className="glass-effect p-4 rounded-xl border border-dark-700 hover:border-syndrome-primary transition-colors flex items-center justify-between"
              >
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => navigate('/profile')}
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-12 h-12 rounded-full object-cover border border-syndrome-primary"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-syndrome-primary to-syndrome-secondary flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {profile.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-white">{profile.username}</p>
                    <p className="text-xs text-dark-400">{profile.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleFollow(profile.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                      followingIds.has(profile.id)
                        ? 'border-dark-600 text-dark-200 bg-dark-800/70'
                        : 'border-syndrome-primary text-white bg-syndrome-primary/20'
                    }`}
                  >
                    {followingIds.has(profile.id) ? 'Following' : 'Follow'}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full bg-syndrome-primary/20 hover:bg-syndrome-primary/30 transition-colors text-syndrome-primary"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {searchQuery === '' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Explore</h2>
              <p className="text-xs text-dark-400">Random posts curated for you</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {explorePosts.map((post) => (
                <motion.div
                  key={post.id}
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden rounded-xl bg-dark-800 border border-dark-700"
                >
                  <img
                    src={post.image_url}
                    alt={post.caption || 'Post'}
                    className="w-full h-full object-cover aspect-square"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-sm text-white">
                    {post.caption?.slice(0, 60) || 'View post'}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}

export default SearchPage
