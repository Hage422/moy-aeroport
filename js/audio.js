// audio.js — every sound is synthesised (no files). The context is created on the first touch; audioSession keeps sound on in silent mode (iOS).
const SND = {
  ctx: null, master: null, vol: 0.8, noiseBuf: null, loops: {},
  init() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.master.gain.value = this.vol;
        const comp = this.ctx.createDynamicsCompressor(); this.master.connect(comp); comp.connect(this.ctx.destination);
        const n = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = b;
        const s = this.ctx.createBufferSource(), e = this.ctx.createBuffer(1, 1, 22050); s.buffer = e; s.connect(this.ctx.destination); s.start(0);
      }
      if (this.ctx.state !== 'running') this.ctx.resume();
      return true;
    } catch (e) { return false; }
  },
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02); },
  ok() { return this.ctx && this.vol > 0.001 && this.ctx.state === 'running'; },
  tone(f, t0, dur, type = 'sine', peak = 0.25, f2 = 0) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.015, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  noise(t0, dur, peak, ftype, f0, f1, attack = 0.02, q = 0.8) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true; f.type = ftype; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t0); s.stop(t0 + dur + 0.05);
  },
  play(name) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'tap': this.tone(560, t, 0.06, 'sine', 0.16); break;
      case 'select': this.tone(660, t, 0.07, 'sine', 0.18); this.tone(990, t + 0.06, 0.09, 'sine', 0.16); break;
      case 'back': this.tone(520, t, 0.07, 'sine', 0.15); this.tone(390, t + 0.06, 0.09, 'sine', 0.13); break;
      case 'warn': [0, 0.42].forEach(d => { this.tone(988, t + d, 0.16, 'triangle', 0.26); this.tone(740, t + d + 0.17, 0.26, 'triangle', 0.26); }); break;
      case 'touch': this.noise(t, 0.35, 0.5, 'lowpass', 900, 200, 0.01); this.tone(95, t, 0.22, 'sine', 0.4, 55); break;
      case 'engineLand': this.noise(t, 3.4, 0.22, 'bandpass', 900, 260, 0.2, 0.7); break;
      case 'engineTake': this.noise(t, 4.6, 0.3, 'bandpass', 260, 1500, 1.4, 0.7); this.noise(t, 4.6, 0.2, 'lowpass', 300, 600, 1.0, 0.5); break;
      case 'done': this.tone(1047, t, 0.16, 'triangle', 0.22); this.tone(1319, t + 0.11, 0.26, 'triangle', 0.22); break;
      case 'coin': this.tone(1568, t, 0.1, 'sine', 0.2); this.tone(2093, t + 0.08, 0.22, 'sine', 0.2); break;
      case 'error': this.tone(170, t, 0.13, 'square', 0.13); this.tone(150, t + 0.16, 0.16, 'square', 0.13); break;
      case 'ready': this.tone(1319, t, 0.12, 'sine', 0.2); this.tone(1760, t + 0.1, 0.3, 'sine', 0.2); break;
      case 'beacon': this.tone(1200, t, 0.08, 'sine', 0.2); this.tone(1200, t + 0.2, 0.08, 'sine', 0.2); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.14, 0.34, 'triangle', 0.26)); break;
      case 'lose': [392, 330, 262].forEach((f, i) => this.tone(f, t + i * 0.24, 0.42, 'sawtooth', 0.14)); break;
      case 'bridge': this.noise(t, 0.9, 0.1, 'bandpass', 400, 700, 0.1, 1.2); break;
    }
  },
};
