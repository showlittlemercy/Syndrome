import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader, MessageCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { Profile } from '../types'
import { useNavigate } from 'react-router-dom'

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

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
                  onClick={() => navigate(`/profile/${profile.id}`)}
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

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-full bg-syndrome-primary/20 hover:bg-syndrome-primary/30 transition-colors text-syndrome-primary"
                >
                  <MessageCircle className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {searchQuery === '' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-dark-400">Start typing to search for users</p>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}

export default SearchPage
