// SCIENZA – Destinazione Marte: l'umanità conquista lo spazio
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, canvasTex, skyDome, starField, makeGlow, glowTexture, lambert, makePerson, animatePerson, smooth, lerp, fitText, photoMat, applyTex, PH, LOCAL } from './common.js';
import { SND } from '../sounds.js';
import * as A from '../audio.js';

function planetTex(kind) {
  return canvasTex(1024, 512, (c, w, h) => {
    const r = rng(kind === 'earth' ? 4 : 8);
    if (kind === 'earth') {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1b4f8f'); gr.addColorStop(0.5, '#1f66b5'); gr.addColorStop(1, '#1b4f8f');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      const conts = [[180, 170, 120], [260, 330, 90], [520, 160, 140], [560, 300, 110], [800, 200, 120], [860, 360, 70]];
      conts.forEach(([x, y, s]) => {
        for (let k = 0; k < 40; k++) {
          c.fillStyle = r() < 0.6 ? '#3f7d3a' : '#8a7a4a';
          c.beginPath(); c.arc(x + (r() - 0.5) * s * 1.6, y + (r() - 0.5) * s, s * (0.12 + r() * 0.25), 0, Math.PI * 2); c.fill();
        }
      });
      c.fillStyle = 'rgba(255,255,255,0.95)'; c.fillRect(0, 0, w, 26); c.fillRect(0, h - 30, w, 30);
      for (let k = 0; k < 160; k++) { c.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.5})`; c.beginPath(); c.ellipse(r() * w, 40 + r() * (h - 80), 20 + r() * 60, 6 + r() * 14, 0, 0, Math.PI * 2); c.fill(); }
    } else {
      c.fillStyle = '#b4542e'; c.fillRect(0, 0, w, h);
      for (let k = 0; k < 260; k++) {
        c.fillStyle = r() < 0.5 ? 'rgba(110,45,25,0.5)' : 'rgba(215,125,75,0.45)';
        c.beginPath(); c.ellipse(r() * w, r() * h, 10 + r() * 80, 6 + r() * 30, r() * 3, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = 'rgba(90,35,20,0.6)'; c.fillRect(0, h * 0.48, w, 10);
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.ellipse(w / 2, 0, w / 2, 26, 0, 0, Math.PI * 2); c.fill();
    }
  });
}

export function createMars() {
  const g = new THREE.Group();
  const R = rng(31);

  const hemi = new THREE.HemisphereLight(0xeef3ff, 0x3a3f4a, 1.0); g.add(hemi);
  const sunL = new THREE.DirectionalLight(0xffffff, 1.4); sunL.position.set(-200, 80, -120); g.add(sunL);

  // ---------- esterno ----------
  const ext = new THREE.Group(); g.add(ext);
  const sky = skyDome(0x3d86d6, 0xc4def3, { exponent: 0.55 }); ext.add(sky);
  const stars = starField(2200, 3000, { size: 1.8, minY: -1, opacity: 0 }); ext.add(stars);
  const sunGlow = makeGlow(0xfff4d6, 420, 0); sunGlow.position.set(-2000, 700, -1400); ext.add(sunGlow);

  const pad = new THREE.Group(); ext.add(pad);
  const grd = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), lambert(0x6e7d58)); grd.rotation.x = -Math.PI / 2; grd.position.y = -45; pad.add(grd);
  const seaM = new THREE.Mesh(new THREE.PlaneGeometry(6000, 3000), lambert(0x2f5f8f)); seaM.rotation.x = -Math.PI / 2; seaM.position.set(0, -44.8, -2200); pad.add(seaM);
  const padBase = new THREE.Mesh(new THREE.CylinderGeometry(25, 30, 4, 24), lambert(0x8d8d8d)); padBase.position.y = -43; pad.add(padBase);
  // torre di lancio a traliccio
  const tg = [];
  for (let y = -45; y < 14; y += 4) {
    for (const [x, z] of [[6, -6], [10, -6], [6, -2], [10, -2]]) tg.push(new THREE.BoxGeometry(0.3, 4, 0.3).translate(x, y + 2, z));
    tg.push(new THREE.BoxGeometry(4.3, 0.25, 0.25).translate(8, y, -6)); tg.push(new THREE.BoxGeometry(4.3, 0.25, 0.25).translate(8, y, -2));
    tg.push(new THREE.BoxGeometry(0.25, 0.25, 4.3).translate(6, y, -4)); tg.push(new THREE.BoxGeometry(0.25, 0.25, 4.3).translate(10, y, -4));
  }
  tg.push(new THREE.BoxGeometry(1.4, 0.4, 5).translate(6, 0.6, -1.5));
  const tower = new THREE.Mesh(mergeGeometries(tg), lambert(0xb23a2a)); pad.add(tower);
  // razzo sotto di noi (visibile guardando in basso dai finestrini)
  const rocket = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 44, 24), lambert(0xeeeeee)); rocket.position.y = -22; pad.add(rocket);
  for (let i = 0; i < 30; i++) {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(80 + R() * 140, 40 + R() * 90, 7), lambert(0x5d6b4a));
    const a = R() * Math.PI * 2, d = 900 + R() * 1200; hill.position.set(Math.cos(a) * d, -45 + 20, Math.sin(a) * d); pad.add(hill);
  }
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffffff, opacity: 0.75, transparent: true, depthWrite: false, fog: false }));
    const a = R() * Math.PI * 2, d = 60 + R() * 260;
    cl.position.set(Math.cos(a) * d, 120 + R() * 500, Math.sin(a) * d); cl.scale.set(120 + R() * 160, 50 + R() * 50, 1);
    ext.add(cl); clouds.push(cl);
  }
  const earthM = new THREE.MeshPhongMaterial({ map: planetTex('earth'), shininess: 25, specular: 0x333333 });
  applyTex(earthM, LOCAL('earth_atmos_2048.jpg'));
  applyTex(earthM, LOCAL('earth_specular_2048.jpg'), { slot: 'specularMap', color: false });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(60, 64, 48), earthM);
  const cloudM = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.9, depthWrite: false });
  applyTex(cloudM, LOCAL('earth_clouds_1024.png'));
  const clouds2 = new THREE.Mesh(new THREE.SphereGeometry(60.8, 64, 48), cloudM); clouds2.visible = false;
  earth.visible = false; ext.add(earth); earth.add(clouds2); clouds2.visible = true;
  const atmo = makeGlow(0x6fb6ff, 160, 0.6); earth.add(atmo); atmo.position.set(0, 0, -5);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(60, 48, 32), new THREE.MeshLambertMaterial({ map: planetTex('mars') }));
  mars.visible = false; ext.add(mars);
  const marsAtmo = makeGlow(0xff9a6a, 150, 0.35); mars.add(marsAtmo); marsAtmo.position.set(0, 0, -5);
  const plasma = [];
  for (let i = 0; i < 6; i++) { const p = makeGlow(0xff7a2a, 3, 0); p.position.set((i - 2.5) * 0.9, 1.6 + (i % 2) * 0.5, -3.6); g.add(p); plasma.push(p); }

  // ---------- cabina ----------
  const cabin = new THREE.Group(); g.add(cabin);
  const RAD = 2.7, AP = RAD * Math.cos(Math.PI / 8), FW = 2 * RAD * Math.sin(Math.PI / 8), CH = 2.6;
  const wallTex = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#d9dde3'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#a9b0ba'; c.lineWidth = 4;
    for (let y = 0; y < h; y += 128) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for (let x = 0; x < w; x += 170) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    const r = rng(5);
    for (let k = 0; k < 40; k++) { c.fillStyle = ['#2b3036', '#4a5059', '#1f6feb', '#e0a800'][Math.floor(r() * 4)]; c.fillRect(r() * w, r() * h, 10 + r() * 30, 6 + r() * 12); }
  });
  const wallM = new THREE.MeshLambertMaterial({ map: wallTex });
  const winFaces = [0, 1, 7];
  const WIN_W = 1.3, WIN_B = 1.05, WIN_T = 2.05;
  for (let i = 0; i < 8; i++) {
    const th = (i * Math.PI) / 4;
    const face = new THREE.Group(); face.rotation.y = th; face.position.set(-Math.sin(th) * AP, 0, -Math.cos(th) * AP); cabin.add(face);
    const plane = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallM); m.position.set(x, y, 0); face.add(m); };
    if (winFaces.includes(i)) {
      plane(FW, WIN_B, 0, WIN_B / 2);
      plane(FW, CH - WIN_T, 0, (WIN_T + CH) / 2);
      const sw = (FW - WIN_W) / 2;
      plane(sw, WIN_T - WIN_B, -WIN_W / 2 - sw / 2, (WIN_B + WIN_T) / 2);
      plane(sw, WIN_T - WIN_B, WIN_W / 2 + sw / 2, (WIN_B + WIN_T) / 2);
      const frameM = lambert(0x3a3f47);
      for (const [w, h, x, y] of [[WIN_W + 0.1, 0.06, 0, WIN_B], [WIN_W + 0.1, 0.06, 0, WIN_T], [0.06, WIN_T - WIN_B, -WIN_W / 2, (WIN_B + WIN_T) / 2], [0.06, WIN_T - WIN_B, WIN_W / 2, (WIN_B + WIN_T) / 2]]) {
        const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), frameM); f.position.set(x, y, 0.03); face.add(f);
      }
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W, WIN_T - WIN_B), new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.07, depthWrite: false, fog: false }));
      glass.position.set(0, (WIN_B + WIN_T) / 2, -0.02); face.add(glass);
    } else {
      plane(FW, CH, 0, CH / 2);
    }
  }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(RAD, 8), lambert(0x4a4f57)); floor.rotation.set(-Math.PI / 2, 0, Math.PI / 8); cabin.add(floor);
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(RAD, 8), lambert(0xc9ced6)); ceil.rotation.set(Math.PI / 2, 0, Math.PI / 8); ceil.position.y = CH; cabin.add(ceil);
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.6, 24), new THREE.MeshBasicMaterial({ color: 0xf5f8ff })); lamp.rotation.x = Math.PI / 2; lamp.position.y = CH - 0.01; cabin.add(lamp);

  // console con schermi
  const screenTex = canvasTex(1024, 512, () => {});
  const drawConsole = (title, line2, warn) => screenTex.redraw((c, w, h) => {
    c.fillStyle = '#04121e'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#1c4a6e'; c.lineWidth = 2;
    for (let x = 0; x < w; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    c.strokeStyle = '#38e1ff'; c.lineWidth = 4; c.beginPath();
    for (let x = 0; x < w; x += 8) c.lineTo(x, 360 + Math.sin(x * 0.03 + performance.now() * 0.002) * 40);
    c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = warn ? '#ff5a5a' : '#7CFC8A'; fitText(c, title, w / 2, 130, w * 0.86, 92);
    c.fillStyle = '#d8f3ff'; fitText(c, line2, w / 2, 220, w * 0.86, 46, { weight: '700' });
  });
  drawConsole('AURORA', 'VERIFICA SISTEMI');
  const scrM = new THREE.MeshBasicMaterial({ map: screenTex });
  const leds = [];
  for (const i of [2, 6]) {
    const th = (i * Math.PI) / 4;
    const cg = new THREE.Group(); cg.rotation.y = th; cg.position.set(-Math.sin(th) * (AP - 0.35), 0, -Math.cos(th) * (AP - 0.35)); cabin.add(cg);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.95, 0.6), lambert(0x30353d)); desk.position.y = 0.48; cg.add(desk);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.62), lambert(0x1f2329)); top.position.y = 0.97; top.rotation.x = -0.25; cg.add(top);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), scrM); scr.position.set(0, 1.55, -0.25); cg.add(scr);
    for (let k = 0; k < 14; k++) {
      const m = new THREE.MeshBasicMaterial({ color: [0x22ff66, 0xff3333, 0xffcc00, 0x33aaff][k % 4] });
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.05), m); l.position.set(-0.75 + k * 0.11, 1.0, 0.12); cg.add(l); leds.push(m);
    }
  }
  // sedili
  for (const x of [-0.9, 0.9]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.6), lambert(0x2563eb)); seat.position.set(x, 0.5, 1.4); cabin.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.12), lambert(0x2563eb)); back.position.set(x, 0.95, 1.7); cabin.add(back);
  }
  // portellone sul retro
  const hatch = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), lambert(0x8a919c)); hatch.position.set(0, 1.25, AP - 0.01); hatch.rotation.y = Math.PI; cabin.add(hatch);

  const astros = [makePerson({ shirt: 0xf0f0f0, shorts: 0xe0e0e0, astronaut: true }), makePerson({ shirt: 0xf0f0f0, shorts: 0xe0e0e0, astronaut: true })];
  astros[0].position.set(-1.65, 0, -0.55); astros[0].rotation.y = Math.PI / 2 + 0.25;
  astros[1].position.set(1.65, 0, -0.55); astros[1].rotation.y = -Math.PI / 2 - 0.25;
  const patchTex = canvasTex(128, 64, (c, w, h) => { c.fillStyle = '#1e3a8a'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '900 30px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('AURORA', w / 2, h / 2); });
  astros.forEach((a) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshBasicMaterial({ map: patchTex })); p.position.set(0.1, 1.3, 0.125); a.add(p); cabin.add(a); });

  // ---------- superficie di Marte ----------
  const surf = new THREE.Group(); surf.visible = false; g.add(surf);
  const msky = skyDome(0xb9825a, 0xe2b48a, { exponent: 0.7 }); surf.add(msky);
  const tgeo = new THREE.PlaneGeometry(1400, 1400, 110, 110); tgeo.rotateX(-Math.PI / 2);
  const tp = tgeo.attributes.position; const tcol = new Float32Array(tp.count * 3); const cc = new THREE.Color();
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), z = tp.getZ(i); const d = Math.hypot(x, z);
    let h = Math.sin(x * 0.012) * Math.cos(z * 0.01) * 6 + Math.sin(x * 0.04 + z * 0.03) * 1.5 + Math.max(0, d - 300) * 0.12 * (0.5 + 0.5 * Math.sin(x * 0.005 + z * 0.004));
    h *= smooth(10, 60, d);
    tp.setY(i, h);
    cc.setScalar(0.85 + Math.random() * 0.12 + h * 0.004);
    tcol.set([cc.r, cc.g, cc.b], i * 3);
  }
  tgeo.setAttribute('color', new THREE.BufferAttribute(tcol, 3)); tgeo.computeVertexNormals();
  surf.add(new THREE.Mesh(tgeo, photoMat(PH('red_laterite_soil_stones'), { fallback: 0xb85a33, tint: 0xffd8c0, repeat: [220, 220], vertexColors: true })));
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 1), photoMat(PH('rock_boulder_dry'), { fallback: 0x7a3a22, tint: 0xd08060, repeat: [1, 1] }), 380);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 380; i++) {
    const a = R() * Math.PI * 2, d = 6 + R() * 200, s = 0.15 + R() * R() * 1.6;
    m4.compose(new THREE.Vector3(Math.cos(a) * d, s * 0.3, Math.sin(a) * d), q.setFromEuler(e.set(R() * 3, R() * 3, R() * 3)), new THREE.Vector3(s, s * 0.7, s));
    rocks.setMatrixAt(i, m4);
  }
  surf.add(rocks);
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(160 + R() * 200, 60 + R() * 120, 8), lambert(0x9a4a2a)); const a = R() * Math.PI * 2; m.position.set(Math.cos(a) * 650, 20, Math.sin(a) * 650); surf.add(m); }
  // lander alle spalle e rover
  const lander = new THREE.Group(); lander.position.set(0, 0, 7); surf.add(lander);
  const lb = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 3.4, 8), lambert(0xd9dde3)); lb.position.y = 3; lander.add(lb);
  const lt = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.2, 8), lambert(0xc9ced6)); lt.position.y = 5.8; lander.add(lt);
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2 + Math.PI / 4; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 6), lambert(0x888888)); leg.position.set(Math.cos(a) * 3, 1.2, Math.sin(a) * 3); leg.rotation.z = Math.cos(a) * 0.5; leg.rotation.x = -Math.sin(a) * 0.5; lander.add(leg); }
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 3.5), lambert(0x9aa1ab)); ramp.position.set(0, 0.8, -2.6); ramp.rotation.x = -0.45; lander.add(ramp);
  const rover = new THREE.Group(); rover.position.set(-7, 0, -9); rover.rotation.y = 0.6; surf.add(rover);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 3), lambert(0xeeeeee)); rb.position.y = 1; rover.add(rb);
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.4, 0.15), lambert(0xcccccc)); mast.position.set(0.6, 1.9, 1); rover.add(mast);
  const camHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.3), lambert(0x333333)); camHead.position.set(0.6, 2.65, 1); rover.add(camHead);
  const wg = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12); wg.rotateZ(Math.PI / 2);
  for (const z of [-1.1, 0, 1.1]) for (const x of [-1.15, 1.15]) { const w = new THREE.Mesh(wg, lambert(0x222222)); w.position.set(x, 0.4, z); rover.add(w); }
  const flag = new THREE.Group(); flag.position.set(4, 0, -12); surf.add(flag);
  const fpole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), lambert(0xcccccc)); fpole.position.y = 1.3; flag.add(fpole);
  const ftex = canvasTex(256, 160, (c, w, h) => { c.fillStyle = '#1e3a8a'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '900 40px Arial'; c.textAlign = 'center'; c.fillText('MISSIONE', w / 2, 65); c.fillText('AURORA', w / 2, 115); });
  const fm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), new THREE.MeshLambertMaterial({ map: ftex, side: THREE.DoubleSide })); fm.position.set(0.6, 2.2, 0); flag.add(fm);
  const surfAstros = [makePerson({ shirt: 0xf0f0f0, shorts: 0xe0e0e0, astronaut: true }), makePerson({ shirt: 0xf0f0f0, shorts: 0xe0e0e0, astronaut: true })];
  surfAstros.forEach((a) => surf.add(a));
  const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(new Array(1500 * 3).fill(0).map((_, i) => (i % 3 === 1 ? Math.random() * 12 : (Math.random() - 0.5) * 80))), 3)),
    new THREE.PointsMaterial({ color: 0xe0a070, size: 0.05, transparent: true, opacity: 0.6, depthWrite: false }));
  surf.add(dust);

  // dissolvenza (sfera attorno alla testa)
  const fadeM = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false });
  const fade = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), fadeM); fade.renderOrder = 999; fade.visible = false;

  // ---------- timeline ----------
  let T = -1, P = -1, started = false, post = false, landed = false;
  let snd = null, said = {}, lastConsole = 0;
  const once = (k, fn) => { if (!said[k]) { said[k] = true; fn(); } };
  const fogSurf = new THREE.Fog(0xd8a27a, 60, 950);

  const inst = {
    group: g,
    spawn: { x: 0, z: 0.3, yaw: 0 },
    background: 0x000000,
    fog: null,
    studio: { distance: 1.75, scale: 0.74 },
    postLiveSeconds: 40,
    update(dt, t, ph, cam) {
      if (cam && fade.parent !== cam) cam.add(fade);
      leds.forEach((m, i) => { const on = Math.sin(t * (2 + (i % 5)) + i) > 0.2; m.color.setHex(on ? [0x22ff66, 0xff3333, 0xffcc00, 0x33aaff][i % 4] : 0x111111); });
      if (started && !post) T += dt;
      if (post) P += dt;
      const tt = Math.max(0, T);
      // astronauti
      astros.forEach((a, i) => {
        const float = tt > 44 ? Math.sin(t * 0.8 + i) * 0.06 + 0.08 : 0;
        a.position.y = float;
        a.userData.armR.rotation.x = -1.1 + Math.sin(t * 1.7 + i * 2) * 0.35;
        a.userData.armL.rotation.x = -0.9 + Math.cos(t * 1.3 + i) * 0.3;
      });
      // decollo
      const launch = Math.max(0, tt - 26);
      const alt = 0.5 * 18 * launch * launch;
      pad.position.y = -alt;
      pad.visible = alt < 5000;
      clouds.forEach((c) => { c.position.y -= launch > 0 ? Math.min(400, launch * 25) * dt : 0; c.visible = c.position.y > -800; });
      const k = smooth(0, 3000, alt);
      sky.lerpColors(0x3d86d6, 0xc4def3, 0x000000, 0x00020a, k);
      stars.material.opacity = smooth(0.4, 1, k);
      sunGlow.material.opacity = smooth(0.5, 1, k) * 0.9;
      const shakeAmp = launch > 0 && launch < 16 ? 0.01 * (1 - launch / 16) : 0;
      cabin.position.set((Math.random() - 0.5) * shakeAmp, (Math.random() - 0.5) * shakeAmp, (Math.random() - 0.5) * shakeAmp);
      // Terra che si allontana
      if (tt > 38 && !landed) {
        earth.visible = !post || P < 10;
        const D = lerp(170, 1400, smooth(38, 170, tt));
        const dir = new THREE.Vector3(-0.72, -0.28, -0.62).normalize();
        earth.position.copy(dir).multiplyScalar(D);
        earth.rotation.y += dt * 0.03; clouds2.rotation.y += dt * 0.008;
      }
      // console
      if (t - lastConsole > 0.5) {
        lastConsole = t;
        if (started && tt < 26) drawConsole('T - ' + Math.max(0, Math.ceil(26 - tt)), 'CONTO ALLA ROVESCIA', tt > 16);
        else if (tt >= 26 && tt < 44) drawConsole('DECOLLO', 'VELOCITÀ ' + Math.round(launch * 640).toLocaleString('it-IT') + ' KM/H', tt > 32 && tt < 36);
        else if (tt >= 44 && !post) drawConsole('ROTTA: MARTE', 'DISTANZA DALLA TERRA: ' + Math.round(earth.position.length() * 120).toLocaleString('it-IT') + ' KM');
        else if (post && !landed) drawConsole('MARTE', P < 16 ? 'AVVICINAMENTO' : 'DISCESA IN CORSO', P > 16);
        else if (!started) drawConsole('AURORA', 'VERIFICA SISTEMI');
      }
      // fase finale: arrivo su Marte
      if (post) {
        const D = lerp(1600, 150, smooth(0, 16, P));
        mars.visible = !landed;
        mars.position.set(0, -0.32 * D, -D); mars.rotation.y += dt * 0.02;
        const entry = P > 16 && P < 22.5;
        plasma.forEach((p, i) => { p.material.opacity = entry ? 0.4 + Math.random() * 0.6 : 0; p.scale.setScalar(2.5 + Math.random() * 2); });
        if (entry) { const a = 0.01; cabin.position.set((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a); sky.lerpColors(0x000000, 0x00020a, 0x4a1a08, 0x8a3a10, smooth(16, 21, P)); }
        if (P > 21.5 && P < 23) { fade.visible = true; fadeM.opacity = smooth(21.5, 22.6, P); }
        if (P >= 23 && !landed) {
          landed = true; cabin.visible = false; ext.visible = false; surf.visible = true; inst.fog = fogSurf; inst.background = 0xd8a27a;
          hemi.color.setHex(0xffd9bf); hemi.groundColor.setHex(0x5a2a1a); hemi.intensity = 1.1; sunL.color.setHex(0xffe6cc); sunL.position.set(-150, 120, -80);
          plasma.forEach((p) => (p.visible = false));
        }
        if (landed) {
          fadeM.opacity = 1 - smooth(23.2, 24.6, P); fade.visible = fadeM.opacity > 0.01;
          surfAstros.forEach((a, i) => {
            const ang = t * 0.12 + i * Math.PI;
            const x = 3 + Math.cos(ang) * (4 + i * 2), z = -9 + Math.sin(ang) * (3 + i);
            const nx = 3 + Math.cos(ang + 0.05) * (4 + i * 2), nz = -9 + Math.sin(ang + 0.05) * (3 + i);
            a.position.set(x, Math.abs(Math.sin(t * 2.4 + i)) * 0.15, z); a.rotation.y = Math.atan2(nx - x, nz - z);
            animatePerson(a, t * 4.8 + i, 0.4);
          });
          const dp = dust.geometry.attributes.position.array;
          for (let i = 0; i < dp.length; i += 3) { dp[i] += dt * 1.2; if (dp[i] > 40) dp[i] -= 80; }
          dust.geometry.attributes.position.needsUpdate = true;
        }
      }
      if (snd) snd.tick(tt, P);
    },
    onPhase(ph) {
      if (ph === 'immersion') { started = true; T = 0; }
      if (ph === 'postlive') { post = true; P = 0; }
    },
    dispose() { if (fade.parent) fade.parent.remove(fade); fade.geometry.dispose(); fadeM.dispose(); },
    minImmersion: 75,
    // in cabina: niente pannelli oltre le pareti
    panelDist(p, d, want) {
      if (landed) return want;
      const R = 2.25, b = p.x * d.x + p.z * d.z, c = p.x * p.x + p.z * p.z - R * R;
      const t = -b + Math.sqrt(Math.max(0, b * b - c));
      return Math.max(1.1, Math.min(want, t - 0.2));
    },
    bounds(p) {
      const r = landed ? 60 : 0.9, d = Math.hypot(p.x, p.z);
      if (d > r) { p.x *= r / d; p.z *= r / d; }
    },
    startAudio(s) {
      const dest = s.out;
      // aria della cabina: ventole e ronzio degli impianti
      const hum = s.osc('sawtooth', 55); const hf = s.filter('lowpass', 160, 1); const hg = s.gain(0.08); hum.connect(hf).connect(hg).connect(dest);
      const fan = A.bed(s, dest, { kind: 'pink', type: 'lowpass', f: 700, q: 0.5, level: 0.07, lfo: 0 });
      s.every(2600, () => { if (Math.random() < 0.6) A.beeps(s, dest, s.t, 0.05); });
      const al = A.alarm(s, dest, 0.06);
      // l'altoparlante di bordo con la sala di controllo (banda telefonica)
      const radioBus = s.filter('bandpass', 1500, 0.6, dest);
      // il rombo arriva attutito dentro la cabina
      const muffled = s.filter('lowpass', 900, 0.7, dest);
      let countdown = null, roar = null, descent = null;
      const synthLaunch = () => {
        if (inst._fb) return; inst._fb = true;
        const r1 = s.noise('brown'); const rf = s.filter('lowpass', 500, 0.7); const rg = s.gain(0); r1.connect(rf).connect(rg).connect(dest);
        const t = s.t; rg.gain.setValueAtTime(0.0001, t); rg.gain.linearRampToValueAtTime(1, t + 1.5); rg.gain.setValueAtTime(1, t + 14); rg.gain.linearRampToValueAtTime(0.0001, t + 22);
      };
      snd = {
        tick(tt, P) {
          if (tt >= 1) once('cd', () => { countdown = s.stream(SND.apolloCountdown.url, { gain: 1.0, dest: radioBus, loop: false, random: false }); });
          if (tt >= 26) once('lift', () => {
            roar = s.stream(SND.apolloRombo.url, { gain: 1.2, dest: muffled, loop: false, random: false, onFail: synthLaunch });
            A.boom(s, muffled, s.t, 0.9);
          });
          if (tt >= 33) once('al', () => { al.on(); s.after(3000, () => al.off()); });
          if (tt >= 52) once('fade', () => { s.fade(roar, 0, 10); s.fade(countdown, 0.25, 6); });
          if (tt >= 70) once('fade2', () => s.fade(countdown, 0, 6));
          if (P >= 6) once('desc', () => { descent = s.stream(SND.discesa.url, { gain: 0.9, dest: radioBus, loop: false, random: false }); });
          if (P >= 16) once('entry', () => {
            al.on(); s.after(2500, () => al.off());
            const r1 = s.noise('brown'); const rf = s.filter('lowpass', 400, 0.7); const rg = s.gain(0); r1.connect(rf).connect(rg).connect(dest);
            const t = s.t; rg.gain.setValueAtTime(0.0001, t); rg.gain.linearRampToValueAtTime(0.7, t + 2); rg.gain.linearRampToValueAtTime(0.0001, t + 7.5);
          });
          if (P >= 23) once('surf', () => {
            s.fade(descent, 0, 3);
            hg.gain.setValueAtTime(0.0, s.t); fan.gain.setValueAtTime(0.0, s.t);
            A.bed(s, dest, { kind: 'pink', type: 'bandpass', f: 380, q: 0.4, level: 0.14, lfo: 0.09, depth: 0.7 });
          });
        }
      };
    }
  };
  return inst;
}
