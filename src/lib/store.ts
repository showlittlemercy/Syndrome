import { create } from 'zustand'
import { AuthUser, Profile } from '../types'

interface AuthStore {
  user: AuthUser | null
  profile: Profile | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setProfile: (profile: Profile | null) => void
  setIsLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, profile: null }),
}))

// Chat store for managing chat state
interface ChatStore {
  selectedConversation: string | null
  selectedGroup: string | null
  isTyping: boolean
  setSelectedConversation: (id: string | null) => void
  setSelectedGroup: (id: string | null) => void
  setIsTyping: (isTyping: boolean) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  selectedConversation: null,
  selectedGroup: null,
  isTyping: false,
  setSelectedConversation: (id) => set({ selectedConversation: id }),
  setSelectedGroup: (id) => set({ selectedGroup: id }),
  setIsTyping: (isTyping) => set({ isTyping }),
}))

// UI store for managing UI state
interface UIStore {
  theme: 'dark' | 'light'
  sidebarOpen: boolean
  toggleTheme: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  theme: 'dark',
  sidebarOpen: false,
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'dark' ? 'light' : 'dark',
  })),
  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen,
  })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
