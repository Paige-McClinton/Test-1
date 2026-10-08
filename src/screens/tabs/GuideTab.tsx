import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, ChipGroup, EmptyState, Fab, FormModal, TextField } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme';
import { GUIDE_CATEGORIES, GuideCategory, GuideEntry } from '../../types';
import { newId } from '../../utils';
import type { TabProps } from '../TripDetailScreen';

const CATEGORY_ICONS: Record<GuideCategory, string> = {
  'Must-see': '⭐️',
  'Food & drink': '🍜',
  'Getting around': '🚇',
  Tips: '💡',
};

type Draft = { id?: string; category: GuideCategory; title: string; details: string };

export function GuideTab({ trip, update }: TabProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [titleError, setTitleError] = useState<string>();

  const openNew = () => {
    setTitleError(undefined);
    setDraft({ category: 'Must-see', title: '', details: '' });
  };

  const save = () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      setTitleError('Add a short title.');
      return;
    }
    const entry: GuideEntry = {
      id: draft.id ?? newId(),
      category: draft.category,
      title: draft.title.trim(),
      details: draft.details.trim(),
    };
    update((t) => ({
      ...t,
      guide: draft.id ? t.guide.map((g) => (g.id === draft.id ? entry : g)) : [...t.guide, entry],
    }));
    setDraft(null);
  };

  const remove = () => {
    if (!draft?.id) return;
    const id = draft.id;
    update((t) => ({ ...t, guide: t.guide.filter((g) => g.id !== id) }));
    setDraft(null);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={[type.heading, { marginBottom: spacing.xs }]}>About {trip.destination}</Text>
          <Text style={[type.small, { marginBottom: spacing.sm }]}>
            Your overview: neighbourhoods, weather, currency, language, emergency numbers…
          </Text>
          <TextInput
            value={trip.notes}
            onChangeText={(notes) => update((t) => ({ ...t, notes }))}
            multiline
            placeholder="Write anything you want to remember about this place."
            placeholderTextColor={colors.faint}
            style={styles.overview}
          />
        </Card>

        {trip.guide.length === 0 ? (
          <EmptyState
            icon="📖"
            title="Build your guide"
            message="Save must-see spots, places to eat, how to get around, and local tips as you research."
          />
        ) : (
          GUIDE_CATEGORIES.map((cat) => {
            const entries = trip.guide.filter((g) => g.category === cat);
            if (entries.length === 0) return null;
            return (
              <View key={cat} style={{ marginBottom: spacing.sm }}>
                <Text style={styles.sectionTitle}>
                  {CATEGORY_ICONS[cat]} {cat}
                </Text>
                {entries.map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => {
                      setTitleError(undefined);
                      setDraft({ ...entry });
                    }}
                    style={({ pressed }) => pressed && { opacity: 0.8 }}
                  >
                    <Card style={styles.entryCard}>
                      <Text style={styles.entryTitle}>{entry.title}</Text>
                      {entry.details ? <Text style={styles.entryDetails}>{entry.details}</Text> : null}
                    </Card>
                  </Pressable>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      <Fab label="Guide note" onPress={openNew} />

      <FormModal
        visible={draft !== null}
        title={draft?.id ? 'Edit guide note' : 'New guide note'}
        onClose={() => setDraft(null)}
        onSave={save}
        onDelete={draft?.id ? remove : undefined}
      >
        {draft ? (
          <>
            <ChipGroup
              label="Type"
              options={GUIDE_CATEGORIES}
              value={draft.category}
              onChange={(category) => setDraft({ ...draft, category })}
            />
            <TextField
              label="Title"
              value={draft.title}
              onChangeText={(title) => setDraft({ ...draft, title })}
              placeholder="Belém Tower"
              error={titleError}
            />
            <TextField
              label="Details (optional)"
              value={draft.details}
              onChangeText={(details) => setDraft({ ...draft, details })}
              placeholder="Opening hours, prices, why it's worth it, links…"
              multiline
            />
          </>
        ) : null}
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 120 },
  overview: {
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  sectionTitle: { ...type.heading, fontSize: 16, marginBottom: spacing.sm, marginTop: spacing.sm },
  entryCard: { borderLeftWidth: 4, borderLeftColor: colors.accent, marginBottom: spacing.sm },
  entryTitle: { ...type.body, fontWeight: '700' },
  entryDetails: { ...type.small, fontSize: 14, marginTop: 4, lineHeight: 20 },
});
