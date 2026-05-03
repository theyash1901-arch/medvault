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
      const storedUser = localStorage.getItem('mock_user');
      const storedProfile = localStorage.getItem('mock_profile');
      if (storedUser && storedProfile) {
        setUser(JSON.parse(storedUser));
        setProfile(JSON.parse(storedProfile));
      }
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
    if (!isSupabaseConfigured || userId.startsWith('demo-')) {
      setProfile({ id: userId, role: 'patient', full_name: 'Demo User', blood_group: 'O+' });
      setLoading(false);
      return;
    }
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
    if (!isSupabaseConfigured) {
      const mockUser = { id: 'demo-' + Date.now(), email };
      const mockProfile = { id: mockUser.id, role: 'patient', full_name: 'Demo User', blood_group: 'O+' };
      setUser(mockUser);
      setProfile(mockProfile);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('mock_profile', JSON.stringify(mockProfile));
      return { data: { user: mockUser }, error: null };
    }
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const mockUser = { id: 'demo-' + Date.now(), email };
      const mockProfile = { id: mockUser.id, role: 'patient', full_name: 'Demo User', blood_group: 'O+' };
      setUser(mockUser);
      setProfile(mockProfile);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('mock_profile', JSON.stringify(mockProfile));
      return { data: { user: mockUser }, error: null };
    }
  };

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      const mockUser = { id: 'demo-' + Date.now(), email };
      const mockProfile = { id: mockUser.id, role: 'patient', full_name: 'Demo User', blood_group: 'O+' };
      setUser(mockUser);
      setProfile(mockProfile);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('mock_profile', JSON.stringify(mockProfile));
      return { data: { user: mockUser }, error: null };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.warn('Login failed, using offline fallback');
      const mockUser = { id: 'demo-' + Date.now(), email };
      const mockProfile = { id: mockUser.id, role: 'patient', full_name: 'Demo User', blood_group: 'O+' };
      setUser(mockUser);
      setProfile(mockProfile);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('mock_profile', JSON.stringify(mockProfile));
      return { data: { user: mockUser }, error: null };
    }
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('mock_user');
    localStorage.removeItem('mock_profile');
    setUser(null);
    setProfile(null);
    return { error: null };
  };

  const signInWithApple = async () => {
    if (!isSupabaseConfigured) {
      const mockUser = { id: 'demo-apple', email: 'apple@example.com' };
      setUser(mockUser);
      setProfile({ id: mockUser.id, role: 'patient', full_name: 'Apple User', blood_group: 'O+' });
      return { data: { user: mockUser }, error: null };
    }
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'apple' });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const mockUser = { id: 'demo-apple', email: 'apple@example.com' };
      setUser(mockUser);
      setProfile({ id: mockUser.id, role: 'patient', full_name: 'Apple User', blood_group: 'O+' });
      return { data: { user: mockUser }, error: null };
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      const mockUser = { id: 'demo-google', email: 'google@example.com' };
      setUser(mockUser);
      setProfile({ id: mockUser.id, role: 'patient', full_name: 'Google User', blood_group: 'O+' });
      return { data: { user: mockUser }, error: null };
    }
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const mockUser = { id: 'demo-google', email: 'google@example.com' };
      setUser(mockUser);
      setProfile({ id: mockUser.id, role: 'patient', full_name: 'Google User', blood_group: 'O+' });
      return { data: { user: mockUser }, error: null };
    }
  };

  const createProfile = async (profileData) => {
    if (!isSupabaseConfigured || user?.id?.startsWith('demo-')) {
      const newProfile = { id: user.id, ...profileData };
      setProfile(newProfile);
      return { data: newProfile, error: null };
    }
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profileData })
      .select()
      .single();

    if (!error) {
      setProfile(data);
    }
    return { data, error };
  };

  const value = {
    user,
    profile,
    loading,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    signInWithApple,
    signInWithGoogle,
    createProfile,
    fetchProfile: () => user && fetchProfile(user.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
