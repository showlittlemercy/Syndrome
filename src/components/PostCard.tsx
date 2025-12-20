import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Loader, Bookmark, MoreVertical, Trash } from 'lucide-react'
import { supabase, deleteImage } from '../lib/supabase'
import { Post } from '../types'
import { useAuthStore } from '../lib/store'

interface PostCardProps {
  post: Post
  onLikeChange?: () => void
  onCommentClick?: () => void
  onPostDeleted?: () => void
}

const PostCard: React.FC<PostCardProps> = ({ post, onLikeChange, onCommentClick, onPostDeleted }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [isSaved, setIsSaved] = useState(post.isSaved || false)
  const [likeCount, setLikeCount] = useState(post.likes_count)
  const [isLoading, setIsLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useAuthStore()

  const handleLike = async () => {
    if (!user || isLoading) return

    setIsLoading(true)
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)

        if (error) throw error

        setIsLiked(false)
        setLikeCount(Math.max(0, likeCount - 1))
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: post.id, user_id: user.id }])

        if (error) throw error

        setIsLiked(true)
        setLikeCount(likeCount + 1)
      }

      onLikeChange?.()
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user || isLoading) return
    setIsLoading(true)
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)

        if (error) throw error
        setIsSaved(false)
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert([{ post_id: post.id, user_id: user.id }])

        if (error) throw error
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error toggling save:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const parseStoragePath = (url?: string | null) => {
    const marker = '/storage/v1/object/public/'
    if (!url) return null
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    const remainder = url.substring(idx + marker.length)
    const [bucket, ...rest] = remainder.split('/')
    return { bucket, path: rest.join('/') }
  }

  const handleDelete = async () => {
    if (!user || user.id !== post.user_id) return
    setIsLoading(true)
    try {
      const storagePath = parseStoragePath(post.image_url)
      const { error } = await supabase.from('posts').delete().eq('id', post.id)
      if (error) throw error

      if (storagePath) {
        await deleteImage(storagePath.bucket, storagePath.path)
      }

      onPostDeleted?.()
    } catch (error) {
      console.error('Error deleting post:', error)
    } finally {
      setIsLoading(false)
      setMenuOpen(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-effect rounded-2xl overflow-hidden border border-dark-700 hover:border-syndrome-primary transition-colors"
    >
      {/* Media or Text Banner */}
      {post.image_url ? (
        <div className="relative w-full aspect-square overflow-hidden bg-dark-800">
          <motion.img
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            src={post.image_url}
            alt="Post"
            className="w-full h-full object-cover cursor-pointer"
          />

          {/* Overlay on hover */}
          <motion.div
            whileHover={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-8"
          >
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-2 text-white"
            >
              <Heart className="w-8 h-8" fill="white" />
              <span className="text-sm font-semibold">{likeCount}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-2 text-white"
            >
              <MessageCircle className="w-8 h-8" />
              <span className="text-sm font-semibold">{post.comments_count}</span>
            </motion.button>
          </motion.div>
        </div>
      ) : (
        <div className="relative w-full p-6 bg-gradient-to-br from-dark-800 to-dark-900">
          {post.caption && (
            <p className="text-lg text-white leading-relaxed">
              {post.caption}
            </p>
          )}
        </div>
      )}

      {/* Post Content */}
      <div className="p-4 space-y-3">
        {/* User Info */}
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
          {post.user?.avatar_url && (
            <img
              src={post.user.avatar_url}
              alt={post.user.username}
              className="w-10 h-10 rounded-full object-cover border border-syndrome-primary"
            />
          )}
          <div>
            <p className="font-semibold text-white">{post.user?.username}</p>
            <p className="text-xs text-dark-400">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
          </div>

          {user?.id === post.user_id && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-2 rounded-full hover:bg-dark-700 text-dark-300"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute right-0 mt-2 w-40 rounded-xl bg-dark-800 border border-dark-600 shadow-xl z-20"
                  >
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <Trash className="w-4 h-4" /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-dark-200 leading-relaxed line-clamp-3">{post.caption}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLike}
            disabled={isLoading}
            className="flex items-center gap-2 text-dark-400 hover:text-syndrome-accent transition-colors"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Heart
                  className="w-5 h-5"
                  fill={isLiked ? 'currentColor' : 'none'}
                  color={isLiked ? '#f093fb' : 'currentColor'}
                />
                <span className="text-sm">{likeCount}</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCommentClick}
            className="flex items-center gap-2 text-dark-400 hover:text-syndrome-primary transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments_count}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-dark-400 hover:text-syndrome-primary transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 text-dark-400 hover:text-syndrome-primary transition-colors ml-auto"
          >
            <Bookmark
              className="w-5 h-5"
              fill={isSaved ? '#667eea' : 'none'}
              color={isSaved ? '#667eea' : 'currentColor'}
            />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default PostCard
