import type { Session } from '@supabase/supabase-js';
import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
 
import { supabase } from '../lib/supabase';
 
type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
};
 
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
 
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
 
  useEffect(() => {
    let isMounted = true;
 
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }
 
        if (error) {
          console.error('Unable to restore session:', error.message);
        }
 
        setSession(data.session);
        setIsLoading(false);
      });
 
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });
 
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
 
  const value = useMemo(
    () => ({
      session,
      isLoading,
    }),
    [session, isLoading]
  );
 
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
 
export function useAuth() {
  const context = useContext(AuthContext);
 
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
 
  return context;
}