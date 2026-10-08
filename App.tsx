import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { supabaseConfigured } from './src/lib/supabase';
import { AuthScreen } from './src/screens/AuthScreen';
import { TripDetailScreen } from './src/screens/TripDetailScreen';
import { TripListScreen } from './src/screens/TripListScreen';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { TripsProvider, useTrips } from './src/state/TripsContext';
import { colors, spacing, type } from './src/theme';

type Route = { name: 'list' } | { name: 'trip'; tripId: string };

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

function SetupNeeded() {
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: 80 }} style={{ backgroundColor: colors.background }}>
      <Text style={type.title}>Connect Supabase</Text>
      <Text style={[type.body, { marginTop: spacing.md, lineHeight: 22 }]}>
        Create a file called .env.local in the project folder with your Supabase project URL and anon key (see
        .env.example), then stop the app with Ctrl + C and start it again.
      </Text>
    </ScrollView>
  );
}

function Main() {
  const { loaded } = useTrips();
  const [route, setRoute] = useState<Route>({ name: 'list' });
  const goHome = useCallback(() => setRoute({ name: 'list' }), []);

  // Android hardware back button returns to the trip list.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'trip') {
        goHome();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [route, goHome]);

  if (!loaded) return <Loading />;

  return (
    <>
      <StatusBar style={route.name === 'trip' ? 'light' : 'dark'} />
      {route.name === 'trip' ? (
        <TripDetailScreen tripId={route.tripId} onBack={goHome} />
      ) : (
        <TripListScreen onOpenTrip={(tripId) => setRoute({ name: 'trip', tripId })} />
      )}
    </>
  );
}

function Root() {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (!session) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen />
      </>
    );
  }
  // Keyed by user so switching accounts starts fresh.
  return (
    <TripsProvider key={session.user.id} userId={session.user.id}>
      <Main />
    </TripsProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      {supabaseConfigured ? (
        <AuthProvider>
          <Root />
        </AuthProvider>
      ) : (
        <SetupNeeded />
      )}
    </SafeAreaProvider>
  );
}
