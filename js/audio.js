// Motore audio procedurale (Web Audio API): nessun file audio da scaricare.
import * as THREE from 'three';

const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _f = new THREE.Vector3();
const _u = new THREE.Vector3();

export const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.voices = [];
    if ('speechSynthesis' in window) {
      const load = () => { this.voices = window.speechSynthesis.getVoices() || []; };
      load();
      window.speechSynthesis.addEventListener?.('voiceschanged', load);
    }
  }

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      const c = (this.ctx = new AC());
      this.master = c.createGain();
      this.master.gain.value = 0.9;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      comp.attack.value = 0.01;
      comp.release.value = 0.3;
      this.master.connect(comp).connect(c.destination);
      this.amb = c.createGain(); // bus ambiente (attenuabile durante la lettura)
      this.amb.connect(this.master);
      this.buffers = { white: this._noise('white'), pink: this._noise('pink'), brown: this._noise('brown') };
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _noise(type) {
    const c = this.ctx;
    const len = Math.floor(c.sampleRate * 4);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0, peak = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      let v = w;
      if (type === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        v = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
      } else if (type === 'brown') {
        last = (last + 0.02 * w) / 1.02; v = last;
      }
      d[i] = v; peak = Math.max(peak, Math.abs(v));
    }
    for (let i = 0; i < len; i++) d[i] = (d[i] / peak) * 0.9;
    // raccordo morbido per il loop
    const fade = 2000;
    for (let i = 0; i < fade; i++) { const k = i / fade; d[i] *= k; d[len - 1 - i] *= k; }
    return buf;
  }

  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  setDuck(v, t = 0.8) {
    if (!this.ctx) return;
    const g = this.amb.gain, n = this.ctx.currentTime;
    g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(v, n + t);
  }

  updateListener(cam) {
    if (!this.ctx) return;
    cam.matrixWorld.decompose(_p, _q, _s);
    _f.set(0, 0, -1).applyQuaternion(_q);
    _u.set(0, 1, 0).applyQuaternion(_q);
    const L = this.ctx.listener;
    if (L.positionX) {
      const t = this.ctx.currentTime;
      L.positionX.setValueAtTime(_p.x, t); L.positionY.setValueAtTime(_p.y, t); L.positionZ.setValueAtTime(_p.z, t);
      L.forwardX.setValueAtTime(_f.x, t); L.forwardY.setValueAtTime(_f.y, t); L.forwardZ.setValueAtTime(_f.z, t);
      L.upX.setValueAtTime(_u.x, t); L.upY.setValueAtTime(_u.y, t); L.upZ.setValueAtTime(_u.z, t);
    } else if (L.setPosition) {
      L.setPosition(_p.x, _p.y, _p.z);
      L.setOrientation(_f.x, _f.y, _f.z, _u.x, _u.y, _u.z);
    }
  }

  // Segnale breve non attenuato (conto alla rovescia, click interfaccia)
  beep(f = 880, d = 0.15, v = 0.25, type = 'sine', delay = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.setValueAtTime(v, t + Math.max(0.02, d - 0.04));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + d + 0.05);
    o.onended = () => { o.disconnect(); g.disconnect(); };
  }

  click() { this.beep(1400, 0.05, 0.12, 'triangle'); }

  hasVoice(lang = 'it') { return this.voices.some((v) => v.lang && v.lang.toLowerCase().startsWith(lang)); }

  say(text, { lang = 'it-IT', rate = 1, pitch = 1, volume = 1 } = {}) {
    if (!('speechSynthesis' in window) || !this.hasVoice(lang.slice(0, 2))) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = rate; u.pitch = pitch; u.volume = volume;
      const pref = lang.slice(0, 2);
      const v = this.voices.find((x) => x.lang && x.lang.replace('_', '-') === lang) ||
        this.voices.find((x) => x.lang && x.lang.startsWith(pref));
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch (e) { /* sintesi vocale non disponibile */ }
  }

  hush() { try { window.speechSynthesis?.cancel(); } catch (e) {} }

  scope() { return new SoundScope(this); }

  suspend() { this.hush(); }
}

