import { useContext, useEffect, useState } from 'react';
import { SupabaseContext } from '../lib/supabase-provider';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const context = useContext(SupabaseContext);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseProvider');
  }

  const { supabase, session } = context;

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      try {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, [session]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
  };

  return {
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}