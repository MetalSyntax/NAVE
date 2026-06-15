import { useState, useEffect, useCallback } from 'react';
import { getAll, update, remove, VehicleData, seedDefaults } from '../db/database';
import { useSettings } from './useSettings';

export function useVehicle() {
  const { settings, updateSettings } = useSettings();
  const activeVehicleId = settings?.activeVehicleId || 1;
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicle = useCallback(async () => {
    setIsLoading(true);
    try {
      await seedDefaults();
      const data = await getAll<VehicleData>('vehicle');
      setVehicles(data);
      if (data.length > 0) {
        let active = data.find(v => v.id === activeVehicleId);
        if (!active) active = data[0];
        setVehicle(active);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vehicle profile');
    } finally {
      setIsLoading(false);
    }
  }, [activeVehicleId]);

  useEffect(() => { fetchVehicle(); }, [fetchVehicle]);

  const updateVehicle = async (data: VehicleData) => {
    setIsLoading(true);
    try {
      if (!data.id) data.id = Date.now();
      await update('vehicle', data);
      await fetchVehicle();
    } catch (err: any) {
      setError(err.message || 'Failed to update vehicle');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createNewVehicle = async (overrides?: Partial<VehicleData>) => {
    const newId = Date.now();
    const newVehicle: VehicleData = {
      marca: 'NUEVA',
      modelo: 'UNIDAD',
      anio: new Date().getFullYear(),
      color: '',
      placa: '',
      vin: '',
      tipoCombustible: 'gasoline',
      nivelGasolina: 5,
      rendimientoKmL: 35,
      kilometrajeActual: 0,
      kilometrajeUltimoServicio: 0,
      kilometrajeProximoServicio: 3000,
      fechaUltimoServicio: new Date().toISOString(),
      fechaProximoServicio: new Date().toISOString(),
      aseguradora: '',
      numeroPoliza: '',
      vigenciaSeguro: new Date().toISOString(),
      categoria: 'PASEO',
      identificadorUnidad: 'UNIDAD_' + newId.toString().slice(-4),
      estadoSistema: 'OPTIMO',
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
      ...overrides,
      id: newId,
    };
    await update('vehicle', newVehicle);
    await updateSettings({ activeVehicleId: newId });
    // Directly update state without waiting for effect
    const all = await getAll<VehicleData>('vehicle');
    setVehicles(all);
    setVehicle(newVehicle);
    return newId;
  };

  const setActiveVehicle = async (id: number) => {
    await updateSettings({ activeVehicleId: id });
    // Directly update state - don't rely on effect timing
    const data = await getAll<VehicleData>('vehicle');
    setVehicles(data);
    const active = data.find(v => v.id === id) || data[0];
    if (active) setVehicle(active);
  };

  const deleteVehicle = async (id: number) => {
    await remove('vehicle', id);
    const remaining = vehicles.filter(v => v.id !== id);
    setVehicles(remaining);
    if (remaining.length > 0) {
      const newActive = remaining[0];
      await updateSettings({ activeVehicleId: newActive.id });
      setVehicle(newActive);
    } else {
      setVehicle(null);
    }
  };

  return { vehicle, vehicles, isLoading, error, updateVehicle, createNewVehicle, setActiveVehicle, deleteVehicle, refreshVehicle: fetchVehicle };
}