export class SoundScope {
  constructor(e) {
    this.e = e; this.c = e.ctx;
    this.out = this.c.createGain();
    this.out.gain.setValueAtTime(0, this.c.currentTime);
    this.out.gain.linearRampToValueAtTime(1, this.c.currentTime + 2);
    this.out.connect(e.amb);
    this.srcs = new Set(); this.timers = []; this.alive = true; this.media = [];
  }
  // Registrazione reale in streaming (archive.org ecc.), con dissolvenza e partenza da un punto casuale
  stream(url, { gain = 1, dest = this.out, loop = true, random = true, start = 0, onFail, rate = 1 } = {}) {
    const el = new Audio();
    el.crossOrigin = 'anonymous'; el.loop = loop; el.preload = 'auto'; el.playbackRate = rate;
    const h = { el, ok: false, failed: false, target: gain };
    const fail = () => { if (h.failed || h.ok) return; h.failed = true; if (onFail && this.alive) onFail(); };
    try {
      h.src = this.c.createMediaElementSource(el);
      h.g = this.gain(0, dest); h.src.connect(h.g);
    } catch (e) { fail(); return h; }
    el.addEventListener('loadedmetadata', () => {
      if (start) el.currentTime = start;
      else if (random && isFinite(el.duration) && el.duration > 30) el.currentTime = Math.random() * (el.duration - 20);
    }, { once: true });
    el.addEventListener('playing', () => { h.ok = true; });
    el.addEventListener('error', fail);
    el.src = url;
    const go = () => { if (this.alive) { const p = el.play(); if (p && p.catch) p.catch(() => {}); } };
    go(); el.addEventListener('canplay', () => { if (el.paused) go(); }, { once: true });
    const t = this.c.currentTime;
    h.g.gain.setValueAtTime(0, t); h.g.gain.linearRampToValueAtTime(gain, t + 2.5);
    this.after(10000, () => { if (!h.ok) fail(); });
    this.media.push(h);
    return h;
  }
  fade(h, v, secs = 1) {
    if (!h || !h.g) return;
    const t = this.c.currentTime, g = h.g.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + secs);
  }
  get t() { return this.c.currentTime; }
  gain(v = 1, dest) { const g = this.c.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; }
  filter(type, f, q = 1, dest) {
    const b = this.c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q;
    if (dest) b.connect(dest); return b;
  }
  noise(kind = 'pink', rate = 1) {
    const s = this.c.createBufferSource(); s.buffer = this.e.buffers[kind]; s.loop = true;
    s.playbackRate.value = rate; s.start(0, Math.random() * 3); this.srcs.add(s); return s;
  }
  osc(type = 'sine', f = 440) {
    const o = this.c.createOscillator(); o.type = type; o.frequency.value = f; o.start(); this.srcs.add(o); return o;
  }
  shotOsc(type, f, t0, t1) {
    const o = this.c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0);
    o.start(t0); o.stop(t1); this.srcs.add(o);
    o.onended = () => { o.disconnect(); this.srcs.delete(o); };
    return o;
  }
  shotNoise(kind, t0, dur, rate = 1) {
    const s = this.c.createBufferSource(); s.buffer = this.e.buffers[kind]; s.playbackRate.value = rate;
    s.start(t0, Math.random() * 3); s.stop(t0 + dur); this.srcs.add(s);
    s.onended = () => { s.disconnect(); this.srcs.delete(s); };
    return s;
  }
  panner(x = 0, y = 0, z = 0, { ref = 6, roll = 1, max = 10000 } = {}) {
    const p = this.c.createPanner();
    p.panningModel = 'HRTF'; p.distanceModel = 'inverse';
    p.refDistance = ref; p.rolloffFactor = roll; p.maxDistance = max;
    SoundScope.setPos(p, x, y, z); p.connect(this.out); return p;
  }
  static setPos(p, x, y, z) {
    if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; }
    else p.setPosition(x, y, z);
  }
  every(ms, fn) { const id = setInterval(() => { if (this.alive) fn(); }, ms); this.timers.push(() => clearInterval(id)); return id; }
  after(ms, fn) { const id = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(() => clearTimeout(id)); return id; }
  say(text, opts) { if (this.alive) this.e.say(text, opts); }
  stop(f = 0.8) {
    if (!this.alive) return;
    this.alive = false;
    this.timers.forEach((k) => k()); this.timers = [];
    const t = this.c.currentTime, g = this.out.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + f);
    setTimeout(() => {
      this.media.forEach((h) => { try { h.el.pause(); h.el.removeAttribute('src'); h.el.load(); } catch (e) {} try { h.src && h.src.disconnect(); } catch (e) {} });
      this.media = [];
      this.srcs.forEach((s) => { try { s.stop(); } catch (e) {} try { s.disconnect(); } catch (e) {} });
      this.srcs.clear();
      try { this.out.disconnect(); } catch (e) {}
    }, f * 1000 + 150);
  }
}

