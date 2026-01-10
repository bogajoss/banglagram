export interface User {
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  stats?: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface Comment {
  user: string;
  text: string;
}

export interface Post {
  id: number | string;
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
  commentList?: Comment[];
}

export interface Story {
  id: number;
  username: string;
  img: string;
  isUser?: boolean;
}

export interface Message {
  id: number;
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
  id: string; // Changed from number to string (uuid)
  user: User;
  src: string;
  likes: number; // Changed to number
  comments: number; // Changed to number
  caption: string;
  audio: string;
  hasLiked?: boolean;
}

export interface Notification {
  id: number;
  type: "follow" | "system" | "like" | "comment";
  user?: User;
  text: string;
  time: string;
  isFollowing?: boolean;
  icon?: string;
  postId?: string;
  reelId?: string;
}
