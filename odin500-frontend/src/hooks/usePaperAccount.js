// fetchWithAuth: store/apiStore.js — apiUrl from utils/apiOrigin.js (same as useHeaderProfile).
// Auth: ProtectedRoute in appRoutes.jsx; API uses requireAuthStrict on /api/paper.

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiOrigin.js';
import { fetchWithAuth, canFetchProtectedApi } from '../store/apiStore.js';

async function parseJson(res) {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || payload?.message || 'Request failed');
  }
  return payload;
}

export function usePaperAccount() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    if (!canFetchProtectedApi()) {
      setAccount(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(apiUrl('/api/paper/account'), { method: 'GET' });
      const data = await parseJson(res);
      setAccount(data);
    } catch (err) {
      setError(err?.message || 'Failed to load paper account');
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const resetPortfolio = useCallback(async () => {
    if (!window.confirm('Reset your paper portfolio to $100,000 and clear all positions and pending orders?')) {
      return;
    }
    const res = await fetchWithAuth(apiUrl('/api/paper/account/reset'), { method: 'POST' });
    await parseJson(res);
    await refetch();
  }, [refetch]);

  return { account, loading, error, refetch, resetPortfolio };
}
