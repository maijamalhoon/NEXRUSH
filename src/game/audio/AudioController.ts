export class AudioController {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;

  // Master Gain Nodes
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private engineGain: GainNode | null = null;

  // Engine Synth Nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Tire Squeal Nodes
  private squealSource: AudioBufferSourceNode | null = null;
  private squealGain: GainNode | null = null;

  // Boost Whoosh Nodes
  private boostGain: GainNode | null = null;

  public soundVolume = 0.8;
  public musicVolume = 0.6;

  public unlock(): void {
    if (this.isUnlocked) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }

      // Master hierarchy
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.soundVolume;
      this.sfxGain.connect(this.masterGain);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = this.soundVolume * 0.7;
      this.engineGain.connect(this.masterGain);

      this.initEngineSynth();
      this.initTireSqueal();
      this.initBoostNoise();

      this.isUnlocked = true;
    } catch (e) {
      console.warn("WebAudio initialization warning:", e);
    }
  }

  private initEngineSynth(): void {
    if (!this.ctx || !this.engineGain) return;

    // Dual oscillator for rich engine harmonics (Sawtooth + Triangle)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = "sawtooth";
    this.engineOsc1.frequency.value = 65;

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = "triangle";
    this.engineOsc2.frequency.value = 32.5;

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = "lowpass";
    this.engineFilter.frequency.value = 600;

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  private initTireSqueal(): void {
    if (!this.ctx || !this.sfxGain) return;

    // Generate looping white noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.squealSource = this.ctx.createBufferSource();
    this.squealSource.buffer = noiseBuffer;
    this.squealSource.loop = true;

    // Bandpass filter centered at tire friction squeal (1050 Hz)
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1050;
    bandpass.Q.value = 3.5;

    this.squealGain = this.ctx.createGain();
    this.squealGain.gain.value = 0.0;

    this.squealSource.connect(bandpass);
    bandpass.connect(this.squealGain);
    this.squealGain.connect(this.sfxGain);

    this.squealSource.start();
  }

  private initBoostNoise(): void {
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const boostSource = this.ctx.createBufferSource();
    boostSource.buffer = noiseBuffer;
    boostSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 450;

    this.boostGain = this.ctx.createGain();
    this.boostGain.gain.value = 0.0;

    boostSource.connect(lowpass);
    lowpass.connect(this.boostGain);
    this.boostGain.connect(this.sfxGain);

    boostSource.start();
  }

  public updateTelemetry(
    rpm: number,
    driftAngle: number,
    isBoosting: boolean,
    _isBraking: boolean = false
  ): void {
    if (!this.ctx || !this.isUnlocked) return;

    const now = this.ctx.currentTime;

    // 1. Engine Pitch & Filter tracking RPM
    if (this.engineOsc1 && this.engineOsc2 && this.engineFilter) {
      // Map RPM 900..7500 -> 40Hz..320Hz base pitch
      const baseFreq = 38 + (rpm / 7500) * 220;
      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);

      // Filter opens with higher RPM and throttle
      const filterFreq = 350 + (rpm / 7500) * 1600;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.04);
    }

    // 2. Tire Squeal on Drift
    if (this.squealGain) {
      const slipAbs = Math.abs(driftAngle);
      const targetGain = slipAbs > 12 ? Math.min(0.65, (slipAbs - 12) / 35) : 0.0;
      this.squealGain.gain.setTargetAtTime(targetGain, now, 0.06);
    }

    // 3. Boost Sound
    if (this.boostGain) {
      const targetGain = isBoosting ? 0.7 : 0.0;
      this.boostGain.gain.setTargetAtTime(targetGain, now, 0.08);
    }
  }

  public playCountdownBeep(isGo = false): void {
    if (!this.ctx || !this.isUnlocked || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = isGo ? 880 : 440; // 440Hz for 3-2-1, 880Hz high note for GO

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.45 : 0.2));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + (isGo ? 0.5 : 0.25));
  }

  public playCollisionSound(intensity = 0.5): void {
    if (!this.ctx || !this.isUnlocked || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    const vol = Math.min(0.8, Math.max(0.1, intensity * 0.7));
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playClick(): void {
    if (!this.ctx || !this.isUnlocked || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public setVolumes(soundVol: number, musicVol: number): void {
    this.soundVolume = soundVol / 100;
    this.musicVolume = musicVol / 100;

    if (this.sfxGain) {
      this.sfxGain.gain.value = this.soundVolume;
    }
    if (this.engineGain) {
      this.engineGain.gain.value = this.soundVolume * 0.7;
    }
  }

  public dispose(): void {
    try {
      if (this.ctx && this.ctx.state !== "closed") {
        void this.ctx.close();
      }
    } catch {
      // Ignored on teardown
    }
    this.isUnlocked = false;
  }
}
