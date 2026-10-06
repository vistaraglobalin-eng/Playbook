import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && key);

export const supabase = supabaseConfigured
  ? createClient(url, key)
  : null;

export async function loadPracticeRounds() {
  if (!supabaseConfigured) {
    return {
      rounds: [],
      error: new Error(
        'Supabase environment variables are not configured.'
      )
    };
  }

  const { data, error } = await supabase
    .from('aviator_practice_rounds')
    .select('round_number, crash_multiplier, created_at')
    .order('round_number', { ascending: true });

  return {
    rounds: data ?? [],
    error
  };
}
