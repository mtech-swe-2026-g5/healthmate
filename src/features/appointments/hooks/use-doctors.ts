'use client';

import { useCallback, useEffect, useState } from 'react';

import type { DoctorListItem } from '../types/doctor';
import { fetchDoctors } from '../services/client';

export function useDoctors() {
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await fetchDoctors();
        if (cancelled) return;
        setDoctors(list);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load doctors');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { doctors, loading, error, reload };
}
