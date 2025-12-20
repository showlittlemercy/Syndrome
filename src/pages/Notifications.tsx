import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader, Heart, MessageCircle, UserPlus, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'

interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'message'
  post_id?: string
  comment_id?: string
  content?: string
  read: boolean
  created_at: string
  actor?: {
    id: string
    username: string
    avatar_url?: string
  }
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setNotifications(data || [])
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()

    // Subscribe to real-time notifications
    const channelName = `notifications-${user.id}-${Date.now()}`
    console.log('🔌 Creating Notifications realtime channel:', channelName)
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Fetch the full notification with actor data
          supabase
            .from('notifications')
            .select('*, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url)')
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setNotifications((prev) => [data, ...prev])
              }
            })
        }
      )
      .subscribe((status) => {
        console.log('🔌 Notifications realtime status:', status)
      })

    return () => {
      console.log('🔌 Cleaning up Notifications channel:', channelName)
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)

    // Navigate based on notification type
    if (notification.type === 'like' || notification.type === 'comment') {
      navigate(`/post/${notification.post_id}`)
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor_id}`)
    } else if (notification.type === 'message') {
      navigate('/messages')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-syndrome-accent" fill="#f093fb" />
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-syndrome-primary" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-syndrome-secondary" />
      default:
        return <Check className="w-5 h-5 text-dark-400" />
    }
  }

  const getNotificationText = (notification: Notification) => {
    const username = notification.actor?.username || 'Someone'
    switch (notification.type) {
      case 'like':
        return `${username} liked your post`
      case 'comment':
        return `${username} commented: "${notification.content?.slice(0, 50)}${
          notification.content && notification.content.length > 50 ? '...' : ''
        }"`
      case 'follow':
        return `${username} started following you`
      case 'message':
        return `${username} sent you a message`
      default:
        return 'New notification'
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const seconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return time.toLocaleDateString()
  }

  const unreadCount = notifications.filter((n) => !n.read).length

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
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-black gradient-text">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-dark-400 mt-2">
                {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-lg border border-syndrome-primary text-syndrome-primary font-semibold hover:bg-syndrome-primary/10 transition-colors"
            >
              Mark all as read
            </motion.button>
          )}
        </motion.div>

        {/* Notifications List */}
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 glass-effect rounded-2xl border border-dark-700 p-8"
            >
              <p className="text-dark-400 text-lg">No notifications yet</p>
              <p className="text-dark-500 text-sm mt-2">
                When someone likes or comments on your posts, you'll see it here
              </p>
            </motion.div>
          ) : (
            <motion.div className="space-y-3">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`glass-effect rounded-xl border p-4 cursor-pointer transition-all ${
                    notification.read
                      ? 'border-dark-700 hover:border-dark-600'
                      : 'border-syndrome-primary/50 bg-syndrome-primary/5 hover:border-syndrome-primary'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Actor Avatar */}
                    <div className="relative">
                      {notification.actor?.avatar_url ? (
                        <img
                          src={notification.actor.avatar_url}
                          alt={notification.actor.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-dark-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-syndrome-primary to-syndrome-secondary flex items-center justify-center border-2 border-dark-700">
                          <span className="text-sm font-bold text-white">
                            {notification.actor?.username?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      {/* Notification Icon Badge */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-dark-900 border-2 border-dark-800 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white leading-relaxed">
                        {getNotificationText(notification)}
                      </p>
                      <p className="text-xs text-dark-400 mt-1">
                        {getTimeAgo(notification.created_at)}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-syndrome-primary mt-2" />
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}

export default NotificationsPage
