export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          caption: string | null
          image_url: string
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          caption?: string | null
          image_url: string
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          caption?: string | null
          image_url?: string
          location?: string | null
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          reel_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          reel_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          reel_id?: string | null
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          reel_id: string | null
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          reel_id?: string | null
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          reel_id?: string | null
          text?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
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
          id?: string
          user_id: string
          media_url: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          media_url?: string
          created_at?: string
          expires_at?: string
        }
      }
      reels: {
        Row: {
          id: string
          user_id: string
          video_url: string
          caption: string | null
          audio_track_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_url: string
          caption?: string | null
          audio_track_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_url?: string
          caption?: string | null
          audio_track_name?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string | null
          media_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content?: string | null
          media_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string | null
          media_url?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string
          type: string
          post_id: string | null
          reel_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id: string
          type: string
          post_id?: string | null
          reel_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string
          type?: string
          post_id?: string | null
          reel_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}
