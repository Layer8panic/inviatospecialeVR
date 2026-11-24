// Interfaccia in VR: pannelli su canvas, pulsanti, telecamera, conto alla rovescia, gobbo.
import * as THREE from 'three';

export const FONT = 'Roboto, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
export const interactives = new Set();
export const UIConf = { aniso: 4 };

export function isShown(o) {
  let p = o;
  while (p) { if (!p.visible) return false; if (!p.parent) return p.isScene === true; p = p.parent; }
  return false;
}

export function wrapLines(ctx, text, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = []; let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Testo a blocchi con a capo automatico. Restituisce la y finale.
export function drawBlocks(ctx, blocks, x, y, maxW, align = 'left') {
  ctx.textBaseline = 'top';
  ctx.textAlign = align;
  const ax = align === 'center' ? x + maxW / 2 : x;
  for (const b of blocks) {
    ctx.font = b.font; ctx.fillStyle = b.color || '#fff';
    const lines = wrapLines(ctx, b.text, maxW);
    for (const l of lines) { ctx.fillText(l, ax, y); y += b.lh; }
    y += b.gap || 0;
  }
  return y;
}

export class CanvasPlane extends THREE.Mesh {
  constructor(wM, hM, { px = 1024, transparent = true, overlay = true } = {}) {
    const cw = Math.round(px), ch = Math.max(8, Math.round(px * hM / wM));
    const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = UIConf.aniso;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    // i pannelli restano sempre leggibili: non vengono coperti da persone o oggetti della scena
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent, toneMapped: false, fog: false, depthTest: !overlay, depthWrite: !overlay });
    super(new THREE.PlaneGeometry(wM, hM), mat);
    if (overlay) this.renderOrder = 20;
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.tex = tex; this.cw = cw; this.ch = ch;
    this.wM = wM; this.hM = hM;
  }
  draw(fn) { this.ctx.clearRect(0, 0, this.cw, this.ch); fn(this.ctx, this.cw, this.ch); this.tex.needsUpdate = true; return this; }
}

export class Button extends CanvasPlane {
  constructor(label, { w = 0.5, h = 0.14, bg = '#1f6feb', hover = '#3d8bff', fg = '#ffffff', size = 0.46, align = 'center', onSelect } = {}) {
    super(w, h, { px: Math.min(2048, Math.round(w * 1000)) });
    this.renderOrder = 22;
    Object.assign(this, { label, bg, hoverBg: hover, fg, size, align });
    this.hovered = false; this.enabled = true; this.state = null;
    this.userData.onSelect = () => { if (this.enabled && onSelect) onSelect(this); };
    this.render();
    interactives.add(this);
  }
  setState(s) { this.state = s; this.render(); }
  setLabel(l) { this.label = l; this.render(); }
  setEnabled(e) { this.enabled = e; this.render(); }
  setHover(v) { if (v !== this.hovered) { this.hovered = v; this.render(); } }
  render() {
    this.draw((c, w, h) => {
      let fill = this.bg;
      if (this.state === 'ok') fill = '#15803d';
      else if (this.state === 'bad') fill = '#b91c1c';
      else if (this.state === 'dim') fill = '#2b3240';
      else if (!this.enabled) fill = '#3a3f4a';
      else if (this.hovered) fill = this.hoverBg;
      roundRect(c, 6, 6, w - 12, h - 12, Math.min(h * 0.22, 40));
      c.fillStyle = fill; c.fill();
      if (this.hovered && this.enabled) { c.lineWidth = 10; c.strokeStyle = '#ffffff'; c.stroke(); }
      else { c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,0.25)'; c.stroke(); }
      c.fillStyle = this.enabled ? this.fg : '#9aa3b2';
      // adatta il testo: fino a 3 righe, riducendo il carattere se serve
      let fs = Math.round(h * this.size), lines;
      const maxW = w * (this.align === 'center' ? 0.88 : 0.9);
      for (; fs > 14; fs -= 2) {
        c.font = `700 ${fs}px ${FONT}`;
        lines = String(this.label).split('\n').flatMap((para) => wrapLines(c, para, maxW));
        if (lines.length * fs * 1.2 <= h * 0.84 && lines.every((l) => c.measureText(l).width <= maxW)) break;
      }
      c.textAlign = this.align; c.textBaseline = 'middle';
      const lh = fs * 1.2, y0 = h / 2 - ((lines.length - 1) * lh) / 2;
      const x = this.align === 'center' ? w / 2 : w * 0.05;
      lines.forEach((l, i) => c.fillText(l, x, y0 + i * lh + fs * 0.04));
    });
  }
}

