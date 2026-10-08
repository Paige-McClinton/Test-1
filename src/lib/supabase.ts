import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** False until .env.local has the project URL and key (the app shows setup help instead). */
export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder-key', {
  auth: {
    storage: AsyncStorage, // keeps you signed in between launches
    autoRefreshToken: true,
    persistSession: true,
    // On the web, GitHub sends you back to the site with the sign-in in the URL; pick it up from there.
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// On phones, only refresh the sign-in token while the app is open.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
