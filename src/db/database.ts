export const DB_NAME = 'appDatabase';
export const DB_VERSION = 8; // v8: adds fotoUrl to VehicleData

export interface LogEntry {
  id?: number;
  vehicleId?: number;
  date: string;
  odo: number;
  fuel: number;
  eff: number;
  notes: string;
  distance?: number;
}

export interface MaintenanceEntry {
  id?: number;
  vehicleId?: number;
  type: string;
  date: string;
  km: number;
  notes: string;
  fuelAtService?: number;
  cost?: number;
  workshop?: string;
  proofPhoto?: ArrayBuffer;
}

export interface RouteEntry {
  id?: number;
  vehicleId?: number;
  name?: string;
  status: 'active' | 'completed';
  startDate: string;
  endDate?: string;
  odoStart: number;
  odoEnd?: number;
  distance?: number;       // km recorridos (odoEnd - odoStart)
  fuelUsed?: number;       // litros estimados (distance / rendimientoKmL)
  rendimientoKmL?: number; // snapshot del rendimiento al finalizar
  notes?: string;
  track?: [number, number][]; // recorrido GPS opcional [lng, lat]
}

export interface ManualEntry {
  id?: number;
  vehicleId?: number;
  title: string;
  fileName: string;
  mimeType: string;   // p.ej. application/pdf
  size: number;       // bytes
  data: ArrayBuffer;  // contenido del archivo
  addedAt: string;
}

export interface ServiceSchedule {
  id?: number;
  vehicleId?: number;
  type: string;          // clave i18n: 'aceite'|'relacion'|'llantas'|'frenos'|'baston' o etiqueta libre
  intervalKm: number;    // cada cuántos km toca el servicio
  lastServiceKm: number; // km del último cambio
  enabled: boolean;
}

// Plantilla base de programas de servicio preventivo (km típicos de moto).
export const DEFAULT_SERVICE_SCHEDULES: Omit<ServiceSchedule, 'id' | 'vehicleId'>[] = [
  { type: 'aceite', intervalKm: 3000, lastServiceKm: 0, enabled: true },
  { type: 'relacion', intervalKm: 8000, lastServiceKm: 0, enabled: true },
  { type: 'llantas', intervalKm: 10000, lastServiceKm: 0, enabled: true },
  { type: 'frenos', intervalKm: 12000, lastServiceKm: 0, enabled: true },
  { type: 'baston', intervalKm: 15000, lastServiceKm: 0, enabled: true },
];

export interface VehicleData {
  id?: number; // Should always be 1
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  placa: string;
  vin: string;
  tipoCombustible: string;
  nivelGasolina: number;
  rendimientoKmL: number;
  kilometrajeActual: number;
  kilometrajeUltimoServicio: number;
  kilometrajeProximoServicio: number;
  fechaUltimoServicio: string;
  fechaProximoServicio: string;
  aseguradora: string;
  numeroPoliza: string;
  vigenciaSeguro: string;
  fotoUrl?: string;         // data URI from scraped model images (takes priority over fotoPortada)
  fotoPortada?: ArrayBuffer;
  fotosAdicionales?: ArrayBuffer[];
  categoria?: string;
  identificadorUnidad?: string;
  estadoSistema?: string;
  capacidadTanque?: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface SettingsData {
  id?: number; // Should always be 1
  oilInterval: number;
  language: string;
  theme: 'light' | 'dark';
  distanceUnits: string;
  activeVehicleId?: number;
  initialized?: boolean;      // true tras la siembra inicial
  onboardingComplete?: boolean; // true cuando el usuario completó el onboarding
  expertMode?: boolean;         // true = muestra métricas técnicas avanzadas
}

export interface UserData {
  id?: number; // Should always be 1
  name: string;
  avatar?: ArrayBuffer;
  email?: string;
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('logs')) {
        const logsStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        logsStore.createIndex('date', 'date', { unique: false });
        logsStore.createIndex('odo', 'odo', { unique: false });
      }

