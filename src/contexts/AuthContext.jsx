import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      setProfile(data || null);
    } catch (err) {
      console.error('Profile fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { data, error };
    } catch (err) {
      return { data: null, error: { message: err.message || 'Signup failed' } };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    } catch (err) {
      return { data: null, error: { message: err.message || 'Signin failed' } };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
    }
    return { error };
  };

  const createProfile = async (profileData) => {
    try {
      // Explicitly separate insert and update to avoid upsert hanging bugs
      let res = await supabase
        .from('profiles')
        .insert({ id: user.id, ...profileData })
        .select()
        .single();

      if (res.error && res.error.code === '23505') { // Unique Constraint Violation
        res = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id)
          .select()
          .single();
      }

      if (!res.error) {
        setProfile(res.data);
      }
      return { data: res.data, error: res.error };
    } catch (err) {
      return { data: null, error: { message: err.message || 'Failed to create profile' } };
    }
  };

  const value = {
    user,
    profile,
    loading,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    createProfile,
    fetchProfile: () => user && fetchProfile(user.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
