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
  id: number;
  user: User;
  src: string;
  likes: string;
  comments: string;
  caption: string;
  audio: string;
}

export interface Notification {
  id: number;
  type: "follow" | "system";
  user?: User;
  text: string;
  time: string;
  isFollowing?: boolean;
  icon?: string;
}
