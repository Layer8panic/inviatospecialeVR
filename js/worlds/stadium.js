// SPORT – La notte della grande finale, allo stadio Santiago Bernabéu di Madrid
import * as THREE from 'three';
import { rng, canvasTex, skyDome, starField, makeGlow, lambert, fitText, applyTex, photoMat, PH, LOCAL, roundedRect, alongRing, ringStrip, mergeStatic, glowPoints } from './common.js';
import { makeTVCamera } from '../ui.js';
import { SND } from '../sounds.js';
import * as A from '../audio.js';
import { makeCharacter, bakeAtlas, impostorCrowd, SKINS, HAIR } from '../people.js';
import { Colliders } from '../physics.js';

const WHITE = 0xf4f4f4, REAL_PURPLE = 0x4b2a7b, BARCA_RED = 0x9b0f3e, BARCA_BLUE = 0x0b4c9c;

// catino: rettangolo arrotondato attorno al campo (105 x 68)
const A0 = 59, B0 = 40.5, R0 = 15;
const TIERS = [
  { d0: 0.8, rows: 28, depth: 0.82, rise: 0.46, y0: 1.3 },
  { d0: 27.5, rows: 17, depth: 0.85, rise: 0.62, y0: 20.0 },
  { d0: 44.5, rows: 17, depth: 0.88, rise: 0.72, y0: 34.0 }
];

