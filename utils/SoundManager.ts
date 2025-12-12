export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (this.ctx && this.masterGain) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // Global volume
    this.masterGain.connect(this.ctx.destination);
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.error("Audio resume failed", e));
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.5, slideTo?: number) {
     this.init();
     if (!this.masterGain) return;
     
     // Critical fix: Use the context of the masterGain to ensure nodes belong to the same context
     const ctx = this.masterGain.context as AudioContext;
     
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
     
     osc.type = type;
     osc.frequency.setValueAtTime(freq, ctx.currentTime);
     if (slideTo) {
         osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
     }
     
     gain.gain.setValueAtTime(vol, ctx.currentTime);
     gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
     
     osc.connect(gain);
     gain.connect(this.masterGain);
     
     osc.start();
     osc.stop(ctx.currentTime + duration);
  }

  private playNoise(duration: number, vol: number = 0.5) {
      this.init();
      if (!this.masterGain) return;
      
      const ctx = this.masterGain.context as AudioContext;
      
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      noise.connect(gain);
      gain.connect(this.masterGain);
      
      noise.start();
  }

  public playShoot(pitch = 800) {
     this.playTone(pitch, 'sawtooth', 0.1, 0.3, 100);
  }
  
  public playFootstep() {
     // Low frequency thump
     this.playTone(80, 'square', 0.05, 0.1, 40);
  }
  
  public playPlayerDamage() {
      this.playTone(150, 'sawtooth', 0.3, 0.5, 50);
  }
  
  public playEnemyDamage() {
      this.playTone(400, 'square', 0.05, 0.2);
  }
  
  public playEnemyDeath() {
      this.playNoise(0.2, 0.3);
      this.playTone(200, 'sawtooth', 0.3, 0.3, 20);
  }
  
  public playCrateBreak() {
      this.playNoise(0.15, 0.4);
  }
  
  public playPowerup() {
      this.playTone(400, 'sine', 0.4, 0.3, 1200);
  }
  
  public playWaveComplete() {
       this.init();
       [440, 554, 659, 880].forEach((freq, i) => {
           setTimeout(() => this.playTone(freq, 'sine', 0.4, 0.2), i * 150);
       });
  }
}

export const soundManager = new SoundManager();