import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Post, Like, Comment } from '../types'
import { useAuthStore } from '../lib/store'

interface PostCardProps {
  post: Post
  onLikeChange?: () => void
  onCommentClick?: () => void
}

const PostCard: React.FC<PostCardProps> = ({ post, onLikeChange, onCommentClick }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likeCount, setLikeCount] = useState(post.likes_count)
  const [isLoading, setIsLoading] = useState(false)
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
      {/* Post Image */}
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

      {/* Post Content */}
      <div className="p-4 space-y-3">
        {/* User Info */}
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
        </div>
      </div>
    </motion.div>
  )
}

export default PostCard
