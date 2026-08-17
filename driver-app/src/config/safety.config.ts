export const safetyConfig = {
  // Stop detection and escalation thresholds
  unexpectedStopVerificationTime: 300, // 5 minutes (300 seconds) of stationary stop before triggering driver alert popup
  driverResponseTimeout: 60, // 60 seconds response window for driver to press "I'M OK"
  evidenceCaptureDuration: 15, // 15 seconds automatic camera & mic recording on driver timeout / panic
  stationarySpeedThreshold: 1.0, // km/h (speed under this is stationary)
  legitimateStopRadius: 50, // meters (stoppage within 50m of a route stop is legitimate and won't trigger alert)
  maxGpsAccuracy: 50, // meters (accuracy worse than this is ignored/GPS_UNRELIABLE)

  // Media limits
  video: {
    maxDuration: 300, // 5 minutes (in seconds)
    maxSize: 50 * 1024 * 1024, // 50MB
    resolution: '640x480',
    videoBitrate: 800000, // 800kbps for compact recording
    audioBitrate: 64000, // 64kbps
  },
  audio: {
    maxDuration: 300, // 5 minutes (in seconds)
    maxSize: 10 * 1024 * 1024, // 10MB
    audioBitrate: 64000,
  }
};
