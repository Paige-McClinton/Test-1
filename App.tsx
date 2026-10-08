import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TripDetailScreen } from './src/screens/TripDetailScreen';
import { TripListScreen } from './src/screens/TripListScreen';
import { TripsProvider, useTrips } from './src/state/TripsContext';
import { colors } from './src/theme';

type Route = { name: 'list' } | { name: 'trip'; tripId: string };

function Root() {
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

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

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

export default function App() {
  return (
    <SafeAreaProvider>
      <TripsProvider>
        <Root />
      </TripsProvider>
    </SafeAreaProvider>
  );
}
