import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, FormModal, TextField } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme';
import { ItineraryItem } from '../../types';
import { datesInRange, formatDay, formatTime, newId, normalizeTime, parseISODate } from '../../utils';
import type { TabProps } from '../TripDetailScreen';

type Draft = { id?: string; date: string; time: string; title: string; location: string; notes: string };

const byTime = (a: ItineraryItem, b: ItineraryItem) => {
  // Untimed items go after timed ones.
  if (!a.time && b.time) return 1;
  if (a.time && !b.time) return -1;
  return a.time.localeCompare(b.time);
};

export function ItineraryTab({ trip, update }: TabProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<{ title?: string; time?: string; date?: string }>({});

  const days = useMemo(() => datesInRange(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
  const dayset = useMemo(() => new Set(days), [days]);
  // Plans whose date falls outside the trip (e.g. after the dates were edited).
  const otherItems = trip.itinerary.filter((i) => !dayset.has(i.date)).sort((a, b) => a.date.localeCompare(b.date) || byTime(a, b));

  const openNew = (date: string) => {
    setErrors({});
    setDraft({ date, time: '', title: '', location: '', notes: '' });
  };
  const openEdit = (item: ItineraryItem) => {
    setErrors({});
    setDraft({ ...item, time: item.time });
  };

  const save = () => {
    if (!draft) return;
    const time = normalizeTime(draft.time);
    const next: typeof errors = {};
    if (!draft.title.trim()) next.title = 'What are you doing?';
    if (time === null) next.time = 'Use a time like 9:30 or 14:00.';
    if (!parseISODate(draft.date)) next.date = 'Use the format YYYY-MM-DD.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const item: ItineraryItem = {
      id: draft.id ?? newId(),
      date: draft.date.trim(),
      time: time ?? '',
      title: draft.title.trim(),
      location: draft.location.trim(),
      notes: draft.notes.trim(),
    };
    update((t) => ({
      ...t,
      itinerary: draft.id ? t.itinerary.map((i) => (i.id === draft.id ? item : i)) : [...t.itinerary, item],
    }));
    setDraft(null);
  };

  const remove = () => {
    if (!draft?.id) return;
    const id = draft.id;
    update((t) => ({ ...t, itinerary: t.itinerary.filter((i) => i.id !== id) }));
    setDraft(null);
  };

  if (days.length === 0) {
    return (
      <EmptyState icon="📅" title="Check your trip dates" message="Edit the trip and set valid start and end dates to plan each day." />
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        {days.map((date, index) => {
          const items = trip.itinerary.filter((i) => i.date === date).sort(byTime);
          return (
            <Card key={date}>
              <View style={styles.dayHeader}>
                <View>
                  <Text style={styles.dayNumber}>Day {index + 1}</Text>
                  <Text style={type.heading}>{formatDay(date)}</Text>
                </View>
                <Pressable onPress={() => openNew(date)} style={styles.addButton} accessibilityRole="button" accessibilityLabel={`Add plan for day ${index + 1}`}>
                  <Text style={styles.addButtonText}>＋ Add</Text>
                </Pressable>
              </View>
              {items.length === 0 ? (
                <Text style={styles.nothing}>Nothing planned yet.</Text>
              ) : (
                items.map((item) => <PlanRow key={item.id} item={item} onPress={() => openEdit(item)} />)
              )}
            </Card>
          );
        })}

        {otherItems.length > 0 ? (
          <Card>
            <Text style={type.heading}>Outside trip dates</Text>
            <Text style={[type.small, { marginBottom: spacing.sm }]}>Tap a plan to move it to a new date.</Text>
            {otherItems.map((item) => (
              <PlanRow key={item.id} item={item} showDate onPress={() => openEdit(item)} />
            ))}
          </Card>
        ) : null}
      </ScrollView>

      <FormModal
        visible={draft !== null}
        title={draft?.id ? 'Edit plan' : 'New plan'}
        onClose={() => setDraft(null)}
        onSave={save}
        onDelete={draft?.id ? remove : undefined}
      >
        {draft ? (
          <>
            <TextField
              label="What"
              value={draft.title}
              onChangeText={(title) => setDraft({ ...draft, title })}
              placeholder="Walking tour of Alfama"
              error={errors.title}
            />
            <TextField
              label="Date"
              value={draft.date}
              onChangeText={(date) => setDraft({ ...draft, date })}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              error={errors.date}
              hint={parseISODate(draft.date) ? formatDay(draft.date) : undefined}
            />
            <TextField
              label="Time (optional)"
              value={draft.time}
              onChangeText={(time) => setDraft({ ...draft, time })}
              placeholder="9:30 or 14:00"
              keyboardType="numbers-and-punctuation"
              error={errors.time}
            />
            <TextField
              label="Where (optional)"
              value={draft.location}
              onChangeText={(location) => setDraft({ ...draft, location })}
              placeholder="Largo das Portas do Sol"
            />
            <TextField
              label="Notes (optional)"
              value={draft.notes}
              onChangeText={(notes) => setDraft({ ...draft, notes })}
              placeholder="Booking number, what to bring…"
              multiline
            />
          </>
        ) : null}
      </FormModal>
    </>
  );
}

function PlanRow({ item, onPress, showDate }: { item: ItineraryItem; onPress: () => void; showDate?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.plan, pressed && { opacity: 0.7 }]}>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{item.time ? formatTime(item.time) : 'Anytime'}</Text>
      </View>
      <View style={styles.planBody}>
        <Text style={styles.planTitle}>{item.title}</Text>
        {showDate ? <Text style={type.small}>{formatDay(item.date)}</Text> : null}
        {item.location ? <Text style={type.small}>📍 {item.location}</Text> : null}
        {item.notes ? (
          <Text style={[type.small, styles.planNotes]} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 48 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  dayNumber: { ...type.label, color: colors.primary },
  addButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  nothing: { ...type.small, fontStyle: 'italic', paddingVertical: spacing.xs },
  plan: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  timeCol: { width: 78 },
  time: { fontSize: 13, fontWeight: '700', color: colors.primaryDark, marginTop: 1 },
  planBody: { flex: 1, gap: 2 },
  planTitle: { ...type.body, fontWeight: '600' },
  planNotes: { marginTop: 2 },
});
