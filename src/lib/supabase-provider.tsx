import { createContext, useEffect, useState, ReactNode } from 'react';
import { 
  createClient, 
  SupabaseClient, 
  Session
} from '@supabase/supabase-js';

import { Database } from '../types/supabase';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  session: Session | null;
};

export const SupabaseContext = createContext<SupabaseContext | undefined>(
  undefined
);

export interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [supabase] = useState(() =>
    createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  );
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {children}
    </SupabaseContext.Provider>
  );
}