      if (!db.objectStoreNames.contains('maintenance')) {
        const maintStore = db.createObjectStore('maintenance', { keyPath: 'id', autoIncrement: true });
        maintStore.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains('routes')) {
        const routesStore = db.createObjectStore('routes', { keyPath: 'id', autoIncrement: true });
        routesStore.createIndex('status', 'status', { unique: false });
        routesStore.createIndex('startDate', 'startDate', { unique: false });
      }

      if (!db.objectStoreNames.contains('manuals')) {
        const manualsStore = db.createObjectStore('manuals', { keyPath: 'id', autoIncrement: true });
        manualsStore.createIndex('vehicleId', 'vehicleId', { unique: false });
      }

      if (!db.objectStoreNames.contains('serviceSchedules')) {
        const schedStore = db.createObjectStore('serviceSchedules', { keyPath: 'id', autoIncrement: true });
        schedStore.createIndex('vehicleId', 'vehicleId', { unique: false });
      }

      if (db.objectStoreNames.contains('profile')) {
        db.deleteObjectStore('profile'); // Clear old schema
      }

      if (!db.objectStoreNames.contains('vehicle')) {
        db.createObjectStore('vehicle', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
};

export const getAll = <T>(storeName: string): Promise<T[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (error) { reject(error); }
  });
};

export const getById = <T>(storeName: string, id: number): Promise<T | undefined> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (error) { reject(error); }
  });
};

export const add = <T>(storeName: string, data: T): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    } catch (error) { reject(error); }
  });
};

export const update = <T>(storeName: string, data: T): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (error) { reject(error); }
  });
};

export const remove = (storeName: string, id: number): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (error) { reject(error); }
  });
};

export const clear = (storeName: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (error) { reject(error); }
  });
};

// Siembra los programas de servicio del vehículo base (id 1) si aún no existen.
const seedSchedulesForVehicle1 = async () => {
  const existingVehicle = await getById<VehicleData>('vehicle', 1);
  if (!existingVehicle) return;
  const allSchedules = await getAll<ServiceSchedule>('serviceSchedules');
  if (!allSchedules.some(s => s.vehicleId === 1)) {
    for (const tpl of DEFAULT_SERVICE_SCHEDULES) {
      await add('serviceSchedules', { ...tpl, vehicleId: 1 });
    }
  }
};

export const seedDefaults = async () => {
  try {
    const settings = await getById<SettingsData>('settings', 1);

    // Primera ejecución absoluta: crear ajustes base y usuario; NO sembrar vehículo.
    // El onboarding se encargará de crear la moto.
    if (!settings) {
      await update('settings', {
        id: 1,
        oilInterval: 3000,
        language: 'es',
        theme: 'dark',
        distanceUnits: 'km',
        initialized: false,
        onboardingComplete: false,
      });
      const existingUser = await getById<UserData>('user', 1);
      if (!existingUser) {
        await update('user', { id: 1, name: 'PILOTO', email: '' });
      }
      return;
    }

    // Migración: usuario existente antes del onboarding → marcar completado.
    if (settings.initialized && settings.onboardingComplete === undefined) {
      await update('settings', { ...settings, onboardingComplete: true });
      await seedSchedulesForVehicle1();
      return;
    }

    // Usuario existente sin el flag initialized (esquema antiguo).
    if (!settings.initialized && settings.onboardingComplete) {
      await update('settings', { ...settings, initialized: true });
      await seedSchedulesForVehicle1();
    }

    // Limpieza: si el activeVehicleId es un timestamp real (creado por onboarding),
    // eliminar la moto placeholder con ID=1 que pudo haber quedado de versiones anteriores.
    if (settings.activeVehicleId && settings.activeVehicleId > 1_000_000_000) {
      const legacyVehicle = await getById<VehicleData>('vehicle', 1);
      if (legacyVehicle) {
        await remove('vehicle', 1);
      }
    }
  } catch (error) {
    console.error('Error seeding defaults:', error);
  }
};
