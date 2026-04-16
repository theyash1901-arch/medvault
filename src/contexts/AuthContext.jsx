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
      // Use raw fetch to bypass Supabase JS client hanging bug
      const session = (await supabase.auth.getSession())?.data?.session;
      if (!session) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${session.access_token}`,
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const rows = await response.json();
        setProfile(rows?.[0] || null);
      } else {
        console.error('Profile fetch error:', response.status);
        setProfile(null);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      setProfile(null);
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
      // Use raw fetch with AbortController to bypass Supabase JS client hanging bug
      const session = (await supabase.auth.getSession())?.data?.session;
      if (!session) {
        return { data: null, error: { message: 'No active session. Please sign in again.' } };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const body = { id: user.id, ...profileData };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'return=representation,resolution=merge-duplicates',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      const text = await response.text();
      let result;
      try { result = JSON.parse(text); } catch { result = text; }

      if (!response.ok) {
        const msg = result?.message || result?.msg || (typeof result === 'string' ? result : JSON.stringify(result));
        return { data: null, error: { message: `DB Error ${response.status}: ${msg}` } };
      }

      const profileRow = Array.isArray(result) ? result[0] : result;
      if (profileRow) {
        setProfile(profileRow);
      }
      return { data: profileRow, error: null };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { data: null, error: { message: 'Request timed out after 5s. Your Supabase project may be paused — check dashboard.supabase.com' } };
      }
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
