import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'
import Layout from '../components/Layout'
import PostCard from '../components/PostCard'
import StoriesBar from '../components/StoriesBar'
import { supabase } from '../lib/supabase'
import { Post } from '../types'
import { useAuthStore } from '../lib/store'

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()

  const PAGE_SIZE = 10

  const fetchPosts = useCallback(async (pageNum: number) => {
    try {
      const start = pageNum * PAGE_SIZE
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(id, username, avatar_url, bio),
          likes(user_id),
          saved_posts(user_id)
        `)
        .order('created_at', { ascending: false })
        .range(start, start + PAGE_SIZE - 1)

      if (error) throw error

      const transformedPosts: Post[] = data.map((post: any) => ({
        ...post,
        likes_count: post.likes.length,
        isLiked: user ? post.likes.some((like: any) => like.user_id === user.id) : false,
        isSaved: user ? post.saved_posts?.some((save: any) => save.user_id === user.id) : false,
      }))

      if (pageNum === 0) {
        setPosts(transformedPosts)
      } else {
        setPosts((prev) => [...prev, ...transformedPosts])
      }

      setHasMore(transformedPosts.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchPosts(0)
  }, [fetchPosts])

  // Realtime: update comments_count in feed when posts are updated by triggers
  useEffect(() => {
    const channel = supabase
      .channel('posts-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          const updated = payload.new as Post
          setPosts((prev) =>
            prev.map((p) => (p.id === updated.id ? { ...p, comments_count: updated.comments_count } : p))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1)
          fetchPosts(page + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, page, fetchPosts])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <StoriesBar />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <h1 className="text-4xl font-black gradient-text mb-2">Your Feed</h1>
          <p className="text-dark-400">Posts from people you follow</p>
        </motion.div>

        {/* Posts Grid */}
        {isLoading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader className="w-8 h-8 text-syndrome-primary" />
            </motion.div>
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-dark-400">No posts yet. Start following people!</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeChange={() => fetchPosts(0)}
                onPostDeleted={() => fetchPosts(0)}
              />
            ))}
          </motion.div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={observerTarget} className="py-4" />

        {/* Loading indicator */}
        {!isLoading && hasMore && (
          <div className="flex items-center justify-center py-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader className="w-6 h-6 text-syndrome-primary" />
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default HomePage
