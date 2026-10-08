import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TripFormModal } from '../components/TripFormModal';
import { Card, EmptyState, Fab, ProgressBar } from '../components/ui';
import { useAuth } from '../state/AuthContext';
import { useTrips } from '../state/TripsContext';
import { colors, radius, spacing, type } from '../theme';
import { Trip } from '../types';
import { formatMoney, formatRange, todayISO, tripStatus } from '../utils';

export function TripListScreen({ onOpenTrip }: { onOpenTrip: (id: string) => void }) {
  const { trips, addTrip, syncError, saving, flushNow, reload } = useTrips();
  const { session, signOut } = useAuth();
  const [creating, setCreating] = useState(false);

  const handleSignOut = async () => {
    await flushNow();
    await signOut();
  };

  // Upcoming and current trips first (soonest first), then past trips (most recent first).
  const sorted = useMemo(() => {
    const today = todayISO();
    const active = trips.filter((t) => t.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));
    const past = trips.filter((t) => t.endDate < today).sort((a, b) => b.endDate.localeCompare(a.endDate));
    return [...active, ...past];
  }, [trips]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={sorted}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.eyebrow}>Travel Planner</Text>
              <Pressable onPress={handleSignOut} hitSlop={10} accessibilityRole="button">
                <Text style={styles.signOut}>Sign out</Text>
              </Pressable>
            </View>
            <Text style={type.title}>My trips</Text>
            <Text style={styles.account} numberOfLines={1}>
              {session?.user.email}
              {saving ? ' · Saving…' : ''}
            </Text>
            {syncError ? (
              <Pressable onPress={reload} style={styles.errorBanner}>
                <Text style={styles.errorText}>{syncError}</Text>
                <Text style={styles.errorRetry}>Tap to reload</Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="🧳"
            title="No trips yet"
            message="Tap “New trip” to start planning your itinerary, budget, packing list and destination guide."
          />
        }
        renderItem={({ item }) => <TripCard trip={item} onPress={() => onOpenTrip(item.id)} />}
      />
      <Fab label="New trip" onPress={() => setCreating(true)} />
      <TripFormModal
        visible={creating}
        onClose={() => setCreating(false)}
        onSave={(details) => {
          const id = addTrip(details);
          setCreating(false);
          onOpenTrip(id);
        }}
      />
    </SafeAreaView>
  );
}

function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const status = tripStatus(trip.startDate, trip.endDate);
  const spent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const packed = trip.packing.filter((p) => p.packed).length;
  const isPast = status === 'Completed';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      <Card style={isPast && styles.pastCard}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={type.heading} numberOfLines={1}>
              {trip.name}
            </Text>
            <Text style={styles.destination} numberOfLines={1}>
              📍 {trip.destination}
            </Text>
          </View>
          <View style={[styles.badge, isPast && styles.badgePast]}>
            <Text style={[styles.badgeText, isPast && styles.badgeTextPast]}>{status}</Text>
          </View>
        </View>
        <Text style={styles.dates}>{formatRange(trip.startDate, trip.endDate)}</Text>

        {trip.budget > 0 ? (
          <View style={styles.budgetRow}>
            <View style={styles.budgetLabels}>
              <Text style={type.small}>Spent {formatMoney(spent, trip.currency)}</Text>
              <Text style={type.small}>of {formatMoney(trip.budget, trip.currency)}</Text>
            </View>
            <ProgressBar value={spent / trip.budget} color={spent > trip.budget ? colors.danger : colors.primary} />
          </View>
        ) : null}

        <View style={styles.stats}>
          <Text style={styles.stat}>🗓 {trip.itinerary.length} plans</Text>
          <Text style={styles.stat}>
            🎒 {packed}/{trip.packing.length} packed
          </Text>
          <Text style={styles.stat}>📖 {trip.guide.length} notes</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 120 },
  header: { marginBottom: spacing.lg, marginTop: spacing.sm },
  eyebrow: { ...type.label, color: colors.primary, marginBottom: 2 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  signOut: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  account: { ...type.small, marginTop: 2 },
  errorBanner: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  errorText: { color: colors.danger, fontSize: 14 },
  errorRetry: { color: colors.danger, fontWeight: '700', fontSize: 13, marginTop: 4 },
  pastCard: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  destination: { ...type.small, fontSize: 14, marginTop: 2 },
  dates: { ...type.body, marginTop: spacing.sm, fontWeight: '600' },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgePast: { backgroundColor: colors.border },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  badgeTextPast: { color: colors.muted },
  budgetRow: { marginTop: spacing.md },
  budgetLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  stats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  stat: { ...type.small },
});
