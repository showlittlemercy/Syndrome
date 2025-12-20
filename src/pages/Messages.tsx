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
        // Get all messages for the user (RLS policy handles filtering)
        // Limit to last 50 to avoid fetching too much
        const { data, error } = await supabase
          .from('messages')
          .select('sender_id, receiver_id')
          .order('created_at', { ascending: false })
          .limit(100) // Limit results to prevent overload

        if (error) {
          console.error('RLS error or query error:', error)
          throw error
        }

        // Extract unique conversation partners
        const userIds = new Set<string>()
        data?.forEach((msg: any) => {
          if (msg.sender_id !== user.id && msg.sender_id) userIds.add(msg.sender_id)
          if (msg.receiver_id !== user.id && msg.receiver_id) userIds.add(msg.receiver_id)
        })

        // Fetch profiles for conversation partners
        if (userIds.size > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', Array.from(userIds))

          if (profileError) {
            console.error('Profile fetch error:', profileError)
            throw profileError
          }
          setConversations(profiles || [])
        } else {
          setConversations([])
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
        // Fetch messages in this conversation (both directions)
        // Use two separate queries to avoid .or() complexity issues
        const { data: sentMessages, error: sentError } = await supabase
          .from('messages')
          .select('*')
          .eq('sender_id', user.id)
          .eq('receiver_id', selectedUser.id)
          .order('created_at')

        const { data: receivedMessages, error: receivedError } = await supabase
          .from('messages')
          .select('*')
          .eq('sender_id', selectedUser.id)
          .eq('receiver_id', user.id)
          .order('created_at')

        if (sentError || receivedError) {
          console.error('Error fetching messages:', sentError || receivedError)
          return
        }

        // Merge and sort messages
        const allMessages = [...(sentMessages || []), ...(receivedMessages || [])]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        // Fetch sender profiles for all messages
        const senderIds = new Set(allMessages.map(m => m.sender_id))
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', Array.from(senderIds))

        // Attach profiles to messages
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
        const messagesWithProfiles = allMessages.map(msg => ({
          ...msg,
          sender: profileMap.get(msg.sender_id),
        }))

        setMessages(messagesWithProfiles)
      } catch (error) {
        console.error('Error in fetchMessages:', error)
      }
    }

    fetchMessages()

    // Subscribe to new messages via realtime - use IDs only to prevent recreating
    const channelName = `messages-${user.id}-${selectedUser.id}`
    console.log('📡 Setting up realtime channel:', channelName)
    
    const channel = supabase
      .channel(channelName)
      // Listen for messages WHERE current user is receiver
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, async (payload) => {
        const m = payload.new as Message
        // Only if from selected conversation
        if (m.sender_id === selectedUser.id) {
          console.log('📨 Received message from', selectedUser.id)
          // Fetch sender profile only if we don't have it
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', m.sender_id)
            .single()
          
          setMessages((prev) => {
            const exists = prev.some(msg => msg.id === m.id)
            if (exists) return prev
            return [...prev, { ...m, sender: senderProfile || undefined }]
          })
        }
      })
      // Listen for messages WHERE other user is receiver (messages we sent)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${selectedUser.id}`
      }, async (payload) => {
        const m = payload.new as Message
        // Only if sent by current user
        if (m.sender_id === user.id) {
          console.log('📤 Sent message confirmed')
          setMessages((prev) => {
            const exists = prev.some(msg => msg.id === m.id)
            if (exists) return prev
            return [...prev, m]
          })
        }
      })
      .subscribe((status, err) => {
        console.log('🔌 Subscription status:', status)
        if (err) console.error('❌ Subscription error:', err)
      })

    return () => {
      console.log('🔌 Cleaning up channel:', channelName)
      supabase.removeChannel(channel)
    }
  }, [selectedUser?.id, user?.id]) // Use IDs only to prevent unnecessary recreations

  const sendMessage = async () => {
    if (!messageInput.trim() || !user || !selectedUser) return

    const messageContent = messageInput.trim()
    setMessageInput('')

    try {
      // Insert without .select() to avoid 500 errors
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: selectedUser.id,
            content: messageContent,
            delivered_at: new Date().toISOString(),
          },
        ])

      if (error) throw error

      // Don't add optimistically - let realtime subscription handle it
      // This prevents duplicates

      setConversations((prev) => {
        const exists = prev.some((p) => p.id === selectedUser.id)
        return exists ? prev : [...prev, selectedUser]
      })
    } catch (error) {
      console.error('Error sending message:', error)
      // Restore input on error
      setMessageInput(messageContent)
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
                className={`flex gap-2 ${
                  msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender_id !== user?.id && msg.sender?.avatar_url && (
                  <img
                    src={msg.sender.avatar_url}
                    alt={msg.sender.username}
                    className="w-8 h-8 rounded-full object-cover border border-syndrome-primary"
                  />
                )}
                <div className="flex flex-col gap-1">
                  {msg.sender_id !== user?.id && msg.sender?.username && (
                    <span className="text-xs text-dark-400 ml-2">{msg.sender.username}</span>
                  )}
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
