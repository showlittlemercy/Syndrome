import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader, Send, Check, CheckCheck } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { Message, Profile } from '../types'
import { useAuthStore } from '../lib/store'

// Type Error Fix (Jugaad)
type MessageWithSender = Message & { sender?: Profile }

const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthStore()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 1. Fetch Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('sender_id, receiver_id')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        const userIds = new Set<string>()
        data?.forEach((msg: any) => {
          if (msg.sender_id !== user.id) userIds.add(msg.sender_id)
          if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id)
        })

        if (userIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', Array.from(userIds))
          setConversations(profiles || [])
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchConversations()

    const userIdParam = searchParams.get('userId')
    if (userIdParam && user) {
      supabase.from('profiles').select('*').eq('id', userIdParam).single()
        .then(({ data }) => { if (data) setSelectedUser(data as Profile) })
    }
  }, [user, searchParams])

  // 2. Fetch Chat & Realtime (Anti-Freeze Logic)
  useEffect(() => {
    if (!selectedUser || !user) return

    // Load initial messages
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true })

        if (error) throw error
        
        const formattedMessages = (data || []).map(msg => ({
          ...msg,
          sender: msg.sender_id === selectedUser.id ? selectedUser : undefined
        }))
        
        setMessages(formattedMessages)
      } catch (error) {
        console.error('Error loading chat:', error)
      }
    }

    fetchMessages()

    // ⚡ REALTIME SETUP
    const channelName = `room-${user.id}-${selectedUser.id}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`, // Sirf wo suno jo mere liye hai
        },
        (payload) => {
          // Double check: Kya ye message usi bande se aaya hai jisse baat ho rahi hai?
          const newMsg = payload.new as Message
          if (newMsg.sender_id === selectedUser.id) {
            setMessages((prev) => [...prev, { ...newMsg, sender: selectedUser }])
          }
        }
      )
      .subscribe((status) => {
        // Debugging ke liye: Status check karo console mein
        console.log("Realtime Status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedUser?.id, user?.id])

  // Mark messages as seen in the database whenever the thread is open and has unseen incoming messages.
  useEffect(() => {
    if (!user || !selectedUser) return

    const unseen = messages.some(
      (msg) => msg.sender_id === selectedUser.id && !msg.seen_at
    )

    if (!unseen) return

    const markSeen = async () => {
      const seenAt = new Date().toISOString()

      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender_id === selectedUser.id && !msg.seen_at
            ? { ...msg, seen_at: seenAt }
            : msg
        )
      )

      await supabase
        .from('messages')
        .update({ seen_at: seenAt })
        .eq('receiver_id', user.id)
        .eq('sender_id', selectedUser.id)
        .is('seen_at', null)
    }

    markSeen()
  }, [messages, selectedUser?.id, user?.id])

  // 3. Send Message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !user || !selectedUser) return

    const content = messageInput.trim()
    setMessageInput('')

    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `temp-${Date.now()}`

    // Optimistic Update (Turant dikhao)
    const optimisticMsg: any = {
      id: tempId,
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: content,
      created_at: new Date().toISOString(),
      sender: undefined 
    }

    setMessages((prev) => [...prev, optimisticMsg])

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          content: content
        })

      if (error) {
        console.error("Send Error:", error)
        alert("Message fail ho gaya!")
      }
      
      // Conversation list update (Agar naya banda hai)
      setConversations((prev) => {
        if (!prev.some(p => p.id === selectedUser.id)) {
          return [selectedUser, ...prev]
        }
        return prev
      })

    } catch (error) {
      console.error('Failed to send:', error)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex gap-4 p-4">
        
        {/* Left Side: Users List */}
        <div className={`w-full sm:w-72 glass-effect rounded-2xl border border-dark-700 overflow-hidden flex flex-col ${selectedUser ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 border-b border-dark-700">
            <h2 className="text-xl font-bold text-white">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isLoading ? (
              <div className="flex justify-center p-4"><Loader className="animate-spin text-syndrome-primary" /></div>
            ) : conversations.length === 0 ? (
              <p className="text-dark-400 text-center mt-4">No conversations yet.</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedUser(conv)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                    selectedUser?.id === conv.id 
                      ? 'bg-syndrome-primary/20 border border-syndrome-primary/50' 
                      : 'hover:bg-dark-800 border border-transparent'
                  }`}
                >
                  <img src={conv.avatar_url || `https://ui-avatars.com/api/?name=${conv.full_name}`} className="w-10 h-10 rounded-full bg-dark-700" alt="" />
                  <div className="text-left overflow-hidden">
                    <p className="font-semibold text-white truncate">{conv.username}</p>
                    <p className="text-xs text-dark-400 truncate">{conv.full_name}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Chat Box */}
        {selectedUser ? (
          <div className="flex-1 glass-effect rounded-2xl border border-dark-700 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-dark-700 bg-dark-800/30 flex items-center gap-3">
              <button onClick={() => setSelectedUser(null)} className="sm:hidden text-dark-400">← Back</button>
              <img src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.full_name}`} className="w-10 h-10 rounded-full" alt="" />
              <div>
                <h3 className="font-bold text-white">{selectedUser.username}</h3>
                <p className="text-xs text-green-400 flex items-center gap-1">● Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user?.id
                return (
                  <motion.div 
                    key={msg.id || i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      isMe 
                        ? 'bg-syndrome-primary text-white rounded-br-none' 
                        : 'bg-dark-700 text-dark-100 rounded-bl-none'
                    }`}>
                      <p>{msg.content}</p>
                      <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-white/70' : 'text-dark-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-dark-700 bg-dark-800/30 flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-syndrome-primary transition-colors"
              />
              <button 
                type="submit"
                disabled={!messageInput.trim()}
                className="bg-syndrome-primary p-2 rounded-xl text-white disabled:opacity-50 hover:bg-syndrome-secondary transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 glass-effect rounded-2xl border border-dark-700 items-center justify-center flex-col text-dark-400 gap-4">
            <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center">
              <Send className="w-8 h-8 opacity-50" />
            </div>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MessagesPage