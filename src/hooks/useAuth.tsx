// src/hooks/useAuth.tsx
// (Версія v3.0, виправляє .single() та "втрачений" стан завантаження)

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types'; 

// Визначаємо типи з нашого 'types.ts'
type Profile = Database['public']['Tables']['profiles']['Row'] & { is_ai_allowed?: boolean };
type AppRole = Database['public']['Enums']['app_role'];

// Тип для контексту
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGitHub: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Створюємо Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Створюємо Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>('user');
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // Track initial load only

  // Функція для завантаження профілю ТА ролі
  const loadProfileAndRole = useCallback(async (sessionUser: User) => {
    try {
      // 1. Завантажуємо профіль (ФІКС №1: .maybeSingle())
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sessionUser.id)
        .maybeSingle();
      
      if (profileError) throw profileError;

      let finalProfile = profileData;

      // 2. Створюємо профіль, якщо його немає (ФІКС №3: Архітектура)
      if (!profileData) {
        console.warn('Профіль не знайдено, створюємо новий...');
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: sessionUser.id,
            email: sessionUser.email || '',
            full_name: sessionUser.user_metadata?.full_name || null,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        finalProfile = newProfile;
      }
      
      setProfile(finalProfile);

      // 3. ЗАВАНТАЖУЄМО РОЛЬ
      const { data: roleData, error: roleError } = await (supabase.rpc as any)('get_my_role');
      
      if (roleError) throw roleError;
      
      setRole(roleData || 'user');

    } catch (error) {
      console.error('Помилка завантаження профілю або ролі:', error);
      setRole('user');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadProfileAndRole(user);
  }, [user, loadProfileAndRole]);

  useEffect(() => {
    // Only run initial load once
    if (isInitialized) return;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfileAndRole(session.user);
        }
      } catch (error) {
        console.error('Помилка getSession:', error);
      } finally {
        // Only set loading false on initial load, never set true again
        setLoading(false);
        setIsInitialized(true);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // CRITICAL: Never set loading=true here - it causes dialog unmount on tab switch
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Background profile load - NO loading state change
          setTimeout(() => {
            loadProfileAndRole(session.user!)
              .catch(error => console.error('Помилка onAuthStateChange SIGNED_IN:', error));
          }, 0);
        }
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRole('user');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadProfileAndRole, isInitialized]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Помилка входу",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Успішний вхід",
          description: "Ласкаво просимо до Grow Box Technology!",
        });
      }
      
      return { error };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || '',
          },
        },
      });
      
      if (error) {
        toast({
          title: "Помилка реєстрації",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Реєстрація успішна",
          description: "Перевірте електронну пошту для підтвердження акаунта.",
        });
      }
      
      return { error };
    } catch (err) {
      console.error('Sign up error:', err);
      return { error: err };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast({
          title: "Помилка входу через Google",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (err) {
      console.error('Google sign in error:', err);
      return { error: err };
    }
  };

  const signInWithGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast({
          title: "Помилка входу через GitHub",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (err) {
      console.error('GitHub sign in error:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Помилка виходу",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Успішний вихід",
          description: "До побачення!",
        });
      }
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    profile,
    role,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
