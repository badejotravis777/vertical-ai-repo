import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Null until the project's .env is filled in; the UI explains what's missing.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const PRO_CHECKOUT_URL = import.meta.env.VITE_PRO_CHECKOUT_URL || '';
