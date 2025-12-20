// Generated type definitions for Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_private?: boolean
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          image_url: string
          caption: string | null
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          image_url: string
          caption?: string | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          likes_count?: number
          comments_count?: number
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {}
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {}
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string | null
          group_id: string | null
          content: string
          message_type: string
          media_url: string | null
          seen_at: string | null
          delivered_at: string | null
          created_at: string
        }
        Insert: {
          sender_id: string
          receiver_id?: string | null
          group_id?: string | null
          content: string
          message_type?: string
          media_url?: string | null
          seen_at?: string | null
          delivered_at?: string | null
          created_at?: string
        }
        Update: {
          seen_at?: string | null
          delivered_at?: string | null
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          group_avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          owner_id: string
          group_avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          group_avatar_url?: string | null
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          group_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          role?: string
        }
      }
      presence: {
        Row: {
          id: string
          user_id: string
          status: string
          last_seen_at: string
          created_at: string
        }
        Insert: {
          user_id: string
          status?: string
          last_seen_at?: string
          created_at?: string
        }
        Update: {
          status?: string
          last_seen_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          media_url: string
          created_at: string
          expires_at: string
        }
        Insert: {
          user_id: string
          media_url: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          media_url?: string
          expires_at?: string
        }
      }
      saved_posts: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {}
      }
    }
    Views: {}
    Functions: {}
  }
}
