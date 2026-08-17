import api from '../api';
import { IndexedDBService, OfflineEvent, OfflineMedia } from './IndexedDBService';
import { useSafetyStore } from '../../stores/safetyStore';

export class UploadQueueService {
  private static isProcessing = false;
  private static retryInterval: any = null;

  // Initialize listeners
  static init(): void {
    // Watch for online event
    window.addEventListener('online', () => {
      console.log('App went online. Triggering upload queue...');
      this.processQueue();
    });

    // Also trigger periodically (every 30 seconds) if online
    if (this.retryInterval) clearInterval(this.retryInterval);
    this.retryInterval = setInterval(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, 30000);

    // Initial check
    this.updatePendingCount();
    this.processQueue();
  }

  static async updatePendingCount(): Promise<void> {
    const count = await IndexedDBService.countPending();
    useSafetyStore.getState().setOfflineQueuedCount(count);
  }

  // Process the queue
  static async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Process safety events first (since media files need safetyEventId)
      const events = await IndexedDBService.getEvents();
      for (const event of events) {
        if (!navigator.onLine) break;
        const success = await this.uploadEvent(event);
        if (success) {
          await IndexedDBService.deleteEvent(event.id);
        }
      }

      // 2. Process media files
      const mediaFiles = await IndexedDBService.getMediaFiles();
      for (const media of mediaFiles) {
        if (!navigator.onLine) break;
        const success = await this.uploadMedia(media);
        if (success) {
          await IndexedDBService.deleteMedia(media.id);
        }
      }
    } catch (err) {
      console.error('Error processing upload queue:', err);
    } finally {
      this.isProcessing = false;
      this.updatePendingCount();
    }
  }

  // Upload single event
  private static async uploadEvent(event: OfflineEvent): Promise<boolean> {
    try {
      const response = await api.post('/safety/events', event);
      return response.status === 200 || response.status === 201;
    } catch (err) {
      console.error(`Failed to upload offline safety event ${event.id}:`, err);
      // Discard invalid event from local queue
      await IndexedDBService.deleteEvent(event.id);
      return false;
    }
  }

  // Upload single media file
  private static async uploadMedia(media: OfflineMedia): Promise<boolean> {
    media.uploadAttempts += 1;
    media.lastUploadAttemptAt = new Date();

    if (media.uploadAttempts > 5) {
      console.warn(`Media file ${media.id} exceeded max upload attempts (5). Discarding corrupt item.`);
      await IndexedDBService.deleteMedia(media.id);
      return true;
    }

    try {
      const formData = new FormData();
      const filename = `${media.id}.${media.type === 'VIDEO' ? 'webm' : 'webm'}`;
      const mime = media.mimeType || (media.type === 'VIDEO' ? 'video/webm' : 'audio/webm');
      const file = new File([media.blob], filename, { type: mime });
      formData.append('file', file);
      formData.append('safetyEventId', media.safetyEventId || '');
      formData.append('tripId', media.tripId || '');
      formData.append('busId', media.busId || '');
      formData.append('routeId', media.routeId || '');
      formData.append('type', media.type);
      formData.append('duration', media.duration ? String(media.duration) : '');
      formData.append('latitude', media.latitude ? String(media.latitude) : '');
      formData.append('longitude', media.longitude ? String(media.longitude) : '');
      formData.append('gpsAccuracy', media.gpsAccuracy ? String(media.gpsAccuracy) : '');
      formData.append('cameraFacing', media.cameraFacing || '');
      formData.append('interrupted', String(media.interrupted));
      formData.append('interruptionReason', media.interruptionReason || '');
      formData.append('checksum', media.checksum || '');
      formData.append('uploadAttempts', String(media.uploadAttempts));

      // Axios post
      const response = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.status === 200 || response.status === 201;
    } catch (err: any) {
      console.error(`Failed to upload offline media file ${media.id}:`, err);
      media.failureReason = err.message || 'Unknown network error';
      if (media.uploadAttempts >= 5) {
        await IndexedDBService.deleteMedia(media.id);
      } else {
        await IndexedDBService.saveMedia(media);
      }
      return false;
    }
  }
}
