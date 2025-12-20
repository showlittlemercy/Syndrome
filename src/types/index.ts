// User-related types
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

// Post-related types
export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user?: Profile;
  isLiked?: boolean;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

// Follow-related types
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Message-related types
export interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  group_id?: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  media_url?: string;
  seen_at?: string;
  delivered_at?: string;
  created_at: string;
  sender?: Profile;
}

// Group-related types
export interface Group {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  group_avatar_url?: string;
  created_at: string;
  updated_at: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: Profile;
}

// Presence-related types
export interface Presence {
  id: string;
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen_at: string;
  created_at: string;
}

// Auth-related types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

// Chat-related types
export interface ChatConversation {
  id: string;
  participants: Profile[];
  lastMessage?: Message;
  unreadCount: number;
}

// Feed-related types
export interface FeedItem {
  post: Post;
  likes: Like[];
  comments: Comment[];
}
