import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export type Charger = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  connector_type: string;
  power_output?: number;
  address?: string;
  created_at?: string;
  // Add other fields as needed
};

export function useChargers(page: number = 1, pageSize: number = 500) {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    supabase
      .from('Chargers')
      .select('*', { count: 'exact' })
      .range(from, to)
      .then(({ data, error, count }) => {
        if (!isMounted) return;
        if (error) {
          setError(error.message);
        } else {
          setChargers(data || []);
          setTotal(count || 0);
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, pageSize]);

  return { chargers, total, loading, error };
}
