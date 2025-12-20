import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader, Send, Trash, ArrowLeft } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PostCard from '../components/PostCard'
import { supabase } from '../lib/supabase'
import { Post, Comment } from '../types'
import { useAuthStore } from '../lib/store'

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!postId) return

    const fetchPostAndComments = async () => {
      try {
        // Fetch post
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            *,
            user:profiles(id, username, avatar_url, bio),
            likes(user_id),
            saved_posts(user_id)
          `)
          .eq('id', postId)
          .single()

        if (postError) throw postError

        const transformedPost: Post = {
          ...postData,
          likes_count: postData.likes?.length || 0,
          isLiked: user ? postData.likes?.some((like: any) => like.user_id === user.id) : false,
          isSaved: user ? postData.saved_posts?.some((save: any) => save.user_id === user.id) : false,
        }

        setPost(transformedPost)

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*, user:profiles(id, username, avatar_url)')
          .eq('post_id', postId)
          .order('created_at', { ascending: true })

        if (commentsError) throw commentsError
        setComments(commentsData || [])
      } catch (error) {
        console.error('Error fetching post:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPostAndComments()
  }, [postId, user])

  // Realtime: keep post details in sync with DB trigger updates
  useEffect(() => {
    if (!postId) return
    
    const channelName = `post-detail-${postId}-${Date.now()}`
    console.log('🔌 Creating PostDetail realtime channel:', channelName)
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts', filter: `id=eq.${postId}` },
        (payload) => {
          const updated = payload.new as Post
          setPost((prev) => (prev ? { ...prev, comments_count: updated.comments_count, likes_count: updated.likes_count ?? prev.likes_count } : prev))
        }
      )
      .subscribe((status) => {
        console.log('🔌 PostDetail realtime status:', status)
      })

    return () => {
      console.log('🔌 Cleaning up PostDetail channel:', channelName)
      supabase.removeChannel(channel)
    }
  }, [postId])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !postId || !commentInput.trim()) return

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            content: commentInput.trim(),
          },
        ])
        .select('*, user:profiles(id, username, avatar_url)')
        .single()

      if (error) throw error

      setComments([...comments, data])
      setCommentInput('')

      // Update local state (database trigger updates the actual count)
      if (post) {
        setPost({ ...post, comments_count: post.comments_count + 1 })
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error

      setComments(comments.filter((c) => c.id !== commentId))

      // Update local state (database trigger updates the actual count)
      if (post) {
        setPost({ ...post, comments_count: Math.max(0, post.comments_count - 1) })
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
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

  if (!post) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <p className="text-center text-dark-400">Post not found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-syndrome-primary hover:text-syndrome-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back</span>
        </motion.button>

        {/* Post */}
        <PostCard
          post={post}
          onLikeChange={() => {}}
          onPostDeleted={() => navigate('/home')}
        />

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl border border-dark-700 p-6 space-y-6"
        >
          <h2 className="text-xl font-bold text-white">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="flex gap-3">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 rounded-lg bg-dark-800/50 border border-dark-600 focus:border-syndrome-primary focus:outline-none transition-colors text-white placeholder-dark-500"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSubmitting || !commentInput.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-syndrome-primary to-syndrome-secondary text-white font-semibold hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </form>

          {/* Comments List */}
          <AnimatePresence mode="popLayout">
            {comments.length === 0 ? (
              <p className="text-center text-dark-400 py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 p-4 rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/profile/${comment.user_id}`)}
                    >
                      {comment.user?.avatar_url ? (
                        <img
                          src={comment.user.avatar_url}
                          alt={comment.user.username}
                          className="w-10 h-10 rounded-full object-cover border border-syndrome-primary"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-syndrome-primary to-syndrome-secondary flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {comment.user?.username?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className="font-semibold text-white cursor-pointer hover:text-syndrome-primary transition-colors"
                            onClick={() => navigate(`/profile/${comment.user_id}`)}
                          >
                            {comment.user?.username}
                          </p>
                          <p className="text-xs text-dark-400">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>

                        {user?.id === comment.user_id && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>

                      <p className="text-dark-200 mt-2 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Layout>
  )
}

export default PostDetailPage
