'use client';

import { useCallback, useEffect, useState } from 'react';

import type { TimeSlot } from '../lib/date-utils';
import { fetchSlots } from '../services/client';

export function useSlots(doctorId: string | null, date: string | null) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!doctorId || !date) {
      queueMicrotask(() => {
        if (cancelled) return;
        setSlots([]);
        setError(null);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    const activeDoctorId = doctorId;
    const activeDate = date;

    async function load() {
      await Promise.resolve();
      if (cancelled) return;

      setLoading(true);
      setError(null);
      try {
        const list = await fetchSlots(activeDoctorId, activeDate);
        if (cancelled) return;
        setSlots(list);
      } catch (err) {
        if (cancelled) return;
        setSlots([]);
        setError(err instanceof Error ? err.message : 'Failed to load slots');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [doctorId, date, reloadToken]);

  return { slots, loading, error, reload };
}
