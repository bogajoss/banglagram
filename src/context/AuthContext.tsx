import React, { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../database.types";
import { AuthContext } from "./AuthContextInstance";
import type { AuthContextType } from "./AuthContextInstance";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn: AuthContextType["signIn"] = async (
    email: string,
    pass: string,
  ) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    return { data, error };
  };

  const signUp: AuthContextType["signUp"] = async (
    email: string,
    pass: string,
    metadata: { username: string; full_name: string; avatar_url: string },
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  };

  const resetPassword: AuthContextType["resetPassword"] = async (
    email: string,
  ) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/?reset=true`,
    });
    return { data, error };
  };

  const updatePassword: AuthContextType["updatePassword"] = async (
    newPassword: string,
  ) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
