export interface OfflineEvent {
  id: string;
  tripId: string | null;
  busId: string | null;
  driverId: string | null;
  routeId: string | null;
  detectedAt: Date;
  latitude: number | null;
  longitude: number | null;
  gpsAccuracy: number | null;
  speed: number | null;
  stopDuration: number | null;
  driverResponse: string;
  severity: string;
  status: string;
}

export interface OfflineMedia {
  id: string;
  safetyEventId: string | null;
  tripId: string | null;
  busId: string | null;
  routeId: string | null;
  type: 'VIDEO' | 'AUDIO';
  blob: Blob;
  mimeType: string;
  fileSize: number;
  duration: number | null;
  latitude: number | null;
  longitude: number | null;
  gpsAccuracy: number | null;
  cameraFacing: string | null;
  interrupted: boolean;
  interruptionReason: string | null;
  uploadAttempts: number;
  lastUploadAttemptAt: Date | null;
  checksum: string | null;
  failureReason: string | null;
  createdAt: Date;
}

export class IndexedDBService {
  private static dbName = 'ABSSAI_Safety_Offline';
  private static dbVersion = 1;

  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('safety_events')) {
          db.createObjectStore('safety_events', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('media_files')) {
          db.createObjectStore('media_files', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  // --- SAFETY EVENTS ---
  static async saveEvent(event: OfflineEvent): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('safety_events', 'readwrite');
      const store = tx.objectStore('safety_events');
      const request = store.put(event);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getEvents(): Promise<OfflineEvent[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('safety_events', 'readonly');
      const store = tx.objectStore('safety_events');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteEvent(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('safety_events', 'readwrite');
      const store = tx.objectStore('safety_events');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- MEDIA FILES ---
  static async saveMedia(media: OfflineMedia): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('media_files', 'readwrite');
      const store = tx.objectStore('media_files');
      const request = store.put(media);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getMediaFiles(): Promise<OfflineMedia[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('media_files', 'readonly');
      const store = tx.objectStore('media_files');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteMedia(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('media_files', 'readwrite');
      const store = tx.objectStore('media_files');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async countPending(): Promise<number> {
    const mediaCount = await this.getMediaFiles().then(res => res.length).catch(() => 0);
    const eventCount = await this.getEvents().then(res => res.length).catch(() => 0);
    return mediaCount + eventCount;
  }
}