export function disposeTree(root) {
  root.traverse((o) => {
    interactives.delete(o);
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      if (m.userData && m.userData.shared) continue;
      for (const k of Object.keys(m)) { const v = m[k]; if (v && v.isTexture && !(v.userData && v.userData.shared)) v.dispose(); }
      if (m.uniforms) for (const u of Object.values(m.uniforms)) { const v = u && u.value; if (v && v.isTexture && !(v.userData && v.userData.shared)) v.dispose(); }
      m.dispose();
    }
    if (o.userData && o.userData.rt) o.userData.rt.dispose();
    if (o.isSkinnedMesh && o.skeleton) o.skeleton.dispose();
  });
}

// Pannello informativo generico con titolo e testo
export function makeInfoPanel({ w = 1.5, h = 0.9, kicker, title, text, accent = '#ffd400', bg = 'rgba(6,10,20,0.94)' }) {
  const p = new CanvasPlane(w, h, { px: 1400 });
  p.draw((c, cw, ch) => {
    roundRect(c, 0, 0, cw, ch, 40); c.fillStyle = bg; c.fill();
    c.lineWidth = 8; c.strokeStyle = accent; c.stroke();
    const m = 70, maxW = cw - 2 * m;
    // riduce il corpo finché tutto il testo entra nel pannello
    let k = 1, blocks;
    for (; k > 0.45; k -= 0.05) {
      blocks = [];
      if (title) blocks.push({ text: title, font: `900 ${Math.round(64 * k)}px ${FONT}`, color: '#ffffff', lh: Math.round(76 * k), gap: Math.round(22 * k) });
      if (text) (Array.isArray(text) ? text : [text]).forEach((t) => blocks.push({ text: t, font: `500 ${Math.round(44 * k)}px ${FONT}`, color: '#e6edf7', lh: Math.round(60 * k), gap: Math.round(18 * k) }));
      let hh = 50 + (kicker ? 64 : 0);
      for (const b of blocks) { c.font = b.font; hh += wrapLines(c, b.text, maxW).length * b.lh + b.gap; }
      if (hh <= ch - 30) break;
    }
    let y = 50;
    if (kicker) {
      c.fillStyle = accent; c.textBaseline = 'top'; c.textAlign = 'left';
      let fs = 40; c.font = `800 ${fs}px ${FONT}`;
      while (c.measureText(kicker).width > maxW && fs > 16) { fs -= 2; c.font = `800 ${fs}px ${FONT}`; }
      c.fillText(kicker, m, y); y += 64;
    }
    drawBlocks(c, blocks, m, y, maxW);
  });
  return p;
}

// ---------- Telecamera televisiva ----------
const camMats = {};
function cm(color, key) { return camMats[key] || (camMats[key] = Object.assign(new THREE.MeshLambertMaterial({ color }), { userData: { shared: true } })); }

