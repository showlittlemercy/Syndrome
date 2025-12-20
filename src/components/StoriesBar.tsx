import React, { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { supabase, uploadImage } from '../lib/supabase'
import { Story, Profile } from '../types'
import { useAuthStore } from '../lib/store'

interface StoryWithUser extends Story {
  user?: Profile
}

const StoriesBar: React.FC = () => {
  const { user } = useAuthStore()
  const [stories, setStories] = useState<StoryWithUser[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [activeStory, setActiveStory] = useState<StoryWithUser | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadStories = async () => {
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('stories')
        .select('*, user:profiles(id, username, avatar_url)')
        .gt('expires_at', now)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStories(data || [])
    } catch (err) {
      console.error('Error loading stories', err)
    }
  }

  useEffect(() => {
    loadStories()
  }, [])

  const handleUploadStory = async (file: File) => {
    if (!user) return
    setIsUploading(true)
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`
      const publicUrl = await uploadImage('stories', path, file)

      const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        media_url: publicUrl,
      })

      if (error) throw error
      await loadStories()
    } catch (err) {
      console.error('Error uploading story', err)
    } finally {
      setIsUploading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleUploadStory(file)
    e.target.value = ''
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-semibold text-white">Stories</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-syndrome-primary/20 text-syndrome-primary border border-syndrome-primary/40 hover:bg-syndrome-primary/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Story</span>
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={onFileChange}
          disabled={isUploading}
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 stories-scroll">
        {stories.length === 0 && (
          <div className="text-dark-400 text-sm">No active stories. Be the first!</div>
        )}
        {stories.map((story) => (
          <motion.button
            key={story.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveStory(story)}
            className="flex flex-col items-center gap-2"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-syndrome-primary via-syndrome-secondary to-syndrome-primary">
              <div className="w-16 h-16 rounded-full bg-dark-900 flex items-center justify-center overflow-hidden border-2 border-dark-900">
                {story.user?.avatar_url ? (
                  <img
                    src={story.user.avatar_url}
                    alt={story.user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-lg">
                    {story.user?.username?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-dark-300">
              {story.user?.username || 'Story'}
            </p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {activeStory && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-2xl w-full glass-effect border border-syndrome-primary/30 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setActiveStory(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-full aspect-[9/16] bg-black">
                <motion.img
                  key={activeStory.id}
                  src={activeStory.media_url}
                  alt="Story"
                  className="w-full h-full object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="p-4 flex items-center gap-3 bg-dark-900/60">
                {activeStory.user?.avatar_url ? (
                  <img
                    src={activeStory.user.avatar_url}
                    alt={activeStory.user.username}
                    className="w-10 h-10 rounded-full object-cover border border-syndrome-primary"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-syndrome-primary to-syndrome-secondary flex items-center justify-center text-white font-semibold">
                    {activeStory.user?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-semibold">{activeStory.user?.username}</p>
                  <p className="text-xs text-dark-400">
                    {new Date(activeStory.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StoriesBar