// ---------- Ricette sonore ----------

export function env(param, t, a, peak, d, floor = 0.0001) {
  param.cancelScheduledValues(t);
  param.setValueAtTime(floor, t);
  param.linearRampToValueAtTime(peak, t + a);
  param.exponentialRampToValueAtTime(floor, t + a + d);
}

// Brusio di fondo modulato (folla, città)
export function bed(s, dest, { kind = 'pink', type = 'bandpass', f = 900, q = 0.7, level = 0.3, lfo = 0.08, depth = 0.4 } = {}) {
  const src = s.noise(kind);
  const fl = s.filter(type, f, q);
  const g = s.gain(level);
  src.connect(fl).connect(g).connect(dest);
  if (lfo > 0) {
    const l = s.osc('sine', lfo); const lg = s.gain(level * depth);
    l.connect(lg).connect(g.gain);
  }
  return g;
}

// Coro da stadio: voci con formanti, melodia ripetuta
export function chant(s, dest, { level = 0.12, bpm = 112, base = 50 } = {}) {
  const c = s.c;
  const sum = s.gain(1);
  const f1 = s.filter('bandpass', 650, 4), f2 = s.filter('bandpass', 1150, 5);
  const env1 = s.gain(0);
  sum.connect(f1); sum.connect(f2); f1.connect(env1); f2.connect(env1);
  env1.connect(dest);
  const voices = [];
  for (let i = 0; i < 7; i++) {
    const o = s.osc('sawtooth', 200);
    const g = s.gain(i < 5 ? 0.22 : 0.12);
    o.connect(g).connect(sum);
    voices.push({ o, det: (Math.random() - 0.5) * 0.03, oct: i >= 5 ? 2 : 1 });
  }
  const br = bed(s, env1, { kind: 'white', type: 'bandpass', f: 1800, q: 1.2, level: 0.15, lfo: 0 });
  const melodies = [
    [[7, 1], [4, 1], [7, 1], [4, 1], [7, 0.5], [9, 0.5], [7, 0.5], [5, 0.5], [4, 2], [null, 2]],
    [[0, 1], [4, 1], [7, 2], [7, 1], [9, 1], [7, 2], [5, 1], [4, 1], [2, 2], [null, 2]],
    [[4, 0.5], [4, 0.5], [7, 1], [7, 0.5], [7, 0.5], [9, 1], [7, 1], [4, 1], [null, 3]]
  ];
  let next = c.currentTime + 1.5, mel = 0, idx = 0, rest = 0;
  const beat = 60 / bpm;
  const sched = () => {
    while (next < c.currentTime + 1.2) {
      if (rest > 0) { next += rest; rest = 0; continue; }
      const m = melodies[mel];
      const [n, dur] = m[idx];
      const d = dur * beat;
      if (n !== null) {
        voices.forEach((v) => v.o.frequency.setValueAtTime(midi(base + n) * v.oct * (1 + v.det), next));
        const g = env1.gain;
        g.setValueAtTime(0.0001, next);
        g.linearRampToValueAtTime(level, next + 0.06);
        g.setValueAtTime(level, next + d * 0.8);
        g.linearRampToValueAtTime(0.0001, next + d * 0.98);
      }
      next += d; idx++;
      if (idx >= m.length) { idx = 0; if (Math.random() < 0.45) { mel = (mel + 1) % melodies.length; rest = 3 + Math.random() * 5; } }
    }
  };
  s.every(250, sched);
  return { out: env1, setBase: (b) => { base = b; } };
}