export function makeTVCamera(lensHeight = 1.5, { label = true } = {}) {
  const g = new THREE.Group();
  const dark = cm(0x22252b, 'dark'), mid = cm(0x3b4049, 'mid'), metal = cm(0x8a9099, 'metal');
  const headY = lensHeight - 0.2;
  // treppiede
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const foot = new THREE.Vector3(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45);
    const top = new THREE.Vector3(0, headY, 0);
    const len = foot.distanceTo(top);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, len, 6), metal);
    leg.position.copy(foot).add(top).multiplyScalar(0.5);
    leg.lookAt(top); leg.rotateX(Math.PI / 2);
    g.add(leg);
  }
  const head = new THREE.Group(); head.position.y = headY; g.add(head);
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12), dark); head.add(pan);
  const yawG = new THREE.Group(); yawG.userData.dynamic = true; head.add(yawG);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.52), dark); body.position.set(0, 0.2, -0.05); yawG.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.3), mid); top.position.set(0, 0.37, -0.05); yawG.add(top);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.28, 20), mid);
  lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.2, 0.34); yawG.add(lens);
  const hood = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.022, 8, 24), dark); hood.position.set(0, 0.2, 0.49); yawG.add(hood);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.078, 24), new THREE.MeshBasicMaterial({ color: 0x0b2440, fog: false }));
  glass.position.set(0, 0.2, 0.485); yawG.add(glass);
  const iris = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.05, 24), new THREE.MeshBasicMaterial({ color: 0x24527f, fog: false }));
  iris.position.set(0, 0.2, 0.486); yawG.add(iris);
  const glint = new THREE.Mesh(new THREE.CircleGeometry(0.018, 12), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, fog: false }));
  glint.position.set(0.03, 0.23, 0.487); yawG.add(glint);
  const vf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.12), mid); vf.position.set(-0.2, 0.3, -0.2); yawG.add(vf);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), metal);
  handle.rotation.x = Math.PI / 2.6; handle.position.set(0.15, 0.05, -0.5); yawG.add(handle);
  const tallyMat = new THREE.MeshBasicMaterial({ color: 0x330000, fog: false });
  const tally = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), tallyMat); tally.position.set(0, 0.42, 0.12); yawG.add(tally);
  if (label) {
    const lp = new CanvasPlane(0.4, 0.09, { px: 512, overlay: false });
    lp.draw((c, w, h) => { c.fillStyle = '#d10000'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = `900 ${h * 0.55}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('INVIATO SPECIALE TV', w / 2, h / 2); });
    lp.position.set(0.132, 0.2, -0.05); lp.rotation.y = Math.PI / 2; yawG.add(lp);
    const lp2 = lp.clone(); lp2.position.x = -0.132; lp2.rotation.y = -Math.PI / 2; yawG.add(lp2);
  }
  g.userData = { yawG, tally, tallyMat, headY };
  return g;
}

export function setTally(cam, mode) {
  const m = cam.userData.tallyMat; if (!m) return;
  m.color.setHex(mode ? 0xff1a1a : 0x330000);
}

// ---------- Conto alla rovescia ----------
export class CountdownPanel extends CanvasPlane {
  constructor() { super(1.5, 0.72, { px: 1400 }); }
  show(n) {
    this.draw((c, w, h) => {
      roundRect(c, 0, 0, w, h, 50);
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d90429'); gr.addColorStop(1, '#7a0010');
      c.fillStyle = gr; c.fill(); c.lineWidth = 10; c.strokeStyle = '#ffffff'; c.stroke();
      c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `900 72px ${FONT}`; c.fillText('COLLEGAMENTO IN DIRETTA TRA', w / 2, h * 0.17);
      c.font = `900 ${Math.round(h * 0.58)}px ${FONT}`; c.fillText(String(n), w / 2, h * 0.6);
      // sequenza dei numeri già passati, come nel copione "10, 9, 8…"
      c.font = `700 40px ${FONT}`; c.fillStyle = 'rgba(255,255,255,0.75)';
      const seq = []; for (let k = 10; k >= Math.max(n, 1); k--) seq.push(k);
      c.fillText(seq.join(', ') + (n > 1 ? '…' : ''), w / 2, h * 0.92);
    });
  }
  onAir() {
    this.draw((c, w, h) => {
      roundRect(c, 0, 0, w, h, 50); c.fillStyle = '#d90429'; c.fill();
      c.lineWidth = 10; c.strokeStyle = '#ffffff'; c.stroke();
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `900 ${Math.round(h * 0.34)}px ${FONT}`; c.fillText('● IN ONDA', w / 2, h / 2);
    });
  }
}

// ---------- Gobbo (teleprompter) ----------
export class Teleprompter extends THREE.Group {
  constructor(news, { reporter = 'INVIATO SPECIALE', place = '', onFinish, onClick } = {}) {
    super();
    const W = 1.6, VIS = 0.95, PXW = 1280, PPM = PXW / W;
    this.visPx = Math.round(VIS * PPM);
    this.speeds = [12, 18, 25, 33, 42, 55, 70];
    this.speedIdx = 2; this.playing = false; this.scroll = 0; this.t = 0; this.onFinish = onFinish;

    // cornice del monitor
    const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, VIS + 0.34, 0.06), new THREE.MeshLambertMaterial({ color: 0x15171c }));
    frame.position.set(0, 0.07, -0.04); this.add(frame);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3, 8), new THREE.MeshLambertMaterial({ color: 0x2a2d33 }));
    pole.position.set(0, -1.5 - VIS / 2, -0.06); this.add(pole);
    this.pole = pole;

    // testata
    this.header = new CanvasPlane(W, 0.13, { px: 1600, transparent: false });
    this.header.position.set(0, VIS / 2 + 0.085, 0.001); this.add(this.header);
    this.reporter = reporter.toUpperCase(); this.place = place;
    this.drawHeader(0);

    // testo (canvas alto: si scorre spostando la texture)
    const tmp = document.createElement('canvas').getContext('2d');
    const margin = 70, maxW = PXW - margin * 2 - 40;
    const blocks = [
      { text: news.title, font: `900 66px ${FONT}`, color: '#FFD400', lh: 80, gap: 26 },
      { text: news.subtitle, font: `italic 600 46px ${FONT}`, color: '#8FD8FF', lh: 60, gap: 40 },
      ...news.body.map((p) => ({ text: p, font: `500 50px ${FONT}`, color: '#FFFFFF', lh: 70, gap: 34 }))
    ];
    const top = 40;
    let y = top;
    for (const b of blocks) { tmp.font = b.font; y += wrapLines(tmp, b.text, maxW).length * b.lh + b.gap; }
    const H = Math.min(8000, Math.ceil(y + this.visPx * 0.55));
    this.totalPx = H; this.maxScroll = Math.max(0, H - this.visPx);
    const canvas = document.createElement('canvas'); canvas.width = PXW; canvas.height = H;
    const c = canvas.getContext('2d');
    c.fillStyle = '#000000'; c.fillRect(0, 0, PXW, H);
    const yEnd = drawBlocks(c, blocks, margin, top, maxW);
    c.font = `800 40px ${FONT}`; c.fillStyle = '#7CFC8A'; c.textAlign = 'center';
    c.fillText('FINE DEL SERVIZIO', PXW / 2, yEnd + 20);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = UIConf.aniso;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1, this.visPx / H);
    this.tex = tex;
    this.body = new THREE.Mesh(new THREE.PlaneGeometry(W, VIS), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, fog: false, depthTest: false, depthWrite: false }));
    this.body.renderOrder = 20; this.add(this.body);

    // freccia di lettura e barra di avanzamento
    const arrow = new THREE.Mesh(new THREE.CircleGeometry(0.035, 3), new THREE.MeshBasicMaterial({ color: 0xffd400, fog: false, depthTest: false }));
    arrow.renderOrder = 21; arrow.position.set(-W / 2 - 0.0, VIS / 2 - 0.12, 0.004); this.add(arrow);
    const track = new THREE.Mesh(new THREE.PlaneGeometry(0.018, VIS - 0.04), new THREE.MeshBasicMaterial({ color: 0x333333, fog: false, depthTest: false }));
    track.renderOrder = 21; track.position.set(W / 2 - 0.03, 0, 0.003); this.add(track);
    this.thumb = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 0.12), new THREE.MeshBasicMaterial({ color: 0xffd400, fog: false, depthTest: false }));
    this.thumb.renderOrder = 23; this.thumb.position.set(W / 2 - 0.03, 0, 0.005); this.add(this.thumb);
    this.trackH = VIS - 0.04 - 0.12;

    // comandi
    const by = -VIS / 2 - 0.12;
    let cx = -W / 2;
    const gap = 0.02;
    const mk = (label, w, opts) => { const b = new Button(label, { w, h: 0.14, size: 0.4, ...opts }); b.position.set(cx + w / 2, by, 0.01); cx += w + gap; this.add(b); return b; };
    const click = () => onClick && onClick();
    mk('▲ SU', 0.21, { bg: '#374151', hover: '#4b5563', onSelect: () => { click(); this.nudge(-160); } });
    mk('▼ GIÙ', 0.21, { bg: '#374151', hover: '#4b5563', onSelect: () => { click(); this.nudge(160); } });
    this.playBtn = mk('❚❚ PAUSA', 0.29, { bg: '#1d4ed8', hover: '#2563eb', onSelect: () => { click(); this.toggle(); } });
    mk('– LENTO', 0.24, { bg: '#374151', hover: '#4b5563', onSelect: () => { click(); this.speed(-1); } });
    mk('+ VELOCE', 0.26, { bg: '#374151', hover: '#4b5563', onSelect: () => { click(); this.speed(1); } });
    this.doneBtn = mk('HO FINITO', W - (cx + W / 2), { bg: '#15803d', hover: '#16a34a', onSelect: () => { click(); this.onFinish && this.onFinish(); } });
    this.apply();
    this.startDelay = 2.5;
  }
  drawHeader(t) {
    this.header.draw((c, w, h) => {
      c.fillStyle = '#b00012'; c.fillRect(0, 0, w, h);
      const blink = Math.floor(t * 1.5) % 2 === 0;
      c.fillStyle = blink ? '#ffffff' : '#ffb3b3';
      c.beginPath(); c.arc(h * 0.6, h / 2, h * 0.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.textAlign = 'left';
      c.font = `900 ${Math.round(h * 0.5)}px ${FONT}`; c.fillText('IN DIRETTA', h * 1.0, h / 2);
      const left = h * 1.0 + c.measureText('IN DIRETTA').width + h * 0.6;
      const txt = `${this.reporter}  •  ${this.place}`;
      let fs = Math.round(h * 0.4);
      c.font = `700 ${fs}px ${FONT}`;
      while (c.measureText(txt).width > w - left - h * 0.4 && fs > 12) { fs -= 2; c.font = `700 ${fs}px ${FONT}`; }
      c.textAlign = 'right'; c.fillText(txt, w - h * 0.4, h / 2);
    });
  }
  apply() {
    const H = this.totalPx;
    this.tex.offset.y = 1 - this.tex.repeat.y - this.scroll / H;
    const f = this.maxScroll > 0 ? this.scroll / this.maxScroll : 0;
    this.thumb.position.y = this.trackH / 2 - f * this.trackH;
  }
  nudge(px) { this.scroll = THREE.MathUtils.clamp(this.scroll + px, 0, this.maxScroll); this.apply(); }
  scrollBy(px) { if (px) this.nudge(px); }
  toggle() { this.playing = !this.playing; this.startDelay = 0; this.playBtn.setLabel(this.playing ? '❚❚ PAUSA' : '▶ AVVIA'); }
  speed(d) { this.speedIdx = THREE.MathUtils.clamp(this.speedIdx + d, 0, this.speeds.length - 1); }
  update(dt, stickY = 0) {
    this.t += dt;
    if (this.startDelay > 0) {
      this.startDelay -= dt;
      if (this.startDelay <= 0) { this.playing = true; this.playBtn.setLabel('❚❚ PAUSA'); }
      else if (this.playBtn.label !== '▶ AVVIA') this.playBtn.setLabel('▶ AVVIA');
    }
    if (this.playing) this.scroll += this.speeds[this.speedIdx] * dt;
    if (Math.abs(stickY) > 0.15) this.scroll += stickY * 260 * dt;
    if (this.scroll >= this.maxScroll && this.playing) { this.playing = false; this.playBtn.setLabel('▶ AVVIA'); }
    this.scroll = THREE.MathUtils.clamp(this.scroll, 0, this.maxScroll);
    this.apply();
    const k = Math.floor(this.t * 1.5);
    if (k !== this._hk) { this._hk = k; this.drawHeader(this.t); }
  }
}
