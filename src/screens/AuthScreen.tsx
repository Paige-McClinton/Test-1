import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '../components/ui';
import { useAuth } from '../state/AuthContext';
import { colors, radius, spacing, type } from '../theme';

export function AuthScreen() {
  const { signInWithGitHub } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    setBusy(true);
    const message = await signInWithGitHub();
    if (message) setError(message);
    setBusy(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>🧳</Text>
        <Text style={[type.title, styles.center]}>Travel Planner</Text>
        <Text style={[type.small, styles.center, styles.tagline]}>
          Itineraries, budgets, packing lists and guides — synced across your devices.
        </Text>

        <Card style={styles.card}>
          <Text style={[type.heading, styles.center, { marginBottom: spacing.lg }]}>Sign in to continue</Text>
          <Pressable
            onPress={start}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [styles.githubButton, (pressed || busy) && { opacity: 0.8 }]}
          >
            <View style={styles.githubMark}>
              <Text style={styles.githubMarkText}>GH</Text>
            </View>
            <Text style={styles.githubText}>{busy ? 'Opening GitHub…' : 'Continue with GitHub'}</Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={[type.small, styles.center, { marginTop: spacing.md }]}>
            We only use your GitHub account to sign you in.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.xl,
    paddingTop: 48,
    flexGrow: 1,
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: spacing.sm },
  center: { textAlign: 'center' },
  tagline: { fontSize: 15, marginTop: spacing.xs, marginBottom: spacing.xl, lineHeight: 21 },
  card: { padding: spacing.xl },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: '#24292F',
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  githubMark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  githubMarkText: { color: '#24292F', fontWeight: '900', fontSize: 11 },
  githubText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: colors.danger, marginTop: spacing.md, fontSize: 14, textAlign: 'center' },
});