export function kick(s, dest, t, v = 0.8, f0 = 120, f1 = 45, d = 0.35) {
  const o = s.shotOsc('sine', f0, t, t + d + 0.05);
  o.frequency.exponentialRampToValueAtTime(f1, t + d * 0.6);
  const g = s.gain(0, dest); o.connect(g); env(g.gain, t, 0.005, v, d);
}

export function snare(s, dest, t, v = 0.4) {
  const n = s.shotNoise('white', t, 0.25);
  const f = s.filter('highpass', 1500, 0.7); const g = s.gain(0, dest);
  n.connect(f).connect(g); env(g.gain, t, 0.003, v, 0.18);
}

export function drums(s, dest, { bpm = 120, level = 0.7 } = {}) {
  const c = s.c; const beat = 60 / bpm;
  const pattern = [0, 1, 2, 2.5, 3]; // BUM BUM BUM-BUM BUM
  let next = c.currentTime + 2, bar = 0;
  s.every(300, () => {
    while (next < c.currentTime + 1.5) {
      const pause = bar % 8 === 7;
      if (!pause) pattern.forEach((p) => kick(s, dest, next + p * beat, level * (p === 0 ? 1 : 0.8), 110, 50, 0.3));
      if (bar % 2 === 1 && !pause) snare(s, dest, next + 3.5 * beat, level * 0.35);
      next += 4 * beat; bar++;
    }
  });
}

export function whistle(s, dest, t, v = 0.15) {
  const o = s.shotOsc('sine', 2500 + Math.random() * 600, t, t + 0.7);
  const l = s.shotOsc('sine', 6 + Math.random() * 4, t, t + 0.7);
  const lg = s.gain(70); l.connect(lg).connect(o.frequency);
  const g = s.gain(0, dest); o.connect(g); env(g.gain, t, 0.03, v, 0.55);
}

// Applausi: rumore con inviluppo granulare
export function applause(s, dest) {
  const n = s.noise('white');
  const f = s.filter('bandpass', 2200, 0.6); const g = s.gain(0);
  n.connect(f).connect(g).connect(dest);
  return {
    burst(dur = 3, level = 0.25) {
      const t0 = s.t;
      for (let k = 0; k < dur * 40; k++) {
        const tt = t0 + k / 40;
        const shape = Math.sin(Math.PI * Math.min(1, k / (dur * 40)));
        g.gain.setValueAtTime(level * shape * (0.4 + Math.random() * 0.6), tt);
      }
      g.gain.setValueAtTime(0, t0 + dur + 0.05);
    }
  };
}

export function boom(s, dest, t, v = 1) {
  const n = s.shotNoise('brown', t, 4.5);
  const f = s.filter('lowpass', 140, 0.8); const g = s.gain(0, dest);
  n.connect(f).connect(g); env(g.gain, t, 0.06, v, 4);
  const o = s.shotOsc('sine', 48, t, t + 2.5);
  o.frequency.exponentialRampToValueAtTime(28, t + 2);
  const g2 = s.gain(0, dest); o.connect(g2); env(g2.gain, t, 0.03, v * 0.7, 2.2);
}

