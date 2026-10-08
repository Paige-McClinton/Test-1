import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TripFormModal } from '../components/TripFormModal';
import { useTrips } from '../state/TripsContext';
import { colors, radius, spacing, type } from '../theme';
import { Trip } from '../types';
import { formatRange, tripStatus } from '../utils';
import { BudgetTab } from './tabs/BudgetTab';
import { GuideTab } from './tabs/GuideTab';
import { ItineraryTab } from './tabs/ItineraryTab';
import { PackingTab } from './tabs/PackingTab';

const TABS = [
  { key: 'itinerary', label: 'Itinerary', icon: '🗓' },
  { key: 'budget', label: 'Budget', icon: '💰' },
  { key: 'packing', label: 'Packing', icon: '🎒' },
  { key: 'guide', label: 'Guide', icon: '📖' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export type TabProps = {
  trip: Trip;
  update: (fn: (trip: Trip) => Trip) => void;
};

export function TripDetailScreen({ tripId, onBack }: { tripId: string; onBack: () => void }) {
  const { trips, updateTrip, deleteTrip } = useTrips();
  const trip = trips.find((t) => t.id === tripId);
  const [tab, setTab] = useState<TabKey>('itinerary');
  const [editing, setEditing] = useState(false);

  // If the trip disappears (e.g. it was deleted), go back to the list.
  useEffect(() => {
    if (!trip) onBack();
  }, [trip, onBack]);

  if (!trip) return null;

  const update = (fn: (t: Trip) => Trip) => updateTrip(trip.id, fn);

  const confirmDelete = () => {
    Alert.alert('Delete trip?', `“${trip.name}” and everything in it will be removed. This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setEditing(false);
          deleteTrip(trip.id);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to trips">
            <Text style={styles.headerLink}>‹ Trips</Text>
          </Pressable>
          <Pressable onPress={() => setEditing(true)} hitSlop={12} accessibilityRole="button">
            <Text style={styles.headerLink}>Edit</Text>
          </Pressable>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {trip.name}
        </Text>
        <Text style={styles.subtitle}>📍 {trip.destination}</Text>
        <Text style={styles.subtitle}>
          {formatRange(trip.startDate, trip.endDate)} · {tripStatus(trip.startDate, trip.endDate)}
        </Text>

        <View style={styles.tabBar}>
          {TABS.map((t) => {
            const selected = t.key === tab;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={styles.tabIcon}>{t.icon}</Text>
                <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'itinerary' && <ItineraryTab trip={trip} update={update} />}
        {tab === 'budget' && <BudgetTab trip={trip} update={update} />}
        {tab === 'packing' && <PackingTab trip={trip} update={update} />}
        {tab === 'guide' && <GuideTab trip={trip} update={update} />}
      </View>

      <TripFormModal
        visible={editing}
        trip={trip}
        onClose={() => setEditing(false)}
        onDelete={confirmDelete}
        onSave={(details) => {
          update((t) => ({ ...t, ...details }));
          setEditing(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  headerLink: { color: '#fff', fontSize: 16, fontWeight: '600' },
  title: { ...type.title, color: '#fff', fontSize: 26 },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: radius.md,
    padding: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.sm },
  tabSelected: { backgroundColor: '#fff' },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontSize: 12, fontWeight: '700', color: '#fff', marginTop: 2 },
  tabLabelSelected: { color: colors.primaryDark },
});