export function createStadium(env) {
  const g = new THREE.Group();
  const R = rng(7);
  const U = { uTime: { value: 0 }, uExcite: { value: 0.8 }, uOla: { value: 0 }, uLight: { value: 1 } };
  const col = new Colliders();

  g.add(new THREE.HemisphereLight(0xd8e2ff, 0x2a3320, 1.15));
  const dl = new THREE.DirectionalLight(0xffffff, 1.3); dl.position.set(30, 90, 40); g.add(dl);
  const dl2 = new THREE.DirectionalLight(0xe6ecff, 0.7); dl2.position.set(-40, 80, -30); g.add(dl2);
  g.add(skyDome(0x02040d, 0x111a33));
  g.add(starField(600, 3000, { size: 1.5, minY: 0.25, opacity: 0.6 }));

  // ---- campo ----
  const PW = 115, PH2 = 76;
  const lineTex = canvasTex(2300, 1520, (c, w, h) => {
    const s = w / PW; c.clearRect(0, 0, w, h);
    for (let i = 0; i < 22; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.10)'; c.fillRect((i * w) / 22, 0, w / 22 + 1, h); }
    c.strokeStyle = '#f4f4f4'; c.lineWidth = 0.12 * s * 1.3;
    const X = (m) => (m + PW / 2) * s, Y = (m) => (m + PH2 / 2) * s;
    c.strokeRect(X(-52.5), Y(-34), 105 * s, 68 * s);
    c.beginPath(); c.moveTo(X(0), Y(-34)); c.lineTo(X(0), Y(34)); c.stroke();
    c.beginPath(); c.arc(X(0), Y(0), 9.15 * s, 0, Math.PI * 2); c.stroke();
    for (const sg of [-1, 1]) {
      const gx = sg * 52.5;
      c.strokeRect(Math.min(X(gx), X(gx - sg * 16.5)), Y(-20.15), 16.5 * s, 40.3 * s);
      c.strokeRect(Math.min(X(gx), X(gx - sg * 5.5)), Y(-9.15), 5.5 * s, 18.3 * s);
      c.beginPath(); c.arc(X(gx - sg * 11), Y(0), 9.15 * s, sg > 0 ? Math.PI * 0.705 : -Math.PI * 0.295, sg > 0 ? Math.PI * 1.295 : Math.PI * 0.295); c.stroke();
      c.fillStyle = '#f4f4f4'; c.beginPath(); c.arc(X(gx - sg * 11), Y(0), 0.3 * s, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#f4f4f4'; c.beginPath(); c.arc(X(0), Y(0), 0.3 * s, 0, Math.PI * 2); c.fill();
  });
  const grassM = new THREE.MeshLambertMaterial({ color: 0x2f7d32 });
  grassM.userData.mapTint = 0x9fd08c;
  applyTex(grassM, LOCAL('grasslight-big.jpg'), { repeat: [30, 20] });
  applyTex(grassM, LOCAL('grasslight-big-nm.jpg'), { slot: 'normalMap', repeat: [30, 20], color: false });
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH2), grassM); pitch.rotation.x = -Math.PI / 2; g.add(pitch);
  const lines = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH2), new THREE.MeshLambertMaterial({ map: lineTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  lines.rotation.x = -Math.PI / 2; g.add(lines);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(2 * (A0 + 2), 2 * (B0 + 2)), lambert(0x1e4a26)); apron.rotation.x = -Math.PI / 2; apron.position.y = -0.05; g.add(apron);

  // porte con reti
  const postM = lambert(0xffffff);
  const netTex = canvasTex(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2; for (let k = 0; k <= w; k += 16) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k, h); c.moveTo(0, k); c.lineTo(w, k); c.stroke(); } }, { repeat: [8, 4] });
  const netM = new THREE.MeshLambertMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  for (const sg of [-1, 1]) {
    const gp = new THREE.Group(); gp.position.x = sg * 52.5;
    const pg = new THREE.CylinderGeometry(0.06, 0.06, 2.44, 10);
    for (const z of [-3.66, 3.66]) { const p = new THREE.Mesh(pg, postM); p.position.set(0, 1.22, z); gp.add(p); }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7.32, 10), postM); bar.rotation.x = Math.PI / 2; bar.position.y = 2.44; gp.add(bar);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(7.32, 2.44), netM); back.position.set(sg * 2, 1.22, 0); back.rotation.y = Math.PI / 2; gp.add(back);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(2, 7.32), netM); top.position.set(sg * 1, 2.44, 0); top.rotation.x = Math.PI / 2; gp.add(top);
    for (const z of [-3.66, 3.66]) { const sd = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.44), netM); sd.position.set(sg, 1.22, z); gp.add(sd); }
    g.add(gp);
    col.box(sg * 53.5, 0, 2.2, 7.6);
  }
  for (const x of [-52.5, 52.5]) for (const z of [-34, 34]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6), lambert(0xffffff)); pole.position.set(x, 0.75, z); g.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshLambertMaterial({ color: 0xffd400, side: THREE.DoubleSide })); fl.position.set(x + 0.2, 1.35, z); g.add(fl);
  }

  // ---- catino a tre anelli ----
  const concrete = photoMat(PH('concrete_floor_02'), { fallback: 0x5d626c, tint: 0x9aa0aa, repeat: [1, 1], side: THREE.DoubleSide });
  const seatTex = canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#d7dbe3'; c.fillRect(0, 0, w, h); c.fillStyle = '#8f98ab'; c.fillRect(0, h * 0.55, w, h * 0.45); c.fillStyle = '#20242c'; c.fillRect(0, h * 0.92, w, h * 0.08); });
  seatTex.wrapS = seatTex.wrapT = THREE.RepeatWrapping;
  const seatsM = new THREE.MeshLambertMaterial({ map: seatTex, side: THREE.DoubleSide });
  const boxesTex = canvasTex(256, 64, (c, w, h) => {
    c.fillStyle = '#1b2230'; c.fillRect(0, 0, w, h);
    for (let x = 4; x < w; x += 32) { const lg = c.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, '#ffe7b8'); lg.addColorStop(1, '#a98b5c'); c.fillStyle = lg; c.fillRect(x, 10, 26, h - 22); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x, h - 22, 26, 4); }
    c.fillStyle = '#c9ced8'; c.fillRect(0, 0, w, 6); c.fillRect(0, h - 8, w, 8);
  });
  boxesTex.wrapS = boxesTex.wrapT = THREE.RepeatWrapping;
  const boxesM = new THREE.MeshLambertMaterial({ map: boxesTex, emissive: 0xffffff, emissiveMap: boxesTex, emissiveIntensity: 0.5, side: THREE.DoubleSide });
  const crowdItems = [];
  let topY = 0, lastD = 0;
  TIERS.forEach((T, ti) => {
    const yTop = T.y0 + T.rows * T.rise, dTop = T.d0 + T.rows * T.depth;
    const inner = roundedRect(A0, B0, R0, T.d0), outer = roundedRect(A0, B0, R0, dTop);
    g.add(new THREE.Mesh(ringStrip(inner, T.y0, outer, yTop, { uScale: 0.9, vLen: T.rows }), seatsM));
    const lip = roundedRect(A0, B0, R0, T.d0 - 0.05);
    g.add(new THREE.Mesh(ringStrip(lip, ti === 0 ? 0 : T.y0 - 2.6, lip, T.y0 + 0.9, { uScale: ti === 0 ? 4 : 8 }), ti === 0 ? concrete : boxesM));
    for (let r = 0; r < T.rows; r++) {
      const d = T.d0 + (r + 0.5) * T.depth, y = T.y0 + (r + 1) * T.rise - 0.05;
      const ring = roundedRect(A0, B0, R0, d, { nx: 60, nz: 40, na: 18 });
      let s = 0;
      alongRing(ring, 0.62, (x, z, nx, nz) => {
        s += 0.62;
        if ((s % 14) < 1.3) return; // scale di accesso
        if (R() < 0.03) return;
        const ang = Math.atan2(z, x);
        const away = ti === 2 && ang > 0.35 && ang < 0.95; // settore ospiti
        crowdItems.push({ x, y, z, yaw: Math.atan2(-nx, -nz), row: pickRow(away, R), phase: R(), speed: 0.8 + R() * 0.5 });
      });
    }
    if (ti < 2) {
      const next = TIERS[ti + 1];
      const back = roundedRect(A0, B0, R0, dTop);
      g.add(new THREE.Mesh(ringStrip(back, yTop, back, next.y0 - 0.2, { uScale: 8 }), boxesM));
      const slab = roundedRect(A0, B0, R0, next.d0 - 0.06);
      g.add(new THREE.Mesh(ringStrip(back, next.y0 - 0.2, slab, next.y0 - 0.2), concrete));
    }
    topY = yTop; lastD = dTop;
  });
  const wallRing = roundedRect(A0, B0, R0, lastD + 0.2);
  g.add(new THREE.Mesh(ringStrip(wallRing, topY - 1, wallRing, topY + 8), concrete));
  const roofOut = roundedRect(A0, B0, R0, lastD + 2), roofIn = roundedRect(A0, B0, R0, 22);
  const roofTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#1a1d24'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3a404c'; c.lineWidth = 6; for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } c.lineWidth = 2; c.strokeStyle = '#2b3039'; for (let y = 0; y < h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
  roofTex.wrapS = roofTex.wrapT = THREE.RepeatWrapping;
  g.add(new THREE.Mesh(ringStrip(roofIn, topY + 10, roofOut, topY + 8, { uScale: 6, vLen: 6 }), new THREE.MeshLambertMaterial({ map: roofTex, side: THREE.DoubleSide })));
  const lampRing = roundedRect(A0, B0, R0, 22.5);
  g.add(new THREE.Mesh(ringStrip(lampRing, topY + 9.7, roundedRect(A0, B0, R0, 24), topY + 9.6), new THREE.MeshBasicMaterial({ color: 0xf6f9ff, side: THREE.DoubleSide })));
  const lampPos = []; alongRing(lampRing, 11, (x, z) => lampPos.push(x, topY + 9.2, z)); g.add(glowPoints(lampPos, { color: 0xeaf1ff, size: 14, opacity: 0.55 }));

  // maxischermo a 360 gradi sotto la copertura
  const scrRing = roundedRect(A0, B0, R0, 23);
  const scrMsg = '  ESTADIO SANTIAGO BERNABÉU  •  FINALE INTERNAZIONALE  •  REAL MADRID  vs  FC BARCELONA  •  RISCALDAMENTO  •';
  const sctx = document.createElement('canvas').getContext('2d'); sctx.font = '900 92px Arial';
  const scrW = Math.min(4096, Math.ceil(sctx.measureText(scrMsg).width));
  const scrTex = canvasTex(scrW, 128, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1430'); gr.addColorStop(1, '#03060f'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff'; c.textBaseline = 'middle'; fitText(c, scrMsg, 0, h / 2 + 4, w, 92, { align: 'left' });
  }, { mip: false });
  scrTex.wrapS = THREE.RepeatWrapping; scrTex.repeat.x = -1; // visto dall'interno del catino
  const scrLen = scrW / 128 * 6;
  g.add(new THREE.Mesh(ringStrip(scrRing, topY + 2.5, scrRing, topY + 8.5, { uScale: scrLen, vLen: 1 }), new THREE.MeshBasicMaterial({ map: scrTex, side: THREE.DoubleSide })));

  const nameTex = canvasTex(2048, 160, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'SANTIAGO BERNABÉU', w / 2, h / 2, w * 0.96, 140); });
  const nameP = new THREE.Mesh(new THREE.PlaneGeometry(60, 4.7), new THREE.MeshBasicMaterial({ map: nameTex, transparent: true }));
  nameP.position.set(0, TIERS[1].y0 - 1.4, -(B0 + TIERS[0].d0 + TIERS[0].rows * TIERS[0].depth) + 0.3); g.add(nameP);

  // ---- tifosi: impostori animati ----
  const crowdMesh = { mesh: null };
  const crowdReady = env && env.renderer ? bakeAtlas(env.renderer, crowdVariants(), { clip: 'clap', frames: 8, cellW: 80, cellH: 168 }).then((atlas) => {
    const m = impostorCrowd(atlas, crowdItems, { width: 0.8, height: 1.72, fps: 7, uniforms: U });
    g.add(m); crowdMesh.mesh = m;
  }) : Promise.resolve();

  // striscioni sulle balaustre
  const banners = [
    ['HALA MADRID', '#ffffff', '#4b2a7b'], ['¡VAMOS REAL!', '#1b1b1b', '#ffffff'], ['ESTO ES EL BERNABÉU', '#ffffff', '#111111'],
    ['MADRIDISTAS SIEMPRE', '#d8b04a', '#ffffff'], ['FORÇA BARÇA', '#ffd400', '#9b0f3e'], ['BLAUGRANA', '#ffffff', '#0b4c9c'],
    ['UNA NOCHE MÁGICA', '#ffffff', '#c8102e'], ['LA FINAL ES NUESTRA', '#111111', '#f4f4f4'], ['GRADA FANS', '#ffffff', '#4b2a7b'], ['VISCA EL BARÇA', '#ffd400', '#0b4c9c']
  ];
  let bi = 0;
  const hangBanners = (ring, step, y, w, h) => alongRing(ring, step, (x, z, nx, nz) => {
    const [txt, fg, bg] = banners[bi++ % banners.length];
    const tex = canvasTex(1024, 128, (c, cw, ch) => { c.fillStyle = bg; c.fillRect(0, 0, cw, ch); c.strokeStyle = fg; c.lineWidth = 8; c.strokeRect(6, 6, cw - 12, ch - 12); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, txt, cw / 2, ch / 2 + 4, cw * 0.88, 96); });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
    b.position.set(x - nx * 0.05, y, z - nz * 0.05); b.rotation.y = Math.atan2(-nx, -nz); g.add(b);
  });
  hangBanners(roundedRect(A0, B0, R0, TIERS[0].d0 - 0.1), 31, 0.9 + 1.0, 10, 1.25);
  hangBanners(roundedRect(A0, B0, R0, TIERS[1].d0 - 0.1), 47, TIERS[1].y0 - 1.2, 14, 1.75);

  // bandiere sventolanti tra il pubblico
  const flagMat = (tex) => {
    const m = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = U.uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = modelMatrix[3].x * 0.37 + modelMatrix[3].z * 0.21;
        transformed.z += sin(position.x * 3.0 - uTime * 6.5 + ph) * 0.18 * position.x;`);
    };
    return m;
  };
  const realFlag = canvasTex(256, 160, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#4b2a7b'; c.fillRect(0, h * 0.4, w, h * 0.2); c.fillStyle = '#d8b04a'; c.fillRect(0, h * 0.34, w, h * 0.05); c.fillRect(0, h * 0.61, w, h * 0.05); });
  const barcaFlag = canvasTex(256, 160, (c, w, h) => { for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#0b4c9c' : '#9b0f3e'; c.fillRect((i * w) / 6, 0, w / 6 + 1, h); } c.fillStyle = '#ffd400'; c.fillRect(0, 0, w, h * 0.1); });
  const fR = flagMat(realFlag), fB = flagMat(barcaFlag);
  const flagGeo = new THREE.PlaneGeometry(2.2, 1.4, 12, 4).translate(1.1, 0, 0);
  const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.6, 5).translate(0, 1.3, 0);
  const flags = [];
  for (let i = 0; i < 70 && crowdItems.length; i++) {
    const s = crowdItems[Math.floor(R() * crowdItems.length)];
    const fg = new THREE.Group(); fg.position.set(s.x, s.y + 1.1, s.z);
    fg.add(new THREE.Mesh(poleGeo, lambert(0xaaaaaa)));
    const f = new THREE.Mesh(flagGeo, s.row >= 8 && s.row < 12 ? fB : fR); f.position.y = 2.0; fg.add(f);
    fg.rotation.y = s.yaw + Math.PI / 2; fg.userData.ph = R() * 6; fg.userData.dynamic = true;
    g.add(fg); flags.push(fg);
  }

  // flash dei telefoni in tribuna
  const flashN = 400, fpos = new Float32Array(flashN * 3), fseed = new Float32Array(flashN);
  for (let i = 0; i < flashN && crowdItems.length; i++) { const s = crowdItems[Math.floor(R() * crowdItems.length)]; fpos.set([s.x, s.y + 1.5, s.z], i * 3); fseed[i] = R(); }
  const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3)); fgeo.setAttribute('aSeed', new THREE.BufferAttribute(fseed, 1));
  const flashes = new THREE.Points(fgeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: U.uTime },
    vertexShader: 'attribute float aSeed; uniform float uTime; varying float vA; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); float k = fract(sin(aSeed*91.3 + floor(uTime*6.0 + aSeed*7.0)*13.17)*43758.5); vA = step(0.94, k); gl_PointSize = 16.0 * 60.0 / -mv.z + 2.0; gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(vA<0.5||d>0.5) discard; gl_FragColor = vec4(1.0,1.0,1.0, smoothstep(0.5,0.0,d)); }'
  }));
  flashes.frustumCulled = false; g.add(flashes);

  // LED pubblicitari a bordo campo
  const msgs = ['FINALE INTERNAZIONALE', 'REAL MADRID', 'FC BARCELONA', 'MADRID 2026', 'FAIR PLAY', 'INVIATO SPECIALE TV'];
  const mctx = document.createElement('canvas').getContext('2d'); mctx.font = '900 44px Arial';
  const ledW = Math.ceil(msgs.reduce((a, m) => a + mctx.measureText(m + '   •   ').width, 0));
  const ledTex = canvasTex(ledW, 64, (c, w, h) => {
    let x = 0; c.fillStyle = '#05070c'; c.fillRect(0, 0, w, h); c.font = '900 44px Arial'; c.textBaseline = 'middle';
    msgs.forEach((m, i) => { c.fillStyle = ['#ffd400', '#ffffff', '#ff3b6b', '#46e0ff', '#7CFC8A', '#ff8a00'][i]; c.fillText(m + '   •   ', x, h / 2); x += c.measureText(m + '   •   ').width; });
  }, { repeat: [3, 1] });
  const ledM = new THREE.MeshBasicMaterial({ map: ledTex });
  for (const [x, z, L, ry] of [[-30, 36.5, 44, Math.PI], [30, 36.5, 44, Math.PI], [0, -37.5, 100, 0], [-56.5, 0, 64, Math.PI / 2], [56.5, 0, 64, -Math.PI / 2]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.9), ledM); m.position.set(x, 0.55, z); m.rotation.y = ry; g.add(m);
    const back = new THREE.Mesh(new THREE.BoxGeometry(L, 1, 0.3), lambert(0x111111)); back.position.set(x - Math.sin(ry) * 0.16, 0.5, z - Math.cos(ry) * 0.16); back.rotation.y = ry; g.add(back);
    col.box(x, z, ry === Math.PI || ry === 0 ? L : 0.6, ry === Math.PI || ry === 0 ? 0.6 : L);
  }

  // panchine coperte
  const benchM = new THREE.MeshPhongMaterial({ color: 0xbfd2e6, transparent: true, opacity: 0.45, shininess: 90, side: THREE.DoubleSide });
  for (const sx of [-10, 10]) {
    const b = new THREE.Group(); b.position.set(sx, 0, 39.2);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 9, 20, 1, true, -Math.PI / 2, Math.PI), benchM); roof.rotation.z = Math.PI / 2; roof.position.y = 0.9; b.add(roof);
    const seats = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.45, 0.6), lambert(sx < 0 ? 0xf2f2f2 : 0x0b4c9c)); seats.position.set(0, 0.45, 0.6); b.add(seats);
    g.add(b);
    col.box(sx, 39.4, 9.2, 2.8);
  }

  // telecamere TV
  const tvCams = [];
  const spots = [[-22, 35.8, Math.PI], [22, 35.8, Math.PI], [-56, 8, Math.PI / 2], [56, -8, -Math.PI / 2], [0, -36.5, 0]];
  for (const [x, z, ry] of spots) {
    const cam = makeTVCamera(1.7, { label: false }); cam.position.set(x, 0, z); cam.rotation.y = ry; g.add(cam); tvCams.push(cam);
    col.circle(x, z, 0.55);
  }

  // spidercam
  const spider = new THREE.Group(); spider.userData.dynamic = true; g.add(spider);
  spider.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), lambert(0x222222)));
  const lensS = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), lambert(0x111111)); lensS.position.y = -0.35; spider.add(lensS);
  const cableGeo = new THREE.BufferGeometry().setFromPoints(new Array(8).fill(0).map(() => new THREE.Vector3()));
  g.add(new THREE.LineSegments(cableGeo, new THREE.LineBasicMaterial({ color: 0x555555 })));
  const anchors = [[-70, topY + 8, -50], [70, topY + 8, -50], [-70, topY + 8, 50], [70, topY + 8, 50]].map((a) => new THREE.Vector3(...a));

  const ballTex = canvasTex(128, 64, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; for (let i = 0; i < 10; i++) { c.beginPath(); c.arc((i * 37) % w, (i * 23) % h, 7, 0, Math.PI * 2); c.fill(); } });
  const ballM = new THREE.MeshLambertMaterial({ map: ballTex });

  // ---- persone vere vicino a noi ----
  const people = [];
  const balls = [];
  const kits = {
    real: { Shirt: WHITE, Shirt2: WHITE, Pants: WHITE, Socks: WHITE },
    realGK: { Shirt: 0x2bb673, Shirt2: 0x2bb673, Pants: 0x1b1b1b, Socks: 0x2bb673 },
    barca: { Shirt: BARCA_RED, Shirt2: BARCA_BLUE, Pants: BARCA_BLUE, Socks: BARCA_BLUE },
    barcaGK: { Shirt: 0xf2c200, Shirt2: 0xf2c200, Pants: 0x1b1b1b, Socks: 0xf2c200 }
  };
  const mk = async (model, opts, setup) => {
    const c = await makeCharacter(model, { skin: SKINS[Math.floor(R() * SKINS.length)], hair: HAIR[Math.floor(R() * HAIR.length)], height: 1.72 + R() * 0.16, ...opts });
    g.add(c.obj); setup(c); people.push(c); col.follow(c.obj, 0.35); return c;
  };
  const loadP = async () => {
    const jobs = [];
    for (const side of [-1, 1]) {
      const kit = side < 0 ? kits.real : kits.barca;
      for (let i = 0; i < 7; i++) {
        jobs.push(mk(i % 2 ? 'm_casual' : 'm_shirt', { colors: kit }, (c) => {
          c.mode = i < 4 ? 'jog' : i < 6 ? 'pass' : 'stretch';
          c.cx = side * (14 + R() * 26); c.cz = (R() - 0.5) * 36; c.rx = 5 + R() * 7; c.rz = 3 + R() * 5; c.a = R() * 6; c.sp = 0.22 + R() * 0.12; c.side = side;
          if (c.mode === 'jog') c.play('run', { speed: 0.75 });
          else if (c.mode === 'stretch') { c.obj.position.set(side * 30, 0, -side * 12); c.play('jump', { speed: 0.6 }); }
          else c.play('idle');
        }));
      }
      jobs.push(mk('m_casual', { colors: side < 0 ? kits.realGK : kits.barcaGK }, (c) => { c.mode = 'gk'; c.obj.position.set(side * 51, 0, 0); c.obj.rotation.y = -side * Math.PI / 2; c.play('jump', { speed: 0.8 }); }));
    }
    for (const sx of [-10, 10]) {
      jobs.push(mk('m_suit', { colors: { Shirt: sx < 0 ? 0x161616 : 0x1d2a44, Pants: 0x141414 } }, (c) => { c.mode = 'coach'; c.obj.position.set(sx + (sx < 0 ? 5.5 : -5.5), 0, 36.0); c.obj.rotation.y = Math.PI; c.play('idle'); c.home = c.obj.position.x; }));
      for (let k = 0; k < 3; k++) jobs.push(mk(k % 2 ? 'm_long' : 'm_shirt', { colors: sx < 0 ? { Shirt: 0x2a2f4a, Shirt2: 0x2a2f4a, Pants: 0x1b1b1b } : { Shirt: 0x0b4c9c, Shirt2: 0x0b4c9c, Pants: 0x1b1b1b } }, (c) => { c.mode = 'bench'; c.obj.position.set(sx - 2 + k * 2, 0, 39.75); c.obj.rotation.y = Math.PI; c.play('sit', { once: true }); }));
    }
    for (const [x, z, ry] of spots.slice(0, 4)) {
      jobs.push(mk('m_long', { colors: { Shirt: 0x15171c, Pants: 0x15171c } }, (c) => { c.mode = 'op'; c.obj.position.set(x - Math.sin(ry) * 0.9, 0, z - Math.cos(ry) * 0.9); c.obj.rotation.y = ry; c.play('idle'); }));
    }
    for (let i = 0; i < 6; i++) {
      jobs.push(mk(i % 2 ? 'f_street' : 'm_shirt', { colors: { Shirt: 0xf2e600, Shirt2: 0xf2e600, Jacket: 0xf2e600, LightJacket: 0xf2e600, Pants: 0x1b1b1b } }, (c) => {
        c.mode = 'steward'; const x = -48 + i * 19; c.obj.position.set(x, 0, i % 2 ? -36.8 : 35.6); c.obj.rotation.y = i % 2 ? Math.PI : 0; c.play('idle');
      }));
    }
    await Promise.all(jobs);
    for (let k = 0; k < 2; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 10), ballM); g.add(b); balls.push(b); }
  };
  const peopleReady = loadP();

  mergeStatic(g);
  const inst = {
    group: g,
    spawn: { x: 0, z: 34.0, yaw: 0 },
    background: 0x02040d,
    fog: new THREE.Fog(0x0b1328, 160, 700),
    studio: { distance: 2.3, scale: 1 },
    colliders: col,
    ready: Promise.all([peopleReady, crowdReady]),
    update(dt, t) {
      U.uTime.value = t;
      ledTex.offset.x = (t * 0.03) % 1;
      scrTex.offset.x = (-t * 0.02) % 1;
      U.uOla.value = Math.sin(t * 0.06) > 0.55 ? 1 : 0;
      flags.forEach((f) => { f.rotation.z = Math.sin(t * 2.0 + f.userData.ph) * 0.4; });
      spider.position.set(Math.sin(t * 0.13) * 38, 18 + Math.sin(t * 0.3) * 3, Math.sin(t * 0.21) * 18);
      const arr = cableGeo.attributes.position.array;
      anchors.forEach((a, i) => { arr.set([a.x, a.y, a.z, spider.position.x, spider.position.y + 0.25, spider.position.z], i * 6); });
      cableGeo.attributes.position.needsUpdate = true;
      tvCams.forEach((c, i) => { c.userData.yawG.rotation.y = Math.sin(t * 0.4 + i) * 0.5; });
      const passers = { '-1': [], '1': [] };
      for (const c of people) {
        if (c.mode === 'jog') {
          c.a += c.sp * dt;
          const x = c.cx + Math.cos(c.a) * c.rx, z = c.cz + Math.sin(c.a) * c.rz;
          const nx = c.cx + Math.cos(c.a + 0.05) * c.rx, nz = c.cz + Math.sin(c.a + 0.05) * c.rz;
          c.obj.position.set(x, 0, z); c.obj.rotation.y = Math.atan2(nx - x, nz - z);
        } else if (c.mode === 'pass') passers[c.side].push(c);
        else if (c.mode === 'coach') c.obj.position.x = c.home + Math.sin(t * 0.3 + c.home) * 1.5;
        c.update(dt);
      }
      for (const side of [-1, 1]) {
        const pr = passers[side]; if (pr.length < 2) continue;
        const bx = side * 24, bz = side * 10;
        pr[0].obj.position.set(bx - 8, 0, bz); pr[0].obj.rotation.y = Math.PI / 2;
        pr[1].obj.position.set(bx + 8, 0, bz); pr[1].obj.rotation.y = -Math.PI / 2;
        const b = balls[side > 0 ? 1 : 0];
        if (b) { const cyc = (t * 0.55 + (side > 0 ? 0.5 : 0)) % 2, k = cyc % 1, from = cyc < 1 ? -7.6 : 7.6; b.position.set(bx + from + (cyc < 1 ? 15.2 : -15.2) * k, 0.11 + Math.sin(k * Math.PI) * 0.9, bz); b.rotation.z -= dt * 8; }
      }
      if (crowdMesh.mesh) crowdMesh.mesh.setFog(inst.fog);
    },
    onPhase(ph) {
      if (ph === 'countdown') U.uExcite.value = 1.1;
      if (ph === 'live') U.uExcite.value = 1.25;
    },
    bounds(p) { p.x = THREE.MathUtils.clamp(p.x, -57, 57); p.z = THREE.MathUtils.clamp(p.z, -38.5, 39.6); },
    startAudio(s) {
      const dest = s.out;
      const fallback = () => {
        if (inst._fb) return; inst._fb = true;
        A.bed(s, dest, { kind: 'pink', f: 700, q: 0.5, level: 0.22, lfo: 0.07, depth: 0.5 });
        A.chant(s, s.panner(-75, 10, 0, { ref: 30, roll: 0.6 }), { level: 0.1, base: 50 });
      };
      const hall = (x, y, z) => s.panner(x, y, z, { ref: 70, roll: 0.25 });
      s.stream(SND.stadioCurva.url, { gain: 0.9, dest: hall(-75, 20, 0), onFail: fallback });
      s.stream(SND.coriSpagnoli.url, { gain: 0.95, dest: hall(0, 25, -70) });
      s.stream(SND.coriItaliani.url, { gain: 0.6, dest: hall(75, 20, 10) });
      s.stream(SND.stadioPartita.url, { gain: 0.6, dest: hall(40, 22, 60) });
      s.stream(SND.stadioTifosi.url, { gain: 0.45, dest: hall(-40, 22, 60) });
      A.drums(s, s.panner(-72, 18, 10, { ref: 40, roll: 0.4 }), { bpm: 116, level: 0.4 });
      s.after(4000, () => s.say('Señoras y señores, bienvenidos al Estadio Santiago Bernabéu.', { lang: 'es-ES', rate: 0.95, volume: 0.8 }));
    }
  };
  return inst;
}

// varianti dei tifosi nell'atlante: righe 0-7 Real Madrid, 8-11 Barcellona, 12-15 neutri
function crowdVariants() {
  const R = rng(3);
  const sk = () => SKINS[Math.floor(R() * SKINS.length)], hr = () => HAIR[Math.floor(R() * HAIR.length)];
  const real = (m, extra = {}) => ({ name: m, skin: sk(), hair: hr(), colors: { Shirt: WHITE, Shirt2: WHITE, LightJacket: WHITE, Jacket: 0xdedede, Dress: WHITE, ...extra } });
  const barca = (m, a, b) => ({ name: m, skin: sk(), hair: hr(), colors: { Shirt: a, Shirt2: b, LightJacket: a, Jacket: b, Dress: a } });
  return [
    real('m_casual'), real('f_casual'), real('m_long', { Pants: REAL_PURPLE }), real('m_shirt', { Shirt2: REAL_PURPLE }),
    real('f_street', { Jacket: REAL_PURPLE }), real('f_tank'), { name: 'm_casual', skin: sk(), hair: hr(), colors: { Shirt: REAL_PURPLE } }, { name: 'f_tank', skin: sk(), hair: hr(), colors: { Shirt: 0x161616 } },
    barca('m_casual', BARCA_RED, BARCA_BLUE), barca('f_casual', BARCA_BLUE, BARCA_RED), barca('m_long', BARCA_RED, BARCA_BLUE), barca('f_street', BARCA_BLUE, BARCA_RED),
    { name: 'm_suit', skin: sk(), hair: hr() }, { name: 'f_dress', skin: sk(), hair: hr() }, { name: 'm_shirt', skin: sk(), hair: hr() }, { name: 'f_street', skin: sk(), hair: hr() }
  ];
}
function pickRow(away, R) {
  if (away) return 8 + Math.floor(R() * 4);
  return R() < 0.8 ? Math.floor(R() * 8) : 12 + Math.floor(R() * 4);
}
