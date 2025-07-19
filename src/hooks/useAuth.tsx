
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth listener...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to avoid deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 100);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Wait a bit more to ensure the trigger has completed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_subscriptions(
            *,
            subscription_plans(*)
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        
        // If profile doesn't exist, try to create it manually
        if (error.code === 'PGRST116') {
          console.log('Profile not found, attempting to create...');
          await createMissingProfile(userId);
          return;
        }
        return;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const createMissingProfile = async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      console.log('Creating missing profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            full_name: authUser.user.user_metadata?.full_name || 'Usuário',
            email: authUser.user.email || '',
            role: 'student'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return;
      }

      console.log('Profile created successfully:', data);
      
      // Now fetch the complete profile with subscription
      setTimeout(() => fetchUserProfile(userId), 500);
      
    } catch (error) {
      console.error('Error in createMissingProfile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('Attempting signup for:', email);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });
      
      console.log('Signup response:', { data, error });
      
      if (error) {
        console.error('Signup error:', error);
        return { error };
      }

      // If user is created successfully but needs email confirmation
      if (data.user && !data.session) {
        console.log('User created, waiting for email confirmation');
        return { error: null };
      }

      return { error: null };
    } catch (err) {
      console.error('Signup error:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting signin for:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Signin response:', { data, error });
      return { error };
    } catch (err) {
      console.error('Signin error:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    console.log('Signing out...');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
