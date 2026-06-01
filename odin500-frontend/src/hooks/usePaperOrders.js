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

export function usePaperOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!canFetchProtectedApi()) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithAuth(apiUrl('/api/paper/orders'), { method: 'GET' });
      const data = await parseJson(res);
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const placeOrder = useCallback(
    async (orderInput) => {
      const res = await fetchWithAuth(apiUrl('/api/paper/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderInput)
      });
      const result = await parseJson(res);
      await refetch();
      return result;
    },
    [refetch]
  );

  const cancelOrder = useCallback(
    async (orderId) => {
      const res = await fetchWithAuth(apiUrl(`/api/paper/orders/${encodeURIComponent(orderId)}`), {
        method: 'DELETE'
      });
      const result = await parseJson(res);
      await refetch();
      return result;
    },
    [refetch]
  );

  return { orders, loading, placeOrder, cancelOrder, refetch };
}
