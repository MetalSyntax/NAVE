import { useState, useEffect, useCallback } from 'react';
import { getAll, add, remove, ManualEntry } from '../db/database';
import { useSettings } from './useSettings';
import { toArrayBuffer } from '../utils/fileUtils';

export function useManuals() {
  const { settings } = useSettings();
  const activeVehicleId = settings?.activeVehicleId || 1;
  const [manuals, setManuals] = useState<ManualEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManuals = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAll<ManualEntry>('manuals');
      const filtered = data.filter(m => !m.vehicleId || m.vehicleId === activeVehicleId);
      filtered.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      setManuals(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch manuals');
    } finally {
      setIsLoading(false);
    }
  }, [activeVehicleId]);

  useEffect(() => {
    fetchManuals();
  }, [fetchManuals]);

  const addManual = async (file: File, title?: string) => {
    setIsLoading(true);
    try {
      const data = await toArrayBuffer(file);
      const entry: ManualEntry = {
        vehicleId: activeVehicleId,
        title: title?.trim() || file.name.replace(/\.[^.]+$/, ''),
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        data,
        addedAt: new Date().toISOString(),
      };
      await add('manuals', entry);
      await fetchManuals();
    } catch (err: any) {
      setError(err.message || 'Failed to add manual');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeManual = async (id: number) => {
    try {
      await remove('manuals', id);
      await fetchManuals();
    } catch (err: any) {
      setError(err.message || 'Failed to remove manual');
      throw err;
    }
  };

  return { manuals, isLoading, error, addManual, removeManual, refreshManuals: fetchManuals };
}
