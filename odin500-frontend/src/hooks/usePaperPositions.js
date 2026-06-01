import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiOrigin.js';
import { fetchWithAuth, canFetchProtectedApi } from '../store/apiStore.js';

const POLL_MS = 15000;

async function parseJson(res) {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || payload?.message || 'Request failed');
  }
  return payload;
}

/**
 * @param {{ enabled?: boolean }} [options] — when false, skips fetch/poll (e.g. logged out).
 */
export function usePaperPositions({ enabled = true } = {}) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!enabled || !canFetchProtectedApi()) {
      setPositions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithAuth(apiUrl('/api/paper/positions'), { method: 'GET' });
      const data = await parseJson(res);
      setPositions(data.positions || []);
    } catch {
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setPositions([]);
      setLoading(false);
      return undefined;
    }
    void refetch();
    const t = window.setInterval(() => {
      void refetch();
    }, POLL_MS);
    return () => window.clearInterval(t);
  }, [refetch, enabled]);

  return { positions, loading, refetch };
}
