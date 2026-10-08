import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  /** Starts "Continue with GitHub". Returns an error message, or null. */
  signInWithGitHub: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Where GitHub/Supabase should send people back to after they sign in. */
function redirectUrl(): string {
  if (Platform.OS === 'web') {
    // e.g. https://paige-mcclinton.github.io/Test-1/ or http://localhost:8081/
    return window.location.origin + window.location.pathname;
  }
  // e.g. travelplanner://auth-callback (or exp://…/--/auth-callback in Expo Go)
  return Linking.createURL('auth-callback');
}

/** Reads access_token / refresh_token (or an error) from the URL Supabase redirects back to. */
function paramsFromUrl(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const q = url.indexOf('?');
  const h = url.indexOf('#');
  const parts: string[] = [];
  if (q >= 0) parts.push(url.slice(q + 1, h > q ? h : undefined));
  if (h >= 0) parts.push(url.slice(h + 1));
  parts
    .join('&')
    .split('&')
    .forEach((pair) => {
      if (!pair) return;
      const [k, v = ''] = pair.split('=');
      params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    });
  return params;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Tidy the browser address bar after returning from GitHub.
      if (Platform.OS === 'web' && newSession && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signInWithGitHub: async () => {
        const redirectTo = redirectUrl();

        if (Platform.OS === 'web') {
          // The whole page goes to GitHub and comes back signed in.
          const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo } });
          return error ? error.message : null;
        }

        // On phones, open GitHub in an in-app browser and catch the redirect back.
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error || !data.url) return error?.message ?? 'Could not start GitHub sign-in.';

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success') return null; // cancelled

        const params = paramsFromUrl(result.url);
        if (params.error_description || params.error) return params.error_description || params.error;
        if (params.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
          return exchangeError ? exchangeError.message : null;
        }
        if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          return sessionError ? sessionError.message : null;
        }
        return 'GitHub sign-in did not complete.';
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