export function squelch(s, dest, t, v = 0.15) {
  const n = s.shotNoise('white', t, 0.18);
  const f = s.filter('bandpass', 2200, 1.5); const g = s.gain(0, dest);
  n.connect(f).connect(g); env(g.gain, t, 0.005, v, 0.16);
  const o = s.shotOsc('square', 1250, t + 0.18, t + 0.26);
  const g2 = s.gain(0, dest); o.connect(g2); env(g2.gain, t + 0.18, 0.005, v * 0.5, 0.07);
}

// Sirena bitonale italiana
export function sirenIT(s, dest, { level = 0.25, hi = 920, lo = 690 } = {}) {
  const o = s.osc('triangle', lo);
  const f = s.filter('lowpass', 2500, 0.7); const g = s.gain(level);
  o.connect(f).connect(g).connect(dest);
  let next = s.t + 0.1, hiOn = false;
  s.every(250, () => {
    while (next < s.t + 1) { o.frequency.setValueAtTime(hiOn ? hi : lo, next); hiOn = !hiOn; next += 0.55; }
  });
  return g;
}

// Sirena americana (wail)
export function sirenUS(s, dest, { level = 0.2, rate = 0.22 } = {}) {
  const o = s.osc('sine', 1000);
  const l = s.osc('sine', rate); const lg = s.gain(420);
  l.connect(lg).connect(o.frequency);
  const o2 = s.osc('triangle', 1000); const lg2 = s.gain(420); l.connect(lg2).connect(o2.frequency);
  const g = s.gain(level); const g2 = s.gain(level * 0.3);
  o.connect(g).connect(dest); o2.connect(g2).connect(dest);
  return g;
}

export function heli(s, dest, level = 0.5) {
  const n = s.noise('brown');
  const f = s.filter('lowpass', 420, 1); const g = s.gain(0);
  n.connect(f).connect(g).connect(dest);
  const l = s.osc('square', 16.5); const lg = s.gain(level * 0.5);
  l.connect(lg).connect(g.gain);
  g.gain.value = level * 0.5;
  return g;
}

export function horn(s, dest, t, v = 0.15, f = 420) {
  const g = s.gain(0, dest);
  const fl = s.filter('lowpass', 1800, 0.7); fl.connect(g);
  s.shotOsc('square', f, t, t + 0.5).connect(fl);
  s.shotOsc('square', f * 1.26, t, t + 0.5).connect(fl);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.02);
  g.gain.setValueAtTime(v, t + 0.38); g.gain.linearRampToValueAtTime(0.0001, t + 0.45);
}

export function beeps(s, dest, t, v = 0.08) {
  const n = 1 + Math.floor(Math.random() * 3);
  const f = [1200, 1600, 2000, 2400][Math.floor(Math.random() * 4)];
  for (let i = 0; i < n; i++) {
    const tt = t + i * 0.14;
    const o = s.shotOsc('sine', f, tt, tt + 0.09);
    const g = s.gain(0, dest); o.connect(g); env(g.gain, tt, 0.005, v, 0.08);
  }
}

export function alarm(s, dest, level = 0.12) {
  const o = s.osc('square', 880); const f = s.filter('lowpass', 2500); const g = s.gain(0);
  o.connect(f).connect(g).connect(dest);
  let on = false;
  s.every(220, () => {
    if (!on) return;
    const t = s.t; g.gain.setValueAtTime(level, t); g.gain.setValueAtTime(0, t + 0.11);
  });
  return { on() { on = true; }, off() { on = false; g.gain.setValueAtTime(0, s.t); } };
}

export function powerDown(s, dest, t) {
  const o = s.shotOsc('sawtooth', 320, t, t + 1.4);
  o.frequency.exponentialRampToValueAtTime(22, t + 1.3);
  const f = s.filter('lowpass', 1200); const g = s.gain(0, dest);
  o.connect(f).connect(g); env(g.gain, t, 0.01, 0.35, 1.3);
  boom(s, dest, t + 0.05, 0.4);
}

