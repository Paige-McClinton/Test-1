import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { supabase } from '../lib/supabase';
import { Trip, TripDetails } from '../types';
import { newId } from '../utils';

const TABLE = 'trips';
/** Where trips were saved before Supabase; moved into your account on first sign-in. */
const LEGACY_STORAGE_KEY = '@travel-planner/trips/v1';
/** Wait this long after the last change before saving, so typing doesn't send a request per keystroke. */
const SAVE_DELAY_MS = 800;

type TripsContextValue = {
  trips: Trip[];
  loaded: boolean;
  syncError: string | null;
  saving: boolean;
  addTrip: (details: TripDetails) => string;
  updateTrip: (id: string, update: (trip: Trip) => Trip) => void;
  deleteTrip: (id: string) => void;
  /** Saves any pending changes right away (used before signing out). */
  flushNow: () => Promise<void>;
  reload: () => void;
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

const toRow = (trip: Trip, userId: string) => ({
  id: trip.id,
  user_id: userId,
  data: trip,
  updated_at: new Date().toISOString(),
});

export function TripsProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  const tripsRef = useRef(trips);
  tripsRef.current = trips;
  const dirty = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load this user's trips (and bring over any trips saved on this device before Supabase).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoaded(false);
      setSyncError(null);
      const { data, error } = await supabase.from(TABLE).select('id, data').order('created_at');
      if (cancelled) return;
      if (error) {
        setSyncError(`Couldn't load your trips: ${error.message}`);
        setLoaded(true);
        return;
      }
      let loadedTrips = (data ?? []).map((row) => normalize({ ...(row.data as Partial<Trip>), id: row.id as string }));

      if (loadedTrips.length === 0) {
        try {
          const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
          const parsed = legacy ? JSON.parse(legacy) : null;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const local = parsed.map(normalize);
            const { error: uploadError } = await supabase.from(TABLE).upsert(local.map((t) => toRow(t, userId)));
            if (!uploadError) {
              await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
              loadedTrips = local;
            }
          }
        } catch (err) {
          console.warn('Could not move saved trips into your account', err);
        }
      }

      if (!cancelled) {
        setTrips(loadedTrips);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, reloadCount]);

  const flushNow = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const ids = [...dirty.current];
    if (ids.length === 0) return;
    dirty.current.clear();
    const rows = ids
      .map((id) => tripsRef.current.find((t) => t.id === id))
      .filter((t): t is Trip => Boolean(t))
      .map((t) => toRow(t, userId));
    if (rows.length === 0) return;

    setSaving(true);
    const { error } = await supabase.from(TABLE).upsert(rows);
    setSaving(false);
    if (error) {
      ids.forEach((id) => dirty.current.add(id)); // try again with the next change
      setSyncError(`Couldn't save your changes: ${error.message}`);
    } else {
      setSyncError(null);
    }
  }, [userId]);

  const markDirty = useCallback(
    (id: string) => {
      dirty.current.add(id);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        flushNow();
      }, SAVE_DELAY_MS);
    },
    [flushNow],
  );

  // Save anything pending if this screen goes away.
  useEffect(
    () => () => {
      flushNow();
    },
    [flushNow],
  );

  const addTrip = useCallback(
    (details: TripDetails) => {
      const trip = normalize({ ...details, id: newId(), createdAt: Date.now() });
      setTrips((prev) => [...prev, trip]);
      markDirty(trip.id);
      return trip.id;
    },
    [markDirty],
  );

  const updateTrip = useCallback(
    (id: string, update: (trip: Trip) => Trip) => {
      setTrips((prev) => prev.map((t) => (t.id === id ? update(t) : t)));
      markDirty(id);
    },
    [markDirty],
  );

  const deleteTrip = useCallback((id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    dirty.current.delete(id);
    supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) setSyncError(`Couldn't delete the trip: ${error.message}`);
      });
  }, []);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  const value = useMemo(
    () => ({ trips, loaded, syncError, saving, addTrip, updateTrip, deleteTrip, flushNow, reload }),
    [trips, loaded, syncError, saving, addTrip, updateTrip, deleteTrip, flushNow, reload],
  );

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTrips must be used inside <TripsProvider>');
  return ctx;
}
