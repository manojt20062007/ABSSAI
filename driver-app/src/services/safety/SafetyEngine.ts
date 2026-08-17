import api from '../api';
import { useSafetyStore, SafetyState } from '../../stores/safetyStore';
import { safetyConfig } from '../../config/safety.config';
import { MediaCaptureService, RecordingResult } from '../media/MediaCaptureService';
import { IndexedDBService, OfflineEvent, OfflineMedia } from '../media/IndexedDBService';
import { UploadQueueService } from '../media/UploadQueueService';

export class SafetyEngine {
  private static watchId: number | null = null;
  private static tripId: string | null = null;
  private static busId: string | null = null;
  private static driverId: string | null = null;
  private static routeId: string | null = null;
  private static routeStops: any[] = [];

  private static stationaryStart: number | null = null;
  private static responseTimerInterval: any = null;
  private static recordingTimerInterval: any = null;
  private static stationaryInterval: any = null;
  private static currentSafetyEventId: string | null = null;
  private static isPaused: boolean = false;
  private static gpsHistory: { lat: number; lng: number; time: number; speed: number }[] = [];

  // Haversine distance formula to calculate distance between coordinates in meters
  private static getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  }

  // Play alert tone
  private static playAlertSound(): void {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-preview.mp3');
      audio.loop = true;
      (audio as any).id = 'abssai-safety-alert-sound';
      document.body.appendChild(audio);
      audio.play().catch(() => { });
    } catch (e) { }
  }

  private static stopAlertSound(): void {
    try {
      const audio = document.getElementById('abssai-safety-alert-sound') as HTMLAudioElement;
      if (audio) {
        audio.pause();
        audio.remove();
      }
    } catch (e) { }
  }

  // AI Algorithm: Evaluates micro-displacement & velocity variance over 5-minute window
  private static evaluateTrafficAI(currentLat: number, currentLng: number): 'TRAFFIC_JAM' | 'ABNORMAL_STOP' {
    if (SafetyEngine.gpsHistory.length < 2) return 'ABNORMAL_STOP';

    const oldestGps = SafetyEngine.gpsHistory[0];
    const totalDisplacementMeters = SafetyEngine.getDistance(oldestGps.lat, oldestGps.lng, currentLat, currentLng);
    const maxSpeedInWindow = Math.max(...SafetyEngine.gpsHistory.map((g) => g.speed));

    if (totalDisplacementMeters > 10 || maxSpeedInWindow >= 1.5) {
      return 'TRAFFIC_JAM';
    }

    return 'ABNORMAL_STOP';
  }

  // Continuous 1-second tick timer for stationary stop detection
  private static tickStationaryTimer(): void {
    const store = useSafetyStore.getState();
    if (!SafetyEngine.tripId || !store.isTripActive || SafetyEngine.isPaused) {
      SafetyEngine.stationaryStart = null;
      store.setStationarySeconds(0);
      return;
    }

    if (SafetyEngine.stationaryStart === null) {
      SafetyEngine.stationaryStart = Date.now();
    }

    const currentSpeed = store.gpsSpeed || 0;
    if (currentSpeed >= safetyConfig.stationarySpeedThreshold) {
      SafetyEngine.stationaryStart = null;
      store.setStationarySeconds(0);
      return;
    }

    const stationaryDuration = (Date.now() - SafetyEngine.stationaryStart) / 1000;
    const elapsedSec = Math.round(stationaryDuration);
    store.setStationarySeconds(elapsedSec);

    // Verification timing threshold reached (5 minutes = 300s)
    if (stationaryDuration >= safetyConfig.unexpectedStopVerificationTime) {
      if (store.safetyState === 'NORMAL') {
        const loc = store.currentLocation || [12.8717, 80.2263];
        const aiResult = SafetyEngine.evaluateTrafficAI(loc[0], loc[1]);
        if (aiResult === 'TRAFFIC_JAM') {
          console.log('🤖 [AI Safety Engine]: Traffic jam pattern detected (vehicle inching in traffic). Auto-extending verification timer.');
          SafetyEngine.stationaryStart = Date.now();
        } else {
          console.log('🚨 [AI Safety Engine]: 100% Dead stop detected for 5 minutes. Triggering Driver Alert.');
          SafetyEngine.triggerDriverAlert(Math.round(stationaryDuration));
        }
      }
    }
  }

  // Pause Safety Monitoring for driver break / bathroom break
  static pause(): void {
    this.isPaused = true;
    this.stationaryStart = null;
    clearInterval(this.stationaryInterval);
    this.stopAlertSound();
    clearInterval(this.responseTimerInterval);
    const store = useSafetyStore.getState();
    store.setStationarySeconds(0);
    store.setSafetyState('NORMAL');
  }

  // Resume Safety Monitoring after break
  static resume(): void {
    this.isPaused = false;
    this.stationaryStart = Date.now();
    clearInterval(this.stationaryInterval);
    this.stationaryInterval = setInterval(() => SafetyEngine.tickStationaryTimer(), 1000);
  }

  // Start Safety Engine when a trip starts
  static start(
    tripId: string,
    busId: string,
    driverId: string,
    routeId: string,
    routeStops: any[]
  ): void {
    this.isPaused = false;
    this.tripId = tripId;
    this.busId = busId;
    this.driverId = driverId;
    this.routeId = routeId;
    this.routeStops = routeStops || [];
    this.stationaryStart = Date.now();

    const store = useSafetyStore.getState();
    store.setTripActive(true);
    store.setActiveTrip({ tripId, busId, driverId, routeId });
    store.setSafetyState('NORMAL');

    // Initialize Upload Queue Service
    UploadQueueService.init();

    // Start continuous 1-second interval timer for live ticking on desktop & mobile
    clearInterval(this.stationaryInterval);
    this.stationaryInterval = setInterval(() => SafetyEngine.tickStationaryTimer(), 1000);

    // Setup GPS watch position
    if ('geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.onPositionUpdate(position),
        (error) => this.onPositionError(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      store.setGpsError('GPS not supported on this device');
    }
  }

  // Stop Safety Engine when a trip ends
  static stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.stopAlertSound();
    clearInterval(this.stationaryInterval);
    clearInterval(this.responseTimerInterval);
    clearInterval(this.recordingTimerInterval);
    MediaCaptureService.cleanup();

    this.tripId = null;
    this.busId = null;
    this.driverId = null;
    this.routeId = null;
    this.routeStops = [];
    this.stationaryStart = null;
    this.currentSafetyEventId = null;
    this.isPaused = false;

    useSafetyStore.getState().resetSafetyStore();
  }

  // GPS watch error handler
  private static onPositionError(error: GeolocationPositionError): void {
    console.error('GPS Safety Watch Error:', error);
    useSafetyStore.getState().setGpsError('Waiting for reliable GPS signal...');
  }

  // GPS update handler
  private static onPositionUpdate(position: GeolocationPosition): void {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const speed = position.coords.speed !== null ? position.coords.speed * 3.6 : 0; // m/s to km/h
    const heading = position.coords.heading || 0;
    const accuracy = position.coords.accuracy;

    this.processLocationUpdate(lat, lng, speed, heading, accuracy);
  }

  // Process location update
  private static processLocationUpdate(lat: number, lng: number, speed: number, heading: number, accuracy: number): void {
    const store = useSafetyStore.getState();
    store.setGpsError(null);
    store.setCurrentLocation([lat, lng]);
    store.setGpsSpeed(speed);
    store.setGpsHeading(heading);
    store.setGpsAccuracy(accuracy);

    // If trip is NOT active or trip is PAUSED, reset stationary stopwatch and skip monitoring
    if (!this.tripId || this.isPaused || !store.isTripActive) {
      this.stationaryStart = null;
      return;
    }

    // Broadcast standard telemetry (REUSES existing telemetry pipeline - FIX 1)
    api.post('/telemetry/location', {
      busId: this.busId || 'BUS-1001',
      lat,
      lng,
      speed,
      heading,
      tripId: this.tripId,
    }).catch((err) => console.error('Telemetry upload failed:', err));

    // Evaluate GPS accuracy (FIX 2)
    if (accuracy > safetyConfig.maxGpsAccuracy) {
      if (store.safetyState === 'NORMAL') {
        store.setSafetyState('NORMAL'); // Keep normal but ignore context
      }
      return;
    }

    // Store GPS point in 5-minute sliding window track buffer for AI traffic pattern evaluation
    this.gpsHistory.push({ lat, lng, time: Date.now(), speed });
    const fiveMinsAgo = Date.now() - 300000;
    this.gpsHistory = this.gpsHistory.filter((item) => item.time >= fiveMinsAgo);

    // Stop detection evaluation: triggers for ANY stationary stop > 5 mins during active trip
    if (speed >= safetyConfig.stationarySpeedThreshold) {
      // Vehicle is moving, reset stopwatch
      this.stationaryStart = null;
      store.setStationarySeconds(0);

      // Auto-resolve alert if bus resumes movement
      if (store.safetyState === 'DRIVER_ALERTED' || store.safetyState === 'AWAITING_RESPONSE' || store.safetyState === 'VERIFYING') {
        this.stopAlertSound();
        clearInterval(this.responseTimerInterval);
        store.setSafetyState('NORMAL');
      }
    }
  }

  // Trigger verification popups
  private static triggerDriverAlert(stopDuration: number): void {
    const store = useSafetyStore.getState();
    store.setSafetyState('DRIVER_ALERTED');

    // Play alert sound
    this.playAlertSound();

    // Start Response Window countdown (5 mins / 300s)
    store.setAlertTimer(safetyConfig.driverResponseTimeout);
    store.setSafetyState('AWAITING_RESPONSE');

    clearInterval(this.responseTimerInterval);
    this.responseTimerInterval = setInterval(() => {
      store.setAlertTimer((prev) => {
        if (prev <= 1) {
          clearInterval(this.responseTimerInterval);
          this.onResponseTimeout(stopDuration);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Respond driver selection handler
  static respond(response: 'IM_OK' | 'VEHICLE_PROBLEM' | 'EMERGENCY'): void {
    const store = useSafetyStore.getState();
    if (store.safetyState !== 'AWAITING_RESPONSE') return;

    this.stopAlertSound();
    clearInterval(this.responseTimerInterval);

    const lat = store.currentLocation ? store.currentLocation[0] : null;
    const lng = store.currentLocation ? store.currentLocation[1] : null;
    const stopDuration = this.stationaryStart ? Math.round((Date.now() - this.stationaryStart) / 1000) : 0;

    if (response === 'IM_OK') {
      store.setSafetyState('DRIVER_RESPONDED');
      setTimeout(() => {
        store.setSafetyState('NORMAL');
        this.stationaryStart = null;
      }, 2000);
    } else if (response === 'VEHICLE_PROBLEM') {
      store.setSafetyState('SAFETY_EVENT');
      this.createSafetyEvent('VEHICLE_PROBLEM', 'MEDIUM', lat, lng, stopDuration);
      setTimeout(() => {
        store.setSafetyState('NORMAL');
        this.stationaryStart = null;
      }, 3000);
    } else if (response === 'EMERGENCY') {
      store.setSafetyState('SAFETY_EVENT');
      this.triggerEmergencyCapture('EMERGENCY', lat, lng, stopDuration);
    }
  }

  // Timeout handler
  private static onResponseTimeout(stopDuration: number): void {
    this.stopAlertSound();
    const store = useSafetyStore.getState();
    store.setSafetyState('SAFETY_EVENT');

    const lat = store.currentLocation ? store.currentLocation[0] : null;
    const lng = store.currentLocation ? store.currentLocation[1] : null;
    this.triggerEmergencyCapture('NO_RESPONSE', lat, lng, stopDuration);
  }

  // Trigger evidence capture
  private static async triggerEmergencyCapture(
    driverResponse: 'EMERGENCY' | 'NO_RESPONSE',
    lat: number | null,
    lng: number | null,
    stopDuration: number
  ): Promise<void> {
    const store = useSafetyStore.getState();
    store.setSafetyState('EVIDENCE_CAPTURE');

    // Create the safety event metadata first
    await this.createSafetyEvent(driverResponse, 'HIGH', lat, lng, stopDuration);

    // Set countdown timer
    store.setRecordingTimer(safetyConfig.evidenceCaptureDuration);

    // Start video/audio recording
    try {
      const stream = await MediaCaptureService.startRecording(
        'VIDEO',
        (videoResult) => this.onRecordingComplete('VIDEO', videoResult),
        (err) => console.error('Media recording start failed:', err)
      );
      if (stream) {
        store.setActiveStream(stream);
      }

      // Start Countdown Timer Interval
      clearInterval(this.recordingTimerInterval);
      this.recordingTimerInterval = setInterval(() => {
        store.setRecordingTimer((prev) => {
          if (prev <= 1) {
            clearInterval(this.recordingTimerInterval);
            this.stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      console.error('Failed to initiate recording streams:', e);
      store.setSafetyState('NORMAL');
      this.stationaryStart = null;
    }
  }

  // Force stop recording
  static stopRecording(): void {
    MediaCaptureService.stopRecording();
    clearInterval(this.recordingTimerInterval);
    useSafetyStore.getState().setActiveStream(null);
  }

  // Recording stop callback
  private static async onRecordingComplete(
    type: 'VIDEO' | 'AUDIO',
    result: RecordingResult
  ): Promise<void> {
    const store = useSafetyStore.getState();
    store.setActiveStream(null);
    store.setSafetyState('UPLOADING');

    const lat = store.currentLocation ? store.currentLocation[0] : null;
    const lng = store.currentLocation ? store.currentLocation[1] : null;
    const accuracy = store.gpsAccuracy;

    // Unique checksum (FIX 4 & 5)
    const checksum = `${this.currentSafetyEventId || 'unknown'}-${type}-${result.duration}-${result.blob.size}`;

    const offlineMedia: OfflineMedia = {
      id: `media-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      safetyEventId: this.currentSafetyEventId,
      tripId: this.tripId,
      busId: this.busId,
      routeId: this.routeId,
      type,
      blob: result.blob,
      mimeType: result.mimeType,
      fileSize: result.blob.size,
      duration: result.duration,
      latitude: lat,
      longitude: lng,
      gpsAccuracy: accuracy,
      cameraFacing: type === 'VIDEO' ? 'front' : null,
      interrupted: result.interrupted,
      interruptionReason: result.interruptionReason,
      uploadAttempts: 0,
      lastUploadAttemptAt: null,
      checksum,
      failureReason: null,
      createdAt: new Date(),
    };

    // Save to IndexedDB (for reliability and offline support)
    await IndexedDBService.saveMedia(offlineMedia);

    // Trigger upload queue processing
    UploadQueueService.processQueue();

    // Reset safety engine
    store.setSafetyState('NORMAL');
    this.stationaryStart = null;
    this.currentSafetyEventId = null;
  }

  // Create safety event on backend / local queue
  private static async createSafetyEvent(
    driverResponse: string,
    severity: 'MEDIUM' | 'HIGH',
    lat: number | null,
    lng: number | null,
    stopDuration: number
  ): Promise<string> {
    const eventId = `event-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    this.currentSafetyEventId = eventId;

    const payload: OfflineEvent = {
      id: eventId,
      tripId: this.tripId,
      busId: this.busId,
      driverId: this.driverId,
      routeId: this.routeId,
      detectedAt: new Date(),
      latitude: lat,
      longitude: lng,
      gpsAccuracy: useSafetyStore.getState().gpsAccuracy,
      speed: useSafetyStore.getState().gpsSpeed,
      stopDuration,
      driverResponse,
      severity,
      status: 'OPEN',
    };

    // Check offline context
    if (navigator.onLine) {
      try {
        const response = await api.post('/safety/events', payload);
        if (response.data?.data?.id) {
          // Store backend ID
          this.currentSafetyEventId = response.data.data.id;
          return response.data.data.id;
        }
      } catch (err) {
        console.error('Failed to post safety event to backend. Saving offline...', err);
      }
    }

    // Save locally to IndexedDB if offline or API failed
    await IndexedDBService.saveEvent(payload);
    UploadQueueService.updatePendingCount();
    return eventId;
  }
}
