import { safetyConfig } from '../../config/safety.config';

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  duration: number;
  interrupted: boolean;
  interruptionReason: string | null;
}

export class MediaCaptureService {
  private static mediaStream: MediaStream | null = null;
  private static mediaRecorder: MediaRecorder | null = null;
  private static chunks: Blob[] = [];
  private static startTime: number = 0;
  private static isRecordingActive = false;
  private static interrupted = false;
  private static interruptionReason: string | null = null;
  private static onStopCallback: ((result: RecordingResult) => void) | null = null;

  // Get best supported video mime type dynamically
  private static getSupportedVideoMimeType(): string {
    const types = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4;codecs=avc1,aac',
      'video/mp4',
      'video/ogg',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ''; // fallback to default
  }

  // Get best supported audio mime type dynamically
  private static getSupportedAudioMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4;codecs=aac',
      'audio/mp4',
      'audio/wav',
      'audio/mpeg',
      'audio/aac',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ''; // fallback to default
  }

  static async startRecording(
    type: 'VIDEO' | 'AUDIO',
    onStop: (result: RecordingResult) => void,
    onTrackError?: (error: Error) => void
  ): Promise<MediaStream | null> {
    try {
      this.cleanup();
      this.isRecordingActive = true;
      this.interrupted = false;
      this.interruptionReason = null;
      this.onStopCallback = onStop;
      this.chunks = [];

      const constraints: MediaStreamConstraints = {};

      if (type === 'VIDEO') {
        constraints.video = {
          facingMode: 'user', // front-facing
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        };
        constraints.audio = {
          echoCancellation: true,
          noiseSuppression: true,
        };
      } else {
        constraints.audio = {
          echoCancellation: true,
          noiseSuppression: true,
        };
        constraints.video = false;
      }

      // Check device media support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Device does not support media recording.');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        console.warn('⚠️ Initial media constraints failed, retrying with fallback mobile constraints:', firstErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia(
            type === 'VIDEO'
              ? { video: { facingMode: 'user' }, audio: true }
              : { audio: true }
          );
        } catch (secondErr) {
          console.warn('⚠️ Front-camera constraints failed, retrying with simple video/audio constraints:', secondErr);
          stream = await navigator.mediaDevices.getUserMedia(
            type === 'VIDEO' ? { video: true, audio: true } : { audio: true }
          );
        }
      }

      this.mediaStream = stream;
      this.startTime = Date.now();

      const mimeType = type === 'VIDEO' ? this.getSupportedVideoMimeType() : this.getSupportedAudioMimeType();
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }
      // Select appropriate bitrate configurations
      if (type === 'VIDEO') {
        if (safetyConfig.video.videoBitrate) {
          options.videoBitsPerSecond = safetyConfig.video.videoBitrate;
        }
        if (safetyConfig.video.audioBitrate) {
          options.audioBitsPerSecond = safetyConfig.video.audioBitrate;
        }
      } else {
        if (safetyConfig.audio.audioBitrate) {
          options.audioBitsPerSecond = safetyConfig.audio.audioBitrate;
        }
      }

      const recorder = new MediaRecorder(stream, options);
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);

          // Dynamic size check
          const totalSize = this.chunks.reduce((sum, c) => sum + c.size, 0);
          const maxSize = type === 'VIDEO' ? safetyConfig.video.maxSize : safetyConfig.audio.maxSize;
          if (totalSize >= maxSize) {
            console.warn(`Recording size limit reached (${maxSize} bytes). Stopping safely.`);
            this.interrupted = true;
            this.interruptionReason = 'FILE_SIZE_LIMIT_REACHED';
            this.stopRecording();
          }
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(this.chunks, { type: mimeType || recorder.mimeType });
        const duration = (Date.now() - this.startTime) / 1000;

        if (this.onStopCallback) {
          this.onStopCallback({
            blob: finalBlob,
            mimeType: mimeType || recorder.mimeType,
            duration,
            interrupted: this.interrupted,
            interruptionReason: this.interruptionReason,
          });
        }
        this.cleanup();
      };

      recorder.start(); // Continuous recording for complete WebM file header
      return stream;
    } catch (err: any) {
      this.cleanup();
      if (onTrackError) {
        onTrackError(err);
      }
      throw err;
    }
  }

  static stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    } else {
      this.cleanup();
    }
  }

  // Interruption handler (background constraint)
  static handleInterruption(reason: string): void {
    if (this.isRecordingActive) {
      console.warn(`Recording interrupted dynamically. Reason: ${reason}`);
      this.interrupted = true;
      this.interruptionReason = reason;
      this.stopRecording();
    }
  }

  static cleanup(): void {
    this.isRecordingActive = false;
    this.onStopCallback = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
  }
}
