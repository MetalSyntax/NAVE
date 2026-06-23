import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAll, add, remove, update, RouteEntry } from '../db/database';
import { useSettings } from './useSettings';

export function useRoutes() {
  const { settings } = useSettings();
  const activeVehicleId = settings?.activeVehicleId || 1;
  const [routes, setRoutes] = useState<RouteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAll<RouteEntry>('routes');
      const filtered = data.filter(r => !r.vehicleId || r.vehicleId == activeVehicleId);
      filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setRoutes(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  }, [activeVehicleId]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const activeRoute = useMemo(() => routes.find(r => r.status === 'active') || null, [routes]);

  const startRoute = async (odoStart: number, name?: string) => {
    if (activeRoute) throw new Error('A route is already active');
    const entry: RouteEntry = {
      vehicleId: activeVehicleId,
      name: name?.trim() || undefined,
      status: 'active',
      startDate: new Date().toISOString(),
      odoStart,
    };
    try {
      await add('routes', entry);
      await fetchRoutes();
    } catch (err: any) {
      setError(err.message || 'Failed to start route');
      throw err;
    }
  };

  const finishRoute = async (odoEnd: number, rendimientoKmL: number, notes?: string, track?: [number, number][]) => {
    if (!activeRoute) throw new Error('No active route');
    const distance = Math.max(0, odoEnd - activeRoute.odoStart);
    const fuelUsed = rendimientoKmL > 0 ? Math.round((distance / rendimientoKmL) * 100) / 100 : 0;
    const updated: RouteEntry = {
      ...activeRoute,
      status: 'completed',
      endDate: new Date().toISOString(),
      odoEnd,
      distance,
      fuelUsed,
      rendimientoKmL,
      notes: notes?.trim() || activeRoute.notes,
      track: track && track.length > 1 ? track : activeRoute.track,
    };
    try {
      await update('routes', updated);
      await fetchRoutes();
    } catch (err: any) {
      setError(err.message || 'Failed to finish route');
      throw err;
    }
  };

  const updateRoute = async (entry: RouteEntry) => {
    try {
      await update('routes', entry);
      await fetchRoutes();
    } catch (err: any) {
      setError(err.message || 'Failed to update route');
      throw err;
    }
  };

  const addRoute = async (entry: Omit<RouteEntry, 'id' | 'vehicleId'>) => {
    try {
      await add('routes', { ...entry, vehicleId: activeVehicleId });
      await fetchRoutes();
    } catch (err: any) {
      setError(err.message || 'Failed to add route');
      throw err;
    }
  };

  const removeRoute = async (id: number) => {
    try {
      await remove('routes', id);
      await fetchRoutes();
    } catch (err: any) {
      setError(err.message || 'Failed to remove route');
      throw err;
    }
  };

  return {
    routes,
    activeRoute,
    isLoading,
    error,
    startRoute,
    finishRoute,
    addRoute,
    updateRoute,
    removeRoute,
    refreshRoutes: fetchRoutes,
  };
}
