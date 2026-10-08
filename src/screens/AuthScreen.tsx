import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, TextField } from '../components/ui';
import { useAuth } from '../state/AuthContext';
import { colors, spacing, type } from '../theme';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignUp = mode === 'signUp';

  const submit = async () => {
    setError(null);
    setNotice(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    if (isSignUp) {
      const result = await signUp(email, password);
      if (result.error) setError(result.error);
      else if (result.needsConfirmation) {
        setNotice('Check your email for a confirmation link, then come back and sign in.');
        setMode('signIn');
      }
    } else {
      const message = await signIn(email, password);
      if (message) setError(message);
    }
    setBusy(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>🧳</Text>
          <Text style={[type.title, styles.center]}>Travel Planner</Text>
          <Text style={[type.small, styles.center, styles.tagline]}>
            Itineraries, budgets, packing lists and guides — synced across your devices.
          </Text>

          <Card style={styles.card}>
            <Text style={[type.heading, { marginBottom: spacing.lg }]}>
              {isSignUp ? 'Create your account' : 'Sign in'}
            </Text>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
              secureTextEntry
              textContentType={isSignUp ? 'newPassword' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              onSubmitEditing={submit}
              returnKeyType="go"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            <Button
              title={busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
              onPress={submit}
              disabled={busy}
            />
          </Card>

          <View style={styles.switchRow}>
            <Text style={type.small}>{isSignUp ? 'Already have an account?' : 'New here?'}</Text>
            <Pressable
              onPress={() => {
                setMode(isSignUp ? 'signIn' : 'signUp');
                setError(null);
                setNotice(null);
              }}
              hitSlop={8}
            >
              <Text style={styles.switchLink}>{isSignUp ? 'Sign in' : 'Create an account'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: 48, flexGrow: 1, justifyContent: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: spacing.sm },
  center: { textAlign: 'center' },
  tagline: { fontSize: 15, marginTop: spacing.xs, marginBottom: spacing.xl, lineHeight: 21 },
  card: { padding: spacing.xl },
  error: { color: colors.danger, marginBottom: spacing.md, fontSize: 14 },
  notice: { color: colors.success, marginBottom: spacing.md, fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  switchLink: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
