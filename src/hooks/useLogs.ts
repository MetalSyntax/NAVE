import { useState, useEffect, useCallback } from 'react';
import { getAll, add, remove, update, LogEntry } from '../db/database';
import { useSettings } from './useSettings';

export function useLogs() {
  const { settings } = useSettings();
  const activeVehicleId = settings?.activeVehicleId || 1;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAll<LogEntry>('logs');
      // Filter by active vehicle id (or legacy logs without vehicleId)
      const filtered = data.filter(log => !log.vehicleId || log.vehicleId === activeVehicleId);
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLogs(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  }, [activeVehicleId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = async (entry: LogEntry) => {
    setIsLoading(true);
    try {
      entry.vehicleId = activeVehicleId;
      await add('logs', entry);
      await fetchLogs();
    } catch (err: any) {
      setError(err.message || 'Failed to add log');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeLog = async (id: number) => {
    setIsLoading(true);
    try {
      await remove('logs', id);
      await fetchLogs();
    } catch (err: any) {
      setError(err.message || 'Failed to remove log');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLog = async (entry: LogEntry) => {
    setIsLoading(true);
    try {
      await update('logs', entry);
      await fetchLogs();
    } catch (err: any) {
      setError(err.message || 'Failed to update log');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { logs, isLoading, error, addLog, updateLog, removeLog, refreshLogs: fetchLogs };
}
