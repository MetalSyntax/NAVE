import { useState, useEffect, useCallback } from 'react';
import { getAll, add, remove, update, MaintenanceEntry, getById, SettingsData } from '../db/database';
import { useSettings } from './useSettings';

export function useMaintenance() {
  const { settings: appSettings } = useSettings();
  const activeVehicleId = appSettings?.activeVehicleId || 1;
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceEntry[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaintenance = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAll<MaintenanceEntry>('maintenance');
      const filtered = data.filter(log => !log.vehicleId || log.vehicleId == activeVehicleId);
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMaintenanceLogs(filtered);

      const dbSettings = await getById<SettingsData>('settings', 1);
      if (dbSettings) {
        setSettings(dbSettings);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch maintenance data');
    } finally {
      setIsLoading(false);
    }
  }, [activeVehicleId]);

  useEffect(() => {
    fetchMaintenance();
  }, [fetchMaintenance]);

  const addMaintenance = async (entry: MaintenanceEntry) => {
    setIsLoading(true);
    try {
      entry.vehicleId = activeVehicleId;
      await add('maintenance', entry);
      await fetchMaintenance();
    } catch (err: any) {
      setError(err.message || 'Failed to add maintenance entry');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeMaintenance = async (id: number) => {
    setIsLoading(true);
    try {
      await remove('maintenance', id);
      await fetchMaintenance();
    } catch (err: any) {
      setError(err.message || 'Failed to remove maintenance entry');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMaintenance = async (entry: MaintenanceEntry) => {
    setIsLoading(true);
    try {
      await update('maintenance', entry);
      await fetchMaintenance();
    } catch (err: any) {
      setError(err.message || 'Failed to update maintenance entry');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { maintenanceLogs, settings, isLoading, error, addMaintenance, updateMaintenance, removeMaintenance, refreshMaintenance: fetchMaintenance };
}
