// Web Audio API ambient noise & typewriter sound generator for Focus Mode

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private soundType: 'rain' | 'waves' | 'brown' | 'off' = 'off';

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playTypewriterClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {
      // Audio autoplay restrictions
    }
  }

  public setAmbientSound(type: 'rain' | 'waves' | 'brown' | 'off', volume = 0.2) {
    this.initCtx();
    if (!this.ctx) return;

    this.stopAmbient();

    if (type === 'off') {
      this.soundType = 'off';
      return;
    }

    this.soundType = type;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown' || type === 'waves') {
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // boost
      } else {
        // Rain - pinkish filtered noise
        output[i] = (lastOut + (0.05 * white)) / 1.05;
        lastOut = output[i];
        output[i] *= 2.0;
      }
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter
    const filter = this.ctx.createBiquadFilter();
    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    } else if (type === 'waves') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, this.ctx.currentTime);
    }

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    whiteNoise.start();
    this.noiseNode = whiteNoise;
    this.isPlaying = true;
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public stopAmbient() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
      } catch {
        // Already stopped
      }
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    this.isPlaying = false;
  }

  public getCurrentType() {
    return this.soundType;
  }
}

export const soundEngine = new SoundEngine();
