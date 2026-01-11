export interface User {
  id?: string;
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  isVerified?: boolean;
  stats?: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

export interface Comment {
  id: string; // Add ID
  user: {
    // Update user to object match
    username: string;
    avatar: string;
    name?: string;
  };
  text: string;
}

export interface Post {
  id: string; // Unify as string
  user: User;
  content: {
    type: "image" | "video";
    src?: string;
    poster?: string;
  };
  likes: string | number;
  caption: string;
  comments: string | number;
  time: string;
  isVerified?: boolean;
  hasLiked?: boolean;
  hasSaved?: boolean;
  commentList?: Comment[];
}

export interface Story {
  id: string; // UUID
  username: string;
  img: string;
  isUser?: boolean;
  isVerified?: boolean;
}

export interface Message {
  id: string; // UUID
  user: User;
  lastMessage: string;
  time: string;
  unread: boolean;
  chatHistory?: ChatMessage[];
}

export interface ChatMessage {
  type: "date" | "incoming" | "outgoing";
  text?: string;
  contentType?: "image" | "profile" | "post" | "text";
  src?: string;
  timestamp?: string;
  username?: string;
  avatar?: string;
  caption?: string;
  isVerified?: boolean;
}

export interface Reel {
  id: string;
  user: User;
  src: string;
  poster?: string;
  likes: number;
  comments: number;
  caption: string;
  audio: string;
  hasLiked?: boolean;
  userId?: string;
}

export interface Notification {
  id: string; // UUID
  type: "follow" | "system" | "like" | "comment";
  user?: User;
  text: string;
  time: string;
  created_at?: string; // ISO string for sorting
  isFollowing?: boolean;
  icon?: string;
  postId?: string;
  reelId?: string;
}
