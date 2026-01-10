import { createContext } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import type { Database } from '../database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ data: { session: Session | null; user: User | null }; error: AuthError | null }>;
  signUp: (email: string, pass: string, metadata: { username: string; full_name: string; avatar_url: string }) => Promise<{ data: { session: Session | null; user: User | null }; error: AuthError | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
