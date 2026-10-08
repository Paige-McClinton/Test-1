import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Trip, TripDetails } from '../types';
import { newId } from '../utils';

const STORAGE_KEY = '@travel-planner/trips/v1';

type TripsContextValue = {
  trips: Trip[];
  loaded: boolean;
  addTrip: (details: TripDetails) => string;
  updateTrip: (id: string, update: (trip: Trip) => Trip) => void;
  deleteTrip: (id: string) => void;
};

const TripsContext = createContext<TripsContextValue | null>(null);

/** Fills in any fields missing from older saved data so the app never crashes on load. */
function normalize(raw: Partial<Trip>): Trip {
  return {
    id: raw.id ?? newId(),
    name: raw.name ?? 'Untitled trip',
    destination: raw.destination ?? '',
    startDate: raw.startDate ?? '',
    endDate: raw.endDate ?? '',
    budget: typeof raw.budget === 'number' ? raw.budget : 0,
    currency: raw.currency ?? 'CAD',
    notes: raw.notes ?? '',
    itinerary: raw.itinerary ?? [],
    expenses: raw.expenses ?? [],
    packing: raw.packing ?? [],
    guide: raw.guide ?? [],
    createdAt: raw.createdAt ?? Date.now(),
  };
}

export function TripsProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setTrips(parsed.map(normalize));
        }
      } catch (err) {
        console.warn('Could not load saved trips', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips)).catch((err) =>
      console.warn('Could not save trips', err),
    );
  }, [trips, loaded]);

  const addTrip = useCallback((details: TripDetails) => {
    const trip = normalize({ ...details, id: newId(), createdAt: Date.now() });
    setTrips((prev) => [...prev, trip]);
    return trip.id;
  }, []);

  const updateTrip = useCallback((id: string, update: (trip: Trip) => Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? update(t) : t)));
  }, []);

  const deleteTrip = useCallback((id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ trips, loaded, addTrip, updateTrip, deleteTrip }),
    [trips, loaded, addTrip, updateTrip, deleteTrip],
  );

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTrips must be used inside <TripsProvider>');
  return ctx;
}
