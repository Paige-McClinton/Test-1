import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, ChipGroup, EmptyState, Fab, FormModal, ProgressBar, TextField } from '../../components/ui';
import { colors, spacing, type } from '../../theme';
import { EXPENSE_CATEGORIES, Expense, ExpenseCategory } from '../../types';
import { formatDay, formatMoney, newId, parseAmount, parseISODate, todayISO } from '../../utils';
import type { TabProps } from '../TripDetailScreen';

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Transport: '✈️',
  Lodging: '🏨',
  Food: '🍽',
  Activities: '🎟',
  Shopping: '🛍',
  Other: '📌',
};

type Draft = { id?: string; description: string; amount: string; category: ExpenseCategory; date: string };

export function BudgetTab({ trip, update }: TabProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<{ description?: string; amount?: string; date?: string }>({});
  const money = (n: number) => formatMoney(n, trip.currency);

  const spent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = trip.budget - spent;
  const over = trip.budget > 0 && remaining < 0;

  const byCategory = useMemo(() => {
    const totals = new Map<ExpenseCategory, number>();
    trip.expenses.forEach((e) => totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [trip.expenses]);

  const expenses = useMemo(
    () => [...trip.expenses].sort((a, b) => b.date.localeCompare(a.date)),
    [trip.expenses],
  );

  const openNew = () => {
    const today = todayISO();
    // Default to today during the trip, otherwise the first day of the trip.
    const date = today >= trip.startDate && today <= trip.endDate ? today : trip.startDate || today;
    setErrors({});
    setDraft({ description: '', amount: '', category: 'Food', date });
  };

  const openEdit = (e: Expense) => {
    setErrors({});
    setDraft({ ...e, amount: String(e.amount) });
  };

  const save = () => {
    if (!draft) return;
    const amount = parseAmount(draft.amount);
    const next: typeof errors = {};
    if (!draft.description.trim()) next.description = 'What was it for?';
    if (amount === null || amount === 0) next.amount = 'Enter an amount, like 24.50.';
    if (!parseISODate(draft.date)) next.date = 'Use the format YYYY-MM-DD.';
    setErrors(next);
    if (Object.keys(next).length || amount === null) return;

    const expense: Expense = {
      id: draft.id ?? newId(),
      description: draft.description.trim(),
      amount,
      category: draft.category,
      date: draft.date.trim(),
    };
    update((t) => ({
      ...t,
      expenses: draft.id ? t.expenses.map((e) => (e.id === draft.id ? expense : e)) : [...t.expenses, expense],
    }));
    setDraft(null);
  };

  const remove = () => {
    if (!draft?.id) return;
    const id = draft.id;
    update((t) => ({ ...t, expenses: t.expenses.filter((e) => e.id !== id) }));
    setDraft(null);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={type.label}>Spent so far</Text>
          <Text style={[styles.bigNumber, over && { color: colors.danger }]}>{money(spent)}</Text>
          {trip.budget > 0 ? (
            <>
              <ProgressBar value={spent / trip.budget} color={over ? colors.danger : colors.primary} />
              <View style={styles.summaryRow}>
                <Text style={type.small}>Budget {money(trip.budget)}</Text>
                <Text style={[styles.remaining, over && { color: colors.danger }]}>
                  {over ? `${money(-remaining)} over` : `${money(remaining)} left`}
                </Text>
              </View>
            </>
          ) : (
            <Text style={type.small}>Tip: add a budget by tapping Edit at the top.</Text>
          )}
        </Card>

        {byCategory.length > 0 ? (
          <Card>
            <Text style={[type.heading, { marginBottom: spacing.sm }]}>By category</Text>
            {byCategory.map(([category, total]) => (
              <View key={category} style={styles.categoryRow}>
                <View style={styles.categoryLabels}>
                  <Text style={type.body}>
                    {CATEGORY_ICONS[category]} {category}
                  </Text>
                  <Text style={styles.categoryAmount}>{money(total)}</Text>
                </View>
                <ProgressBar value={spent > 0 ? total / spent : 0} color={colors.accent} />
              </View>
            ))}
          </Card>
        ) : null}

        {expenses.length === 0 ? (
          <EmptyState icon="💰" title="No expenses yet" message="Log what you spend so you can see where your money goes." />
        ) : (
          <Card>
            <Text style={[type.heading, { marginBottom: spacing.xs }]}>Expenses</Text>
            {expenses.map((e) => (
              <Pressable key={e.id} onPress={() => openEdit(e)} style={({ pressed }) => [styles.expense, pressed && { opacity: 0.7 }]}>
                <Text style={styles.expenseIcon}>{CATEGORY_ICONS[e.category]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>{e.description}</Text>
                  <Text style={type.small}>
                    {formatDay(e.date)} · {e.category}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>{money(e.amount)}</Text>
              </Pressable>
            ))}
          </Card>
        )}
      </ScrollView>

      <Fab label="Expense" onPress={openNew} />

      <FormModal
        visible={draft !== null}
        title={draft?.id ? 'Edit expense' : 'New expense'}
        onClose={() => setDraft(null)}
        onSave={save}
        onDelete={draft?.id ? remove : undefined}
      >
        {draft ? (
          <>
            <TextField
              label="Description"
              value={draft.description}
              onChangeText={(description) => setDraft({ ...draft, description })}
              placeholder="Dinner at Time Out Market"
              error={errors.description}
            />
            <TextField
              label={`Amount (${trip.currency})`}
              value={draft.amount}
              onChangeText={(amount) => setDraft({ ...draft, amount })}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.amount}
            />
            <ChipGroup
              label="Category"
              options={EXPENSE_CATEGORIES}
              value={draft.category}
              onChange={(category) => setDraft({ ...draft, category })}
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
          </>
        ) : null}
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 120 },
  bigNumber: { fontSize: 34, fontWeight: '800', color: colors.text, marginVertical: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  remaining: { fontSize: 14, fontWeight: '700', color: colors.success },
  categoryRow: { marginBottom: spacing.md },
  categoryLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  categoryAmount: { ...type.body, fontWeight: '700' },
  expense: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  expenseIcon: { fontSize: 22 },
  expenseAmount: { ...type.body, fontWeight: '700' },
});
