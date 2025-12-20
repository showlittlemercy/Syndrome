import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader, Send, CheckCheck } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { Message, Profile } from '../types'
import { useAuthStore } from '../lib/store'

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

  // 2. Chat & Realtime (NO DUPLICATES LOGIC)
  useEffect(() => {
    if (!selectedUser || !user) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      
      if (data) {
        // Map sender manually to avoid join issues
        const formatted = data.map(m => ({
          ...m,
          sender: m.sender_id === selectedUser.id ? selectedUser : undefined
        }))
        setMessages(formatted)
      }
    }

    fetchMessages()

    // Realtime Listener - Listen to BOTH directions with proper filters
    const channel = supabase
      .channel(`room-${[user.id, selectedUser.id].sort().join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          if (newMsg.receiver_id === selectedUser.id) {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, { ...newMsg, sender: undefined }]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${selectedUser.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          if (newMsg.receiver_id === user.id) {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, { ...newMsg, sender: selectedUser }]
            })
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Room ${user.id}-${selectedUser.id}] Realtime:`, status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedUser?.id, user?.id])

  // 3. Send Message (Simplest Version - No Optimistic UI)
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !user || !selectedUser) return

    const content = messageInput.trim()
    setMessageInput('') // Clear input immediately

    // No setMessages() here. We wait for Realtime to add it.
    // This prevents the "Stuck" duplicate issue.

    await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: content
      })
      
    // Refresh list just in case it's a new user
    setConversations((prev) => {
        if (!prev.some(p => p.id === selectedUser.id)) return [selectedUser, ...prev]
        return prev
    })
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex gap-4 p-4">
        {/* Users List */}
        <div className={`w-full sm:w-72 glass-effect rounded-2xl border border-dark-700 overflow-hidden flex flex-col ${selectedUser ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 border-b border-dark-700"><h2 className="text-xl font-bold text-white">Messages</h2></div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isLoading ? <div className="flex justify-center p-4"><Loader className="animate-spin text-syndrome-primary" /></div> : 
             conversations.map(conv => (
                <button key={conv.id} onClick={() => setSelectedUser(conv)} className={`w-full p-3 rounded-xl flex items-center gap-3 ${selectedUser?.id === conv.id ? 'bg-syndrome-primary/20 border border-syndrome-primary/50' : 'hover:bg-dark-800'}`}>
                  <img src={conv.avatar_url || `https://ui-avatars.com/api/?name=${conv.full_name}`} className="w-10 h-10 rounded-full bg-dark-700" alt="" />
                  <div className="text-left overflow-hidden"><p className="font-semibold text-white truncate">{conv.username}</p></div>
                </button>
            ))}
          </div>
        </div>

        {/* Chat Box */}
        {selectedUser ? (
          <div className="flex-1 glass-effect rounded-2xl border border-dark-700 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-dark-700 bg-dark-800/30 flex items-center gap-3">
              <button onClick={() => setSelectedUser(null)} className="sm:hidden text-dark-400">←</button>
              <img src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.full_name}`} className="w-10 h-10 rounded-full" alt="" />
              <div><h3 className="font-bold text-white">{selectedUser.username}</h3><p className="text-xs text-green-400">● Online</p></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user?.id
                return (
                  <motion.div key={msg.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe ? 'bg-syndrome-primary text-white' : 'bg-dark-700 text-dark-100'}`}>
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

            <form onSubmit={sendMessage} className="p-3 border-t border-dark-700 bg-dark-800/30 flex gap-2">
              <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-syndrome-primary" />
              <button type="submit" disabled={!messageInput.trim()} className="bg-syndrome-primary p-2 rounded-xl text-white"><Send className="w-5 h-5" /></button>
            </form>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center text-dark-400">Select a conversation</div>
        )}
      </div>
    </Layout>
  )
}

export default MessagesPage