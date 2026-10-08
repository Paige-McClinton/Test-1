import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { confirmAction } from '../../confirm';
import { Button, Card, ChipGroup, EmptyState, Fab, FormModal, ProgressBar, TextField } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme';
import { PACKING_CATEGORIES, PackingCategory, PackingItem } from '../../types';
import { newId } from '../../utils';
import type { TabProps } from '../TripDetailScreen';

const STARTER_LIST: [string, PackingCategory][] = [
  ['Passport / ID', 'Documents'],
  ['Travel insurance info', 'Documents'],
  ['Boarding passes & bookings', 'Documents'],
  ['T-shirts', 'Clothing'],
  ['Pants / shorts', 'Clothing'],
  ['Underwear & socks', 'Clothing'],
  ['Comfortable walking shoes', 'Clothing'],
  ['Jacket or sweater', 'Clothing'],
  ['Toothbrush & toothpaste', 'Toiletries'],
  ['Shampoo & body wash', 'Toiletries'],
  ['Medications', 'Toiletries'],
  ['Sunscreen', 'Toiletries'],
  ['Phone charger', 'Electronics'],
  ['Power adapter', 'Electronics'],
  ['Headphones', 'Electronics'],
  ['Reusable water bottle', 'Other'],
];

export function PackingTab({ trip, update }: TabProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PackingCategory>('Clothing');
  const [error, setError] = useState<string>();

  const packedCount = trip.packing.filter((p) => p.packed).length;
  const total = trip.packing.length;

  const toggle = (id: string) =>
    update((t) => ({ ...t, packing: t.packing.map((p) => (p.id === id ? { ...p, packed: !p.packed } : p)) }));

  const confirmRemove = (item: PackingItem) =>
    confirmAction('Remove item?', `Remove “${item.name}” from your packing list?`, 'Remove', () =>
      update((t) => ({ ...t, packing: t.packing.filter((p) => p.id !== item.id) })),
    );

  const addStarterList = () =>
    update((t) => {
      const existing = new Set(t.packing.map((p) => p.name.toLowerCase()));
      const additions = STARTER_LIST.filter(([n]) => !existing.has(n.toLowerCase())).map(
        ([n, c]): PackingItem => ({ id: newId(), name: n, category: c, packed: false }),
      );
      return { ...t, packing: [...t.packing, ...additions] };
    });

  const save = (keepOpen: boolean) => {
    if (!name.trim()) {
      setError('What do you need to pack?');
      return;
    }
    const item: PackingItem = { id: newId(), name: name.trim(), category, packed: false };
    update((t) => ({ ...t, packing: [...t.packing, item] }));
    setName('');
    setError(undefined);
    if (!keepOpen) setAdding(false);
  };

  const resetAll = () =>
    confirmAction('Unpack everything?', 'This unchecks every item — handy for the trip home.', 'Uncheck all', () =>
      update((t) => ({ ...t, packing: t.packing.map((p) => ({ ...p, packed: false })) })),
    false);

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        {total === 0 ? (
          <>
            <EmptyState icon="🎒" title="Nothing on your list yet" message="Add items one by one, or start with a list of travel essentials." />
            <Button title="Add essentials list" variant="secondary" onPress={addStarterList} />
          </>
        ) : (
          <>
            <Card>
              <View style={styles.progressHeader}>
                <Text style={type.heading}>
                  {packedCount === total ? 'All packed! 🎉' : `${packedCount} of ${total} packed`}
                </Text>
                {packedCount > 0 ? (
                  <Pressable onPress={resetAll} hitSlop={8}>
                    <Text style={styles.link}>Reset</Text>
                  </Pressable>
                ) : null}
              </View>
              <ProgressBar value={packedCount / total} color={packedCount === total ? colors.success : colors.primary} />
            </Card>

            {PACKING_CATEGORIES.map((cat) => {
              const items = trip.packing.filter((p) => p.category === cat);
              if (items.length === 0) return null;
              return (
                <Card key={cat}>
                  <Text style={[type.label, { marginBottom: spacing.xs }]}>{cat}</Text>
                  {items.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => toggle(item.id)}
                      onLongPress={() => confirmRemove(item)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: item.packed }}
                      style={styles.item}
                    >
                      <View style={[styles.checkbox, item.packed && styles.checkboxOn]}>
                        {item.packed ? <Text style={styles.check}>✓</Text> : null}
                      </View>
                      <Text style={[type.body, { flex: 1 }, item.packed && styles.itemPacked]}>{item.name}</Text>
                    </Pressable>
                  ))}
                </Card>
              );
            })}
            <Text style={styles.hint}>Tap to check off · press and hold to remove</Text>
          </>
        )}
      </ScrollView>

      <Fab
        label="Item"
        onPress={() => {
          setName('');
          setError(undefined);
          setAdding(true);
        }}
      />

      <FormModal visible={adding} title="Add to packing list" onClose={() => setAdding(false)} onSave={() => save(false)}>
        <TextField
          label="Item"
          value={name}
          onChangeText={setName}
          placeholder="Swimsuit"
          error={error}
          returnKeyType="done"
          onSubmitEditing={() => save(true)}
          hint="Press return to add and keep going."
          autoFocus
          blurOnSubmit={false}
        />
        <ChipGroup label="Category" options={PACKING_CATEGORIES} value={category} onChange={setCategory} />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 120 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  link: { color: colors.primary, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm - 2,
    borderWidth: 2,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.success, borderColor: colors.success },
  check: { color: '#fff', fontWeight: '900', fontSize: 14 },
  itemPacked: { color: colors.faint, textDecorationLine: 'line-through' },
  hint: { ...type.small, textAlign: 'center', marginTop: spacing.sm },
});
