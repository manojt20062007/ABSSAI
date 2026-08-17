import { create } from 'zustand';

export type SafetyState =
  | 'NORMAL'
  | 'POTENTIAL_STOP'
  | 'VERIFYING'
  | 'DRIVER_ALERTED'
  | 'AWAITING_RESPONSE'
  | 'DRIVER_RESPONDED'
  | 'SAFETY_EVENT'
  | 'EVIDENCE_CAPTURE'
  | 'UPLOADING'
  | 'ESCALATED'
  | 'RESOLVED';

interface SafetyStoreState {
  safetyState: SafetyState;
  alertTimer: number; // in seconds
  recordingTimer: number; // in seconds
  stationarySeconds: number; // in seconds live stationary stop timer
  offlineQueuedCount: number;
  currentLocation: [number, number] | null;
  gpsSpeed: number; // in km/h
  gpsHeading: number;
  gpsAccuracy: number; // in meters
  gpsError: string | null;
  isTripActive: boolean;
  activeTrip: any | null;
  activeStream: MediaStream | null;

  // Actions
  setSafetyState: (state: SafetyState) => void;
  setAlertTimer: (time: number | ((prev: number) => number)) => void;
  setRecordingTimer: (time: number | ((prev: number) => number)) => void;
  setStationarySeconds: (sec: number) => void;
  setOfflineQueuedCount: (count: number) => void;
  setCurrentLocation: (loc: [number, number] | null) => void;
  setGpsSpeed: (speed: number) => void;
  setGpsHeading: (heading: number) => void;
  setGpsAccuracy: (accuracy: number) => void;
  setGpsError: (error: string | null) => void;
  setTripActive: (active: boolean) => void;
  setActiveTrip: (trip: any) => void;
  setActiveStream: (stream: MediaStream | null) => void;
  resetSafetyStore: () => void;
}

export const useSafetyStore = create<SafetyStoreState>((set) => ({
  safetyState: 'NORMAL',
  alertTimer: 0,
  recordingTimer: 0,
  stationarySeconds: 0,
  offlineQueuedCount: 0,
  currentLocation: null,
  gpsSpeed: 0,
  gpsHeading: 0,
  gpsAccuracy: 0,
  gpsError: null,
  isTripActive: false,
  activeTrip: null,
  activeStream: null,

  setSafetyState: (safetyState) => set({ safetyState }),
  setAlertTimer: (time) =>
    set((state) => ({
      alertTimer: typeof time === 'function' ? time(state.alertTimer) : time,
    })),
  setRecordingTimer: (time) =>
    set((state) => ({
      recordingTimer: typeof time === 'function' ? time(state.recordingTimer) : time,
    })),
  setStationarySeconds: (stationarySeconds) => set({ stationarySeconds }),
  setOfflineQueuedCount: (offlineQueuedCount) => set({ offlineQueuedCount }),
  setCurrentLocation: (currentLocation) => set({ currentLocation }),
  setGpsSpeed: (gpsSpeed) => set({ gpsSpeed }),
  setGpsHeading: (gpsHeading) => set({ gpsHeading }),
  setGpsAccuracy: (gpsAccuracy) => set({ gpsAccuracy }),
  setGpsError: (gpsError) => set({ gpsError }),
  setTripActive: (isTripActive) => set({ isTripActive }),
  setActiveTrip: (activeTrip) => set({ activeTrip }),
  setActiveStream: (activeStream) => set({ activeStream }),
  resetSafetyStore: () =>
    set({
      safetyState: 'NORMAL',
      alertTimer: 0,
      recordingTimer: 0,
      isTripActive: false,
      activeTrip: null,
      activeStream: null,
    }),
}));
