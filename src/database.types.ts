export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          is_verified: boolean;
          role: string;
          last_seen: string | null;
          is_online: boolean;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          is_verified?: boolean;
          role?: string;
          last_seen?: string | null;
          is_online?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          is_verified?: boolean;
          role?: string;
          last_seen?: string | null;
          is_online?: boolean;
          updated_at?: string;
        };

      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          caption: string | null;
          image_url: string;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          caption?: string | null;
          image_url: string;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          caption?: string | null;
          image_url?: string;
          location?: string | null;
          created_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          reel_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          reel_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          reel_id?: string | null;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          reel_id: string | null;
          text: string;
          audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          reel_id?: string | null;
          text: string;
          audio_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          reel_id?: string | null;
          text?: string;
          audio_url?: string | null;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          media_url: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_url: string;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_url?: string;
          created_at?: string;
          expires_at?: string;
        };
      };
      reels: {
        Row: {
          id: string;
          user_id: string;
          video_url: string;
          caption: string | null;
          audio_track_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_url: string;
          caption?: string | null;
          audio_track_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_url?: string;
          caption?: string | null;
          audio_track_name?: string | null;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string | null;
          media_url: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content?: string | null;
          media_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string | null;
          media_url?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: string;
          post_id: string | null;
          reel_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id: string;
          type: string;
          post_id?: string | null;
          reel_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          actor_id?: string;
          type?: string;
          post_id?: string | null;
          reel_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      saves: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      post_tags: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_feed: {
        Args: {
          current_user_id: string;
          limit_count?: number;
          offset_count?: number;
        };
        Returns: {
          id: string;
          created_at: string;
          caption: string | null;
          image_url: string;
          likes_count: number;
          comments_count: number;
          user_id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          has_liked: boolean;
          has_saved: boolean;
        }[];
      };
      get_conversations: {
        Args: {
          current_user_id: string;
          limit_count?: number;
          offset_count?: number;
        };
        Returns: {
          user_id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          last_message: string | null;
          last_message_time: string;
          is_read: boolean;
          sender_id: string;
        }[];
      };
      exec_sql: {
        Args: {
          query: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
