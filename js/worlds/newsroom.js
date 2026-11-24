// La redazione: una vera sala stampa. La parete video è il menu delle missioni.
import * as THREE from 'three';
import { canvasTex, lambert, makeGlow, fitText, photoMat, PH, rng, mergeStatic } from './common.js';
import { WORLDS, WORLD_ORDER } from '../content.js';
import { interactives } from '../ui.js';
import { makeCharacter, SKINS, HAIR, CIVILIANS } from '../people.js';
import { Colliders } from '../physics.js';
import { SND } from '../sounds.js';

const W = 26, D = 22, H = 4.6; // dimensioni della sala

// piccola illustrazione per ogni missione, mostrata sulla parete video
function missionArt(id, c, w, h) {
  const g = c.createLinearGradient(0, 0, 0, h);
  if (id === 'sport') {
    g.addColorStop(0, '#061028'); g.addColorStop(1, '#0d2147'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 6; r++) { c.beginPath(); c.ellipse(w / 2, h * 0.7 - r * h * 0.06, w * (0.46 + r * 0.02), h * (0.2 + r * 0.04), 0, Math.PI, 0); c.lineWidth = 14; c.strokeStyle = r % 3 ? '#f2f2f2' : '#4b2a7b'; c.stroke(); }
    c.fillStyle = '#2c7a33'; c.beginPath(); c.ellipse(w / 2, h * 0.78, w * 0.42, h * 0.16, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.ellipse(w / 2, h * 0.78, w * 0.1, h * 0.05, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(w / 2, h * 0.62); c.lineTo(w / 2, h * 0.94); c.stroke();
  } else if (id === 'vesuvio') {
    g.addColorStop(0, '#2a2321'); g.addColorStop(1, '#8a6a55'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(${60 + k},${55 + k},${50 + k},0.5)`; c.beginPath(); c.arc(w * 0.47 + Math.sin(k) * k * 2, h * 0.4 - k * 6, 14 + k * 1.4, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#3d3530'; c.beginPath(); c.moveTo(w * 0.1, h * 0.8); c.lineTo(w * 0.42, h * 0.42); c.lineTo(w * 0.52, h * 0.44); c.lineTo(w * 0.9, h * 0.8); c.fill();
    c.strokeStyle = '#ff5a14'; c.lineWidth = 6; c.beginPath(); c.moveTo(w * 0.46, h * 0.45); c.lineTo(w * 0.38, h * 0.62); c.stroke();
    c.fillStyle = '#263941'; c.fillRect(0, h * 0.8, w, h * 0.2);
  } else if (id === 'marte') {
    c.fillStyle = '#02030a'; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 90; k++) { c.fillStyle = '#fff'; c.fillRect((k * 97) % w, (k * 53) % h, 2, 2); }
    const m = c.createRadialGradient(w * 0.7, h * 0.4, 10, w * 0.7, h * 0.4, h * 0.32); m.addColorStop(0, '#e08050'); m.addColorStop(1, '#7a2a14'); c.fillStyle = m; c.beginPath(); c.arc(w * 0.7, h * 0.4, h * 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#eee'; c.beginPath(); c.moveTo(w * 0.25, h * 0.15); c.lineTo(w * 0.29, h * 0.6); c.lineTo(w * 0.21, h * 0.6); c.fill();
    c.fillStyle = '#ffb040'; c.beginPath(); c.moveTo(w * 0.22, h * 0.6); c.lineTo(w * 0.25, h * 0.82); c.lineTo(w * 0.28, h * 0.6); c.fill();
  } else {
    g.addColorStop(0, '#0a0f24'); g.addColorStop(1, '#3a2a4a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const cols = ['#ff2a6b', '#2a9bff', '#ffd400', '#7CFC8A', '#ff8a00', '#c06bff'];
    for (let k = 0; k < 6; k++) { const x = (k < 3 ? 0.02 + k * 0.1 : 0.68 + (k - 3) * 0.1) * w; const bh = h * (0.5 + (k % 3) * 0.15); c.fillStyle = '#1a1d24'; c.fillRect(x, h - bh, w * 0.1, bh); c.fillStyle = cols[k]; c.fillRect(x + 4, h - bh + 14, w * 0.1 - 8, h * 0.14); }
    c.fillStyle = '#0f4d26'; c.beginPath(); c.moveTo(w * 0.5, h * 0.3); c.lineTo(w * 0.58, h * 0.85); c.lineTo(w * 0.42, h * 0.85); c.fill();
    c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(w * 0.5, h * 0.3, 9, 0, Math.PI * 2); c.fill();
  }
}

export function createNewsroom(env = {}) {
  const g = new THREE.Group();
  const R = rng(17);
  const col = new Colliders();
  g.add(new THREE.HemisphereLight(0xf4f6ff, 0x3a3530, 1.05));
  const d = new THREE.DirectionalLight(0xffffff, 0.5); d.position.set(3, 8, 6); g.add(d);

  // pavimento in legno, pareti, soffitto con plafoniere
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), photoMat(PH('laminate_floor_02'), { fallback: 0x6b5643, tint: 0xd8c8b8, repeat: [8, 7] }));
  floor.rotation.x = -Math.PI / 2; g.add(floor);
  const wallM = photoMat(PH('grey_plaster'), { fallback: 0xd9d9d6, tint: 0xf0efe9, repeat: [6, 1.2], side: THREE.DoubleSide });
  const wall = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), wallM); m.position.set(x, H / 2, z); m.rotation.y = ry; g.add(m); };
  wall(W, 0, -D / 2, 0); wall(W, 0, D / 2, Math.PI); wall(D, -W / 2, 0, Math.PI / 2); wall(D, W / 2, 0, -Math.PI / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), lambert(0xe9e9e4)); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; g.add(ceil);
  for (let x = -9; x <= 9; x += 6) for (let z = -7; z <= 7; z += 4.5) { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.6), new THREE.MeshBasicMaterial({ color: 0xfafcff })); l.rotation.x = Math.PI / 2; l.position.set(x, H - 0.01, z); g.add(l); }
  // vetrate sulla città di notte
  const city = canvasTex(1024, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1430'); gr.addColorStop(1, '#2a2440'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    const r = rng(9);
    for (let x = 0; x < w; ) { const bw = 20 + r() * 60, bh = 40 + r() * 170; c.fillStyle = '#10131b'; c.fillRect(x, h - bh, bw, bh); for (let y = h - bh + 6; y < h - 6; y += 10) for (let xx = x + 4; xx < x + bw - 4; xx += 8) if (r() < 0.35) { c.fillStyle = r() < 0.5 ? '#ffd88a' : '#cfe3ff'; c.fillRect(xx, y, 4, 5); } x += bw + 2; }
    c.fillStyle = '#c0c4cc'; c.beginPath(); c.arc(w * 0.82, h * 0.62, 30, Math.PI, 0); c.fill();
  });
  for (const x of [-W / 2 + 0.02, W / 2 - 0.02]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(D - 4, 2.6), new THREE.MeshBasicMaterial({ map: city })); win.position.set(x, 2.3, 1.5); win.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(win);
    for (let z = -7; z <= 10; z += 2.8) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.7, 0.08), lambert(0x2b2f36)); m.position.set(x, 2.3, z); g.add(m); }
  }

  // ---- parete video: le quattro missioni (cliccabili) ----
  const wallZ = -D / 2 + 0.15;
  const vw = new THREE.Mesh(new THREE.BoxGeometry(19.6, 3.9, 0.2), lambert(0x0e1116)); vw.position.set(0, 2.75, wallZ - 0.1); g.add(vw);
  const head = canvasTex(2048, 128, (c, w, h) => { c.fillStyle = '#c1121f'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.textBaseline = 'middle'; fitText(c, 'SERVIZI DI OGGI  •  PUNTA UNO SCHERMO E PREMI IL GRILLETTO PER PARTIRE', 30, h / 2 + 4, w - 60, 72, { align: 'left' }); });
  const hd = new THREE.Mesh(new THREE.PlaneGeometry(19.2, 0.6), new THREE.MeshBasicMaterial({ map: head })); hd.position.set(0, 4.35, wallZ + 0.02); g.add(hd);
  const screens = [];
  WORLD_ORDER.forEach((id, i) => {
    const w = WORLDS[id];
    const tex = canvasTex(1024, 600, () => {});
    const draw = (hover) => tex.redraw((c, cw, ch) => {
      c.save(); missionArt(id, c, cw, ch); c.restore();
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, ch - 190, cw, 190);
      c.fillStyle = w.color; c.fillRect(30, ch - 172, 280, 50);
      c.fillStyle = '#fff'; c.textBaseline = 'middle'; fitText(c, w.category, 44, ch - 147, 252, 36, { align: 'left' });
      fitText(c, w.title, 30, ch - 84, cw - 60, 52, { align: 'left', weight: '800' });
      c.fillStyle = '#ffd400'; fitText(c, w.place, 30, ch - 34, cw - 60, 28, { align: 'left', weight: '700' });
      if (hover) { c.strokeStyle = '#ffd400'; c.lineWidth = 18; c.strokeRect(9, 9, cw - 18, ch - 18); c.fillStyle = '#ffd400'; c.fillRect(cw - 300, 24, 270, 64); c.fillStyle = '#111'; fitText(c, '▶ PARTI', cw - 165, 58, 240, 40, { align: 'center' }); }
    });
    draw(false);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.7), new THREE.MeshBasicMaterial({ map: tex }));
    m.position.set(-7.2 + i * 4.8, 2.55, wallZ + 0.02); g.add(m);
    m.hovered = false; m.userData.dynamic = true;
    m.setHover = (v) => { if (v !== m.hovered) { m.hovered = v; draw(v); m.scale.setScalar(v ? 1.03 : 1); } };
    m.userData.onSelect = () => env.onPick && env.onPick(id);
    interactives.add(m); screens.push(m);
  });
  // insegna IN ONDA e orologi del mondo
  const oaTex = canvasTex(256, 72, (c, w, h) => { c.fillStyle = '#d00000'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'IN ONDA', w / 2, h / 2 + 2, w * 0.86, 46); });
  const onair = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.45), new THREE.MeshBasicMaterial({ map: oaTex }));
  onair.position.set(W / 2 - 0.05, 3.6, -4); onair.rotation.y = -Math.PI / 2; g.add(onair);
  const oaGlow = makeGlow(0xff2020, 3, 0.5); oaGlow.position.set(W / 2 - 0.3, 3.6, -4); g.add(oaGlow);
  const clocks = [];
  [['ROMA', 1], ['MADRID', 1], ['NEW YORK', -5], ['HOUSTON', -6]].forEach(([name, off], i) => {
    const tex = canvasTex(256, 300, () => {});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.82), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    m.position.set(-W / 2 + 0.03, 3.6, -7 + i * 1.0); m.rotation.y = Math.PI / 2; g.add(m);
    clocks.push({ tex, name, off });
  });
  const drawClocks = () => {
    const now = new Date();
    for (const k of clocks) k.tex.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      const t = new Date(now.getTime() + (k.off * 60 + now.getTimezoneOffset()) * 60000);
      c.fillStyle = '#fff'; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 6, 0, Math.PI * 2); c.fill(); c.lineWidth = 8; c.strokeStyle = '#222'; c.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillStyle = '#222'; c.fillRect(w / 2 + Math.sin(a) * 100 - 3, w / 2 - Math.cos(a) * 100 - 3, 6, 6); }
      const hand = (a, len, wd) => { c.lineWidth = wd; c.lineCap = 'round'; c.beginPath(); c.moveTo(w / 2, w / 2); c.lineTo(w / 2 + Math.sin(a) * len, w / 2 - Math.cos(a) * len); c.stroke(); };
      c.strokeStyle = '#111'; hand((t.getHours() % 12 + t.getMinutes() / 60) / 12 * Math.PI * 2, 60, 10); hand(t.getMinutes() / 60 * Math.PI * 2, 90, 6);
      c.strokeStyle = '#c1121f'; hand(t.getSeconds() / 60 * Math.PI * 2, 95, 3);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, k.name, w / 2, h - 22, w - 10, 34);
    });
  };
  drawClocks();

  // ---- scrivanie con monitor ----
  const deskM = photoMat(PH('oak_veneer_01'), { fallback: 0xb89a74, tint: 0xffffff, repeat: [2, 1] });
  const legM = lambert(0x9aa0a8), chairM = lambert(0x1f2329);
  const headlines = ['ULTIM\'ORA', 'POLITICA', 'ESTERI', 'SPORT', 'SCIENZA', 'CRONACA', 'METEO', 'ECONOMIA', 'CULTURA'];
  const monTexes = headlines.map((hl, i) => canvasTex(256, 160, (c, w, h) => {
    c.fillStyle = '#f4f5f7'; c.fillRect(0, 0, w, h); c.fillStyle = ['#c1121f', '#1d4ed8', '#15803d'][i % 3]; c.fillRect(0, 0, w, 26);
    c.fillStyle = '#fff'; c.textBaseline = 'middle'; fitText(c, hl, 8, 14, w - 16, 18, { align: 'left' });
    c.fillStyle = '#9aa3b5'; c.fillRect(10, 36, w * 0.45, 60); c.fillStyle = '#333'; for (let y = 36; y < h - 6; y += 10) c.fillRect(w * 0.5, y, w * 0.45 * (0.6 + ((y * 7) % 10) / 25), 4);
    for (let y = 104; y < h - 6; y += 10) c.fillRect(10, y, w * 0.4, 4);
  }));
  const desks = [];
  const deskAt = (x, z) => {
    const dg = new THREE.Group(); dg.position.set(x, 0, z); g.add(dg);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.8), deskM); top.position.y = 0.75; dg.add(top);
    for (const [lx, lz] of [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.75, 0.04), legM); l.position.set(lx, 0.375, lz); dg.add(l); }
    for (const k of [-0.32, 0.32]) {
      const mon = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.36, 0.03), lambert(0x15171c)); mon.position.set(k, 1.08, -0.25); dg.add(mon);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.32), new THREE.MeshBasicMaterial({ map: monTexes[Math.floor(R() * monTexes.length)] })); scr.position.set(k, 1.08, -0.233); dg.add(scr);
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), legM); st.position.set(k, 0.9, -0.27); dg.add(st);
    }
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.15), lambert(0x222222)); kb.position.set(0, 0.785, 0.05); dg.add(kb);
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10), lambert(0xc1121f)); mug.position.set(0.55, 0.82, 0.15); dg.add(mug);
    const papers = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.22), lambert(0xf7f7f2)); papers.position.set(-0.55, 0.785, 0.12); papers.rotation.y = 0.2; dg.add(papers);
    const chair = new THREE.Group(); chair.position.set(0, 0, 0.62); dg.add(chair);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), chairM); seat.position.y = 0.47; chair.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.06), chairM); back.position.set(0, 0.8, 0.24); chair.add(back);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), legM); post.position.y = 0.22; chair.add(post);
    col.box(x, z + 0.25, 1.7, 1.5);
    desks.push(dg);
  };
  for (let row = 0; row < 3; row++) for (let k = 0; k < 4; k++) {
    if (row === 2 && (k === 1 || k === 2)) continue; // corridoio centrale verso la parete video
    deskAt(-7.5 + k * 5, -4.5 + row * 3.2);
  }
  // studio del telegiornale in un angolo
  const studio = new THREE.Group(); studio.position.set(9.5, 0, 7.5); studio.rotation.y = -Math.PI * 0.75; g.add(studio);
  const sDesk = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.9, 32, 1, false, 0, Math.PI), new THREE.MeshPhongMaterial({ color: 0x0d2a6a, shininess: 80 })); sDesk.position.y = 0.45; studio.add(sDesk);
  const sLogo = canvasTex(512, 96, (c, w, h) => { c.fillStyle = '#0d2a6a'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'INVIATO SPECIALE TG', w / 2, h / 2, w * 0.9, 56); });
  const sl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.45), new THREE.MeshBasicMaterial({ map: sLogo })); sl.position.set(0, 0.5, 1.62); studio.add(sl);
  for (const x of [-2.4, 2.4]) { const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), legM); lp.position.set(x, 1.3, 2.6); studio.add(lp); const lb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.3), lambert(0x111111)); lb.position.set(x, 2.6, 2.6); studio.add(lb); const gl = makeGlow(0xfff4d6, 1.6, 0.6); gl.position.set(x, 2.6, 2.45); studio.add(gl); }
  col.circle(9.5, 7.5, 1.8);
  // bacheca con i giornali del giorno
  const board = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#c9b08a'; c.fillRect(0, 0, w, h);
    const r = rng(4);
    const titles = ['IL VESUVIO', 'FINALE A MADRID', 'MISSIONE MARTE', 'BLACKOUT A NY', 'METEO', 'SCUOLA', 'CULTURA', 'TECNOLOGIA', 'AMBIENTE'];
    for (let k = 0; k < 9; k++) { const x = 30 + (k % 3) * 330, y = 25 + Math.floor(k / 3) * 160; c.fillStyle = '#f7f5ee'; c.fillRect(x, y, 300, 140); c.fillStyle = '#111'; c.textBaseline = 'middle'; fitText(c, titles[k], x + 10, y + 30, 280, 28, { align: 'left' }); c.fillStyle = '#777'; for (let yy = y + 50; yy < y + 130; yy += 12) c.fillRect(x + 10, yy, 280 * (0.6 + r() * 0.4), 5); c.fillStyle = '#c1121f'; c.beginPath(); c.arc(x + 150, y + 4, 7, 0, Math.PI * 2); c.fill(); }
  });
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), new THREE.MeshLambertMaterial({ map: board })); bd.position.set(0, 2.4, D / 2 - 0.03); bd.rotation.y = Math.PI; g.add(bd);
  for (const [x, z] of [[-12, -10], [12, -10], [-12, 10], [12, 10]]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.6, 14), lambert(0x3a3a3a)); pot.position.set(x, 0.3, z); g.add(pot);
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), lambert(0x2f6b2f)); leaves.position.set(x, 1.1, z); leaves.scale.set(1, 1.4, 1); g.add(leaves);
    col.circle(x, z, 0.4);
  }

  // ---- giornalisti al lavoro ----
  const people = [];
  const look = () => ({ skin: SKINS[Math.floor(R() * SKINS.length)], hair: HAIR[Math.floor(R() * HAIR.length)], height: 1.6 + R() * 0.26 });
  const jobs = [];
  desks.forEach((dg, i) => {
    if (i % 3 === 2) return;
    jobs.push(makeCharacter(CIVILIANS[i % CIVILIANS.length], look()).then((c) => {
      c.obj.position.set(dg.position.x, 0.02, dg.position.z + 0.58); c.obj.rotation.y = Math.PI; c.play('sit', { once: true, offset: 0.98 });
      g.add(c.obj); people.push(c);
    }));
  });
  for (let i = 0; i < 4; i++) jobs.push(makeCharacter(CIVILIANS[(i * 3 + 1) % CIVILIANS.length], look()).then((c) => {
    c.walker = { x0: -1 + (i % 2) * 2, z: i < 2 ? -6.2 : 3.4, len: 20, sp: 0.9 + R() * 0.3, u: R() * 2 };
    c.play('walk', { speed: 0.85 }); g.add(c.obj); people.push(c); col.follow(c.obj, 0.3);
  }));
  jobs.push(makeCharacter('m_suit', { ...look(), colors: { Shirt: 0x22252b, Pants: 0x22252b } }).then((c) => { c.obj.position.set(-10.5, 0, -8.5); c.obj.rotation.y = 0.6; c.play('idle'); g.add(c.obj); people.push(c); col.follow(c.obj, 0.35); }));

  mergeStatic(g);
  let clockT = 0;
  return {
    group: g, spawn: { x: 0, z: 6.5, yaw: 0 }, background: 0x10131a, fog: null, studio: { distance: 2.2, scale: 1 },
    colliders: col,
    ready: Promise.all(jobs),
    update(dt, t) {
      clockT += dt; if (clockT > 1) { clockT = 0; drawClocks(); }
      oaGlow.material.opacity = 0.35 + Math.sin(t * 3) * 0.15;
      for (const c of people) {
        if (c.walker) {
          const w = c.walker; w.u += (w.sp * dt) / w.len;
          const k = w.u % 2, fwd = k < 1, f = fwd ? k : 2 - k;
          c.obj.position.set(w.x0 + (f - 0.5) * w.len * 0.9, 0, w.z); c.obj.rotation.y = fwd ? Math.PI / 2 : -Math.PI / 2;
        }
        c.update(dt);
      }
    },
    onPhase() {},
    bounds(p) { p.x = THREE.MathUtils.clamp(p.x, -W / 2 + 0.6, W / 2 - 0.6); p.z = THREE.MathUtils.clamp(p.z, -D / 2 + 1.4, D / 2 - 0.6); },
    dispose() { screens.forEach((m) => interactives.delete(m)); },
    startAudio(s) {
      s.stream(SND.ufficio.url, { gain: 0.6, dest: s.out });
      s.stream(SND.macchinaScrivere.url, { gain: 0.25, dest: s.panner(-6, 1, -3, { ref: 3, roll: 1 }) });
    }
  };
}
