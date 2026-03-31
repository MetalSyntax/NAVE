export const DB_NAME = 'appDatabase';
export const DB_VERSION = 3; // Incremented to trigger schema creation for settings and user stores

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
  fotoPortada?: ArrayBuffer;
  fotosAdicionales?: ArrayBuffer[];
  categoria?: string;
  identificadorUnidad?: string;
  estadoSistema?: string;
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

export const seedDefaults = async () => {
  try {
    const vehicle = await getById<VehicleData>('vehicle', 1);
    if (!vehicle) {
      await update('vehicle', {
        id: 1,
        marca: 'DUCATI',
        modelo: 'PANIGALE V4',
        anio: 2024,
        color: '',
        placa: '',
        vin: 'ZDM1234567890BC',
        tipoCombustible: 'gasoline',
        nivelGasolina: 100,
        rendimientoKmL: 15,
        kilometrajeActual: 12482,
        kilometrajeUltimoServicio: 12000,
        kilometrajeProximoServicio: 15000,
        fechaUltimoServicio: new Date().toISOString(),
        fechaProximoServicio: new Date().toISOString(),
        aseguradora: '',
        numeroPoliza: '',
        vigenciaSeguro: new Date().toISOString(),
        categoria: 'SUPERSPORT',
        identificadorUnidad: 'UNIDAD_01',
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      });
    }

    const settings = await getById<SettingsData>('settings', 1);
    if (!settings) {
      await update('settings', {
        id: 1,
        oilInterval: 3000,
        language: 'es',
        theme: 'dark',
        distanceUnits: 'km'
      });
    }

    const user = await getById<UserData>('user', 1);
    if (!user) {
      await update('user', {
        id: 1,
        name: 'RIDER_01',
        email: 'rider@apexvelocity.com'
      });
    }
  } catch (error) {
    console.error('Error seeding defaults:', error);
  }
};