// Jingle Bells (melodia tradizionale, pubblico dominio) con campanelle FM
export function jingle(s, dest, { level = 0.22, bpm = 150 } = {}) {
  const c = s.c; const beat = 60 / bpm;
  const out = s.gain(level, dest);
  const E = 76, F = 77, G = 79, C = 72, D = 74;
  const mel = [
    [E, 1], [E, 1], [E, 2], [E, 1], [E, 1], [E, 2], [E, 1], [G, 1], [C, 1.5], [D, 0.5], [E, 4],
    [F, 1], [F, 1], [F, 1.5], [F, 0.5], [F, 1], [E, 1], [E, 1], [E, 0.5], [E, 0.5], [E, 1], [D, 1], [D, 1], [E, 1], [D, 2], [G, 2],
    [E, 1], [E, 1], [E, 2], [E, 1], [E, 1], [E, 2], [E, 1], [G, 1], [C, 1.5], [D, 0.5], [E, 4],
    [F, 1], [F, 1], [F, 1.5], [F, 0.5], [F, 1], [E, 1], [E, 1], [E, 0.5], [E, 0.5], [G, 1], [G, 1], [F, 1], [D, 1], [C, 4]
  ];
  const bass = [48, 48, 48, 48, 53, 48, 55, 55, 48, 48, 48, 48, 53, 48, 55, 48];
  let running = true, next = c.currentTime + 0.5, i = 0, beatCount = 0, nextBeat = next;
  const bell = (n, t, d, v) => {
    const f = midi(n);
    const car = s.shotOsc('sine', f, t, t + d + 1.2);
    const mod = s.shotOsc('sine', f * 3.5, t, t + d + 1.2);
    const mg = s.gain(0); mod.connect(mg).connect(car.frequency);
    mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.1, t + 0.8);
    const g = s.gain(0, out); car.connect(g); env(g.gain, t, 0.005, v, d + 1.0);
  };
  const sleigh = (t) => {
    const n = s.shotNoise('white', t, 0.15); const f = s.filter('highpass', 6500, 0.8); const g = s.gain(0, out);
    n.connect(f).connect(g); env(g.gain, t, 0.003, 0.18, 0.12);
  };
  s.every(100, () => {
    if (!running) return;
    while (next < c.currentTime + 0.6) {
      const [n, d] = mel[i];
      bell(n, next, d * beat, 0.5);
      next += d * beat; i = (i + 1) % mel.length;
      if (i === 0) next += 2 * beat;
    }
    while (nextBeat < c.currentTime + 0.6) {
      const bar = Math.floor(beatCount / 4) % bass.length;
      if (beatCount % 2 === 0) {
        const o = s.shotOsc('triangle', midi(bass[bar]), nextBeat, nextBeat + beat * 1.8);
        const g = s.gain(0, out); o.connect(g); env(g.gain, nextBeat, 0.01, 0.45, beat * 1.7);
      }
      sleigh(nextBeat); sleigh(nextBeat + beat / 2);
      nextBeat += beat; beatCount++;
    }
  });
  return {
    stop() {
      running = false;
      const t = c.currentTime;
      out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(0, t + 0.25);
    }
  };
}

// "Ooooh" di sorpresa della folla
export function crowdOoh(s, dest, t, v = 0.25) {
  const sum = s.gain(0, dest);
  const f1 = s.filter('bandpass', 500, 3, sum), f2 = s.filter('bandpass', 900, 4, sum);
  for (let i = 0; i < 8; i++) {
    const f0 = 180 + Math.random() * 160;
    const o = s.shotOsc('sawtooth', f0 * 1.15, t, t + 3.2);
    o.frequency.linearRampToValueAtTime(f0, t + 2.8);
    o.connect(f1); o.connect(f2);
  }
  sum.gain.setValueAtTime(0.0001, t); sum.gain.linearRampToValueAtTime(v, t + 0.5);
  sum.gain.linearRampToValueAtTime(0.0001, t + 3);
}
