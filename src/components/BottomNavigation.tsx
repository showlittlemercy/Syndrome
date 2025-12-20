import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

interface NavigationItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
}

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const navigationItems: NavigationItem[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" />, path: '/home' },
    { id: 'search', label: 'Search', icon: <Search className="w-6 h-6" />, path: '/search' },
    { id: 'create', label: 'Create', icon: <Plus className="w-6 h-6" />, path: '/create' },
    { id: 'messages', label: 'Messages', icon: <MessageCircle className="w-6 h-6" />, path: '/messages' },
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
                  {item.icon}
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
