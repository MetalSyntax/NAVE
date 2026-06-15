import { useState, useEffect, useCallback } from 'react';
import { getAll, add, remove, update, ServiceSchedule } from '../db/database';
import { useSettings } from './useSettings';

export function useServiceSchedules() {
  const { settings } = useSettings();
  const activeVehicleId = settings?.activeVehicleId || 1;
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAll<ServiceSchedule>('serviceSchedules');
      const filtered = data.filter(s => !s.vehicleId || s.vehicleId === activeVehicleId);
      setSchedules(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch service schedules');
    } finally {
      setIsLoading(false);
    }
  }, [activeVehicleId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addSchedule = async (entry: Omit<ServiceSchedule, 'id' | 'vehicleId'>) => {
    try {
      await add('serviceSchedules', { ...entry, vehicleId: activeVehicleId });
      await fetchSchedules();
    } catch (err: any) {
      setError(err.message || 'Failed to add schedule');
      throw err;
    }
  };

  const updateSchedule = async (entry: ServiceSchedule) => {
    try {
      await update('serviceSchedules', entry);
      await fetchSchedules();
    } catch (err: any) {
      setError(err.message || 'Failed to update schedule');
      throw err;
    }
  };

  const removeSchedule = async (id: number) => {
    try {
      await remove('serviceSchedules', id);
      await fetchSchedules();
    } catch (err: any) {
      setError(err.message || 'Failed to remove schedule');
      throw err;
    }
  };

  // Marca un servicio como realizado al kilometraje indicado.
  const markServiced = async (schedule: ServiceSchedule, km: number) => {
    await updateSchedule({ ...schedule, lastServiceKm: km });
  };

  return {
    schedules,
    isLoading,
    error,
    addSchedule,
    updateSchedule,
    removeSchedule,
    markServiced,
    refreshSchedules: fetchSchedules,
  };
}
