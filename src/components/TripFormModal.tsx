import React, { useEffect, useState } from 'react';

import { Trip, TripDetails } from '../types';
import { CURRENCIES, parseAmount, parseISODate } from '../utils';
import { ChipGroup, FormModal, TextField } from './ui';

type Props = {
  visible: boolean;
  trip?: Trip; // present when editing
  onClose: () => void;
  onSave: (details: TripDetails) => void;
  onDelete?: () => void;
};

type Errors = Partial<Record<'name' | 'destination' | 'startDate' | 'endDate' | 'budget', string>>;

export function TripFormModal({ visible, trip, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('CAD');
  const [errors, setErrors] = useState<Errors>({});

  // Reset the form each time it opens.
  useEffect(() => {
    if (!visible) return;
    setName(trip?.name ?? '');
    setDestination(trip?.destination ?? '');
    setStartDate(trip?.startDate ?? '');
    setEndDate(trip?.endDate ?? '');
    setBudget(trip && trip.budget > 0 ? String(trip.budget) : '');
    setCurrency(trip?.currency ?? 'CAD');
    setErrors({});
  }, [visible, trip]);

  const handleSave = () => {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Give your trip a name.';
    if (!destination.trim()) next.destination = 'Where are you going?';
    const start = parseISODate(startDate);
    const end = parseISODate(endDate);
    if (!start) next.startDate = 'Use the format YYYY-MM-DD.';
    if (!end) next.endDate = 'Use the format YYYY-MM-DD.';
    if (start && end && end < start) next.endDate = 'End date must be on or after the start date.';
    const budgetValue = budget.trim() ? parseAmount(budget) : 0;
    if (budgetValue === null) next.budget = 'Enter a number, like 1500.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      name: name.trim(),
      destination: destination.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      budget: budgetValue ?? 0,
      currency,
    });
  };

  return (
    <FormModal
      visible={visible}
      title={trip ? 'Edit trip' : 'New trip'}
      onClose={onClose}
      onSave={handleSave}
      onDelete={onDelete}
    >
      <TextField label="Trip name" value={name} onChangeText={setName} placeholder="Summer in Portugal" error={errors.name} />
      <TextField
        label="Destination"
        value={destination}
        onChangeText={setDestination}
        placeholder="Lisbon, Portugal"
        error={errors.destination}
      />
      <TextField
        label="Start date"
        value={startDate}
        onChangeText={setStartDate}
        placeholder="2026-07-14"
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        error={errors.startDate}
      />
      <TextField
        label="End date"
        value={endDate}
        onChangeText={setEndDate}
        placeholder="2026-07-24"
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        error={errors.endDate}
      />
      <TextField
        label="Budget (optional)"
        value={budget}
        onChangeText={setBudget}
        placeholder="2500"
        keyboardType="decimal-pad"
        error={errors.budget}
      />
      <ChipGroup label="Currency" options={CURRENCIES} value={currency} onChange={setCurrency} />
    </FormModal>
  );
}
