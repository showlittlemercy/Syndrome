import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader, Send, Check, CheckCheck } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { Message, Profile } from '../types'
import { useAuthStore } from '../lib/store'

const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return

      try {
        // Get unique users from messages
        const { data, error } = await supabase
          .from('messages')
          .select('sender_id, receiver_id')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Extract unique user IDs
        const userIds = new Set<string>()
        data.forEach((msg: any) => {
          if (msg.sender_id !== user.id) userIds.add(msg.sender_id)
          if (msg.receiver_id && msg.receiver_id !== user.id) userIds.add(msg.receiver_id)
        })

        // Fetch user profiles
        if (userIds.size > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', Array.from(userIds))

          if (profileError) throw profileError
          setConversations(profiles || [])
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()

    // Check if userId query param exists (from profile message button)
    const userIdParam = searchParams.get('userId')
    if (userIdParam && user) {
      // Fetch that user's profile and auto-select them
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userIdParam)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedUser(data as Profile)
          }
        })
    }
  }, [user, searchParams])

  useEffect(() => {
    if (!selectedUser || !user) return

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`*, sender:profiles(username, avatar_url)`)
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`
          )
          .order('created_at')

        if (error) throw error
        setMessages(data || [])
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    fetchMessages()

    // Subscribe to new messages via realtime
    const channel = supabase
      .channel('messages-stream')
      // Incoming messages to the current user
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        const m = payload.new as Message
        // Only append if the message belongs to the open conversation
        if (m.sender_id === selectedUser.id) {
          setMessages((prev) => [...prev, m])
        }
      })
      // Outgoing messages sent by the current user
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}`
      }, (payload) => {
        const m = payload.new as Message
        if (m.receiver_id === selectedUser.id) {
          setMessages((prev) => [...prev, m])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedUser, user])

  const sendMessage = async () => {
    if (!messageInput.trim() || !user || !selectedUser) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: selectedUser.id,
            content: messageInput,
            delivered_at: new Date().toISOString(),
          },
        ])
        // Return the inserted row without embedding profiles to avoid FK ambiguity
        .select('*')
        .single()

      if (error) throw error
      if (data) {
        // Optimistically append our sent message so it appears instantly
        setMessages((prev) => [...prev, data as unknown as Message])
        // Ensure the conversation appears in the list
        setConversations((prev) => {
          const exists = prev.some((p) => p.id === selectedUser.id)
          return exists ? prev : [...prev, selectedUser]
        })
      }
      setMessageInput('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessage()
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex gap-4 p-4">
        {/* Conversations List */}
        <div className="w-full sm:w-64 glass-effect rounded-2xl border border-dark-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-dark-700">
            <h2 className="text-xl font-bold text-white">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-syndrome-primary animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-dark-400 text-center py-8">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setSelectedUser(conv)
                  }}
                  className={`w-full p-3 rounded-lg transition-colors text-left ${
                    selectedUser?.id === conv.id
                      ? 'bg-syndrome-primary/20 border border-syndrome-primary'
                      : 'hover:bg-dark-700'
                  }`}
                >
                  <p className="font-semibold text-white">{conv.username}</p>
                  <p className="text-xs text-dark-400">{conv.full_name}</p>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedUser ? (
          <div className="flex-1 glass-effect rounded-2xl border border-dark-700 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-dark-700 bg-dark-800/50">
              <h3 className="font-bold text-white">{selectedUser.username}</h3>
              <p className="text-xs text-dark-400">Online</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${
                    msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender_id === user?.id
                        ? 'bg-gradient-to-r from-syndrome-primary to-syndrome-secondary text-white'
                        : 'bg-dark-800 text-dark-200'
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs opacity-70">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                      {msg.sender_id === user?.id && (
                        <>
                          {msg.seen_at ? (
                            <CheckCheck className="w-4 h-4" />
                          ) : msg.delivered_at ? (
                            <Check className="w-4 h-4" />
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-dark-700 bg-dark-800/50 flex gap-2"
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    // Send on Enter
                    sendMessage()
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 focus:border-syndrome-primary focus:outline-none text-white placeholder-dark-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="p-2 rounded-lg bg-syndrome-primary hover:bg-syndrome-primary/80 transition-colors text-white"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </form>
          </div>
        ) : (
          <div className="flex-1 glass-effect rounded-2xl border border-dark-700 flex items-center justify-center">
            <p className="text-dark-400">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MessagesPage
