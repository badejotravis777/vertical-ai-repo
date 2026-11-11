import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase.js';

const AuthContext = createContext({ user: null, plan: 'free', loading: false, signOut: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(Boolean(supabase));

  const loadPlan = useCallback(async (nextUser) => {
    if (!supabase || !nextUser) {
      setPlan('free');
      return;
    }
    const { data } = await supabase.from('profiles').select('plan').eq('id', nextUser.id).maybeSingle();
    setPlan(data?.plan === 'pro' ? 'pro' : 'free');
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      await loadPlan(nextUser);
      if (active) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      loadPlan(nextUser);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadPlan]);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setPlan('free');
  };

  return <AuthContext.Provider value={{ user, plan, loading, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
