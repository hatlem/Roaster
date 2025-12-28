import { useState, useEffect } from 'react';
import api from '../services/api';

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  role: string;
  compliance: {
    status: 'compliant' | 'warning' | 'violation';
    issues: string[];
  };
}

export const useShifts = (startDate?: string, endDate?: string) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getMyShifts(startDate, endDate);
      setShifts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shifts');
      console.error('Error fetching shifts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [startDate, endDate]);

  return {
    shifts,
    isLoading,
    error,
    refetch: fetchShifts,
  };
};

export default useShifts;
