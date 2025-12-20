import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Search, Plus, Bell, User, MessageCircle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'

interface NavigationItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
}

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (!error && count !== null) {
        setUnreadCount(count)
      }
    }

    fetchUnreadCount()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('notification_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0)
      return
    }

    const fetchUnreadMessages = async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('seen_at', null)

      if (!error && count !== null) {
        setUnreadMessages(count)
      }
    }

    fetchUnreadMessages()

    const channel = supabase
      .channel(`messages-unread-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const navigationItems: NavigationItem[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" />, path: '/home' },
    { id: 'search', label: 'Search', icon: <Search className="w-6 h-6" />, path: '/search' },
    { id: 'create', label: 'Create', icon: <Plus className="w-6 h-6" />, path: '/create' },
    { id: 'messages', label: 'Messages', icon: <MessageCircle className="w-6 h-6" />, path: '/messages' },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-6 h-6" />, path: '/notifications' },
    { id: 'profile', label: 'Profile', icon: <User className="w-6 h-6" />, path: '/profile' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <motion.nav
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-dark-900 via-dark-900 to-dark-900/80 backdrop-blur-lg border-t border-dark-700"
    >
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const active = isActive(item.path)

            return (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative px-4 py-3 rounded-xl transition-all duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Glow background for active item */}
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-syndrome-primary to-syndrome-secondary opacity-20 blur-lg"
                  />
                )}

                {/* Inner glow */}
                {active && (
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(102, 126, 234, 0.3)',
                        '0 0 30px rgba(102, 126, 234, 0.6)',
                        '0 0 20px rgba(102, 126, 234, 0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-xl"
                  />
                )}

                {/* Border */}
                {active && (
                  <motion.div
                    layoutId="activeBorder"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute inset-0 rounded-xl border border-syndrome-primary/50"
                  />
                )}

                {/* Icon */}
                <motion.div
                  animate={{
                    color: active ? '#667eea' : hoveredItem === item.id ? '#a78bfa' : '#9ca3af',
                    scale: active ? 1.2 : hoveredItem === item.id ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10 flex flex-col items-center gap-1"
                >
                  <div className="relative">
                    {item.icon}
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-syndrome-accent rounded-full flex items-center justify-center border-2 border-dark-900"
                        >
                          <span className="text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        </motion.div>
                      </AnimatePresence>
                    )}
                    {item.id === 'messages' && unreadMessages > 0 && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 min-w-[18px] h-5 px-1 bg-syndrome-primary rounded-full flex items-center justify-center border-2 border-dark-900"
                        >
                          <span className="text-[10px] font-bold text-white">
                            {unreadMessages > 9 ? '9+' : unreadMessages}
                          </span>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{item.label}</span>
                </motion.div>

                {/* Hover glow effect */}
                {hoveredItem === item.id && !active && (
                  <motion.div
                    layoutId="hoverGlow"
                    className="absolute inset-0 rounded-xl bg-syndrome-primary/5 blur-md"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}

export default BottomNavigation
