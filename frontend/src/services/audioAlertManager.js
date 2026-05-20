/**
 * Audio alert manager using HTML5 Audio with inline-generated audio.
 * Uses base64-encoded WAV beeps for maximum browser compatibility.
 */

// Generate a WAV beep as a base64 data URI
function generateBeepDataUri(frequency, durationMs, volume = 0.5) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * (durationMs / 1000));
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = i < numSamples * 0.1 ? i / (numSamples * 0.1) :
                     i > numSamples * 0.7 ? (numSamples - i) / (numSamples * 0.3) : 1;
    const sample = Math.sin(2 * Math.PI * frequency * t) * volume * envelope;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(headerSize + i * 2, intSample, true);
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

class AudioAlertManager {
  constructor() {
    this.muted = false;
    this.isPlaying = false;
    this.currentSeverity = null;
    this.intervalId = null;
    this.warningAudio = null;
    this.criticalAudio = null;
    this._initialized = false;
  }

  _initialize() {
    if (this._initialized) return;
    // Generate beep sounds
    this.warningBeepUri = generateBeepDataUri(440, 400, 0.8);
    this.criticalBeepUri = generateBeepDataUri(880, 200, 1.0);
    this._initialized = true;
  }

  unlock() {
    this._initialize();
    // Play a silent sound to unlock audio
    const audio = new Audio(generateBeepDataUri(440, 1, 0.001));
    audio.volume = 0.01;
    audio.play().catch(() => {});
  }

  playAlert(severity) {
    if (this.muted) return;
    this._initialize();

    if (severity === 'Critical') {
      this.stopSound();
      this._playCriticalSound();
    } else if (severity === 'Warning') {
      if (this.currentSeverity === 'Critical') {
        return; // Don't interrupt critical
      }
      this.stopSound();
      this._playWarningSound();
    }
  }

  _playWarningSound() {
    this.currentSeverity = 'Warning';
    this.isPlaying = true;
    let beepCount = 0;

    const playBeep = () => {
      if (!this.isPlaying || this.muted) {
        this._clearInterval();
        return;
      }
      if (beepCount < 3) {
        const audio = new Audio(this.warningBeepUri);
        audio.volume = 1.0;
        audio.play().catch((e) => console.warn('Audio play failed:', e));
        beepCount++;
      } else {
        this._clearInterval();
        this.isPlaying = false;
        this.currentSeverity = null;
      }
    };

    playBeep();
    this.intervalId = setInterval(playBeep, 800);
  }

  _playCriticalSound() {
    this.currentSeverity = 'Critical';
    this.isPlaying = true;
    let count = 0;

    const playBeep = () => {
      if (!this.isPlaying || this.muted) {
        this._clearInterval();
        return;
      }
      const audio = new Audio(this.criticalBeepUri);
      audio.volume = 1.0;
      audio.play().catch((e) => console.warn('Audio play failed:', e));
      count++;
      if (count > 15) {
        this._clearInterval();
        this.isPlaying = false;
        this.currentSeverity = null;
      }
    };

    playBeep();
    this.intervalId = setInterval(playBeep, 350);
  }

  _clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  stopSound() {
    this.isPlaying = false;
    this.currentSeverity = null;
    this._clearInterval();
  }

  mute() {
    this.muted = true;
    this.stopSound();
  }

  unmute() {
    this.muted = false;
  }

  toggleMute() {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.muted;
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  getMuted() {
    return this.muted;
  }
}

// Singleton instance
const audioAlertManager = new AudioAlertManager();
export default audioAlertManager;
