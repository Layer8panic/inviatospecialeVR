// La redazione: menu delle missioni in VR
import * as THREE from 'three';
import { canvasTex, lambert, makeGlow, fitText } from './common.js';
import { WORLDS, WORLD_ORDER } from '../content.js';

export function createNewsroom() {
  const g = new THREE.Group();
  g.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1d24, 0.9));
  const d = new THREE.DirectionalLight(0xffffff, 0.6); d.position.set(2, 6, 3); g.add(d);
  const floorTex = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#0d1118'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#1c2a3d'; c.lineWidth = 3;
    for (let k = 0; k <= w; k += 64) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k, h); c.stroke(); c.beginPath(); c.moveTo(0, k); c.lineTo(w, k); c.stroke(); }
  }, { repeat: [12, 12] });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(24, 48), new THREE.MeshLambertMaterial({ map: floorTex })); floor.rotation.x = -Math.PI / 2; g.add(floor);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 12, 48, 1, true), new THREE.MeshLambertMaterial({ color: 0x0a0e15, side: THREE.BackSide })); wall.position.y = 6; g.add(wall);
  // schermi delle quattro missioni
  WORLD_ORDER.forEach((id, i) => {
    const w = WORLDS[id];
    const a = -0.9 + i * 0.6;
    const tex = canvasTex(1024, 576, (c, cw, ch) => {
      const gr = c.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, w.color); gr.addColorStop(1, '#05070c');
      c.fillStyle = gr; c.fillRect(0, 0, cw, ch);
      c.fillStyle = '#ffffff'; c.textAlign = 'center'; fitText(c, w.category, cw / 2, 140, cw * 0.9, 70);
      c.font = '700 46px Arial';
      const words = w.title.split(' '); let line = '', y = 260;
      for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (c.measureText(t).width > cw * 0.85) { c.fillText(line, cw / 2, y); y += 60; line = wd; } else line = t; }
      c.fillText(line, cw / 2, y);
    });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.9), new THREE.MeshBasicMaterial({ map: tex }));
    s.position.set(Math.sin(a) * 12, 4.2, -Math.cos(a) * 12); s.lookAt(0, 4.2, 0); g.add(s);
  });
  const logo = canvasTex(1024, 256, (c, w, h) => { c.fillStyle = '#c1121f'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'INVIATO SPECIALE VR', w / 2, h / 2, w * 0.9, 110); });
  const lg = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: logo })); lg.position.set(0, 8.3, -12.5); g.add(lg);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(4, 0.9, 1.2), lambert(0x1e2633)); desk.position.set(0, 0.45, 4); g.add(desk);
  for (let k = 0; k < 10; k++) { const l = makeGlow(0x6aa8ff, 3, 0.4); const a = (k / 10) * Math.PI * 2; l.position.set(Math.cos(a) * 18, 10, Math.sin(a) * 18); g.add(l); }
  return {
    group: g, spawn: { x: 0, z: 0, yaw: 0 }, background: 0x05070c, fog: null, studio: { distance: 2.2, scale: 1 },
    update() {}, onPhase() {},
    bounds(p) { const d = Math.hypot(p.x, p.z); if (d > 8) { p.x *= 8 / d; p.z *= 8 / d; } },
    startAudio(s) {
      const o = s.osc('sine', 110); const f = s.filter('lowpass', 300); const gg = s.gain(0.03); o.connect(f).connect(gg).connect(s.out);
    }
  };
}
