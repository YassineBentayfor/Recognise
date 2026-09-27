import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type EventName = 'investigation_started' | 'investigation_completed' | 'evidence_viewed' | 'transaction_recognized' | 'card_frozen' | 'card_unfrozen' | 'dispute_started' | 'support_requested';

export type ProductEvent = {
  id: string;
  name: EventName;
  transactionId: string;
  createdAt: string;
};

type AppStateValue = {
  cardFrozen: boolean;
  recognizedIds: string[];
  events: ProductEvent[];
  setCardFrozen: (frozen: boolean, transactionId: string) => void;
  recognize: (transactionId: string) => void;
  track: (name: EventName, transactionId: string) => void;
  resetDemo: () => void;
};

const STORAGE_KEY = 'trace-demo-state-v1';
const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [cardFrozen, updateCardFrozen] = useState(false);
  const [recognizedIds, setRecognizedIds] = useState<string[]>([]);
  const [events, setEvents] = useState<ProductEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        const parsed = JSON.parse(value) as Pick<AppStateValue, 'cardFrozen' | 'recognizedIds' | 'events'>;
        updateCardFrozen(Boolean(parsed.cardFrozen));
        setRecognizedIds(parsed.recognizedIds ?? []);
        setEvents(parsed.events ?? []);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ cardFrozen, recognizedIds, events })).catch(() => undefined);
  }, [cardFrozen, events, hydrated, recognizedIds]);

  const track = useCallback((name: EventName, transactionId: string) => {
    setEvents((current) => [
      { id: `${Date.now()}-${name}`, name, transactionId, createdAt: new Date().toISOString() },
      ...current,
    ].slice(0, 30));
  }, []);

  const value = useMemo<AppStateValue>(() => ({
    cardFrozen,
    recognizedIds,
    events,
    setCardFrozen: (frozen, transactionId) => {
      updateCardFrozen(frozen);
      track(frozen ? 'card_frozen' : 'card_unfrozen', transactionId);
    },
    recognize: (transactionId) => {
      setRecognizedIds((current) => current.includes(transactionId) ? current : [...current, transactionId]);
      track('transaction_recognized', transactionId);
    },
    track,
    resetDemo: () => {
      updateCardFrozen(false);
      setRecognizedIds([]);
      setEvents([]);
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    },
  }), [cardFrozen, events, recognizedIds, track]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used within AppStateProvider');
  return value;
}
