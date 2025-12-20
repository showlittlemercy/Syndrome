import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { supabase, uploadImage } from '../lib/supabase'
import { useAuthStore } from '../lib/store'
import { useNavigate } from 'react-router-dom'

const CreatePage: React.FC = () => {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [caption, setCaption] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuthStore()
  const navigate = useNavigate()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setImage(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError('You must be logged in to create a post')
      return
    }

    if (!image) {
      setError('Please select an image')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Upload image
      const timestamp = new Date().getTime()
      const filename = `${user.id}/${timestamp}-${image.name}`
      const imageUrl = await uploadImage('posts', filename, image)

      // Create post
      const { error: postError } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          image_url: imageUrl,
          caption: caption || null,
        },
      ])

      if (postError) throw postError

      // Reset form and navigate
      setImage(null)
      setPreview('')
      setCaption('')
      navigate('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-black gradient-text">Create Post</h1>
            <p className="text-dark-400 mt-2">Share a moment with your friends</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Image Upload Area */}
            <div className="glass-effect p-8 rounded-2xl border-2 border-dashed border-dark-600 hover:border-syndrome-primary transition-colors">
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto rounded-lg max-h-96 object-cover"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setImage(null)
                      setPreview('')
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-dark-900/80 hover:bg-dark-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-red-400" />
                  </motion.button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer py-8">
                  <Upload className="w-12 h-12 text-syndrome-primary mb-4" />
                  <span className="text-lg font-semibold text-white mb-1">
                    Click to upload image
                  </span>
                  <span className="text-sm text-dark-400">
                    PNG, JPG, GIF up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Caption (Optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption for your post..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-dark-800/50 border border-dark-600 focus:border-syndrome-primary focus:outline-none transition-colors text-white placeholder-dark-500 resize-none"
              />
              <p className="text-xs text-dark-400 mt-2">
                {caption.length}/500 characters
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !image}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-syndrome-primary to-syndrome-secondary text-white font-bold hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Posting...' : 'Post'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </Layout>
  )
}

export default CreatePage
