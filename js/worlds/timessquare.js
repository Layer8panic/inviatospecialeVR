// BREAKING NEWS – Natale al buio a Times Square
import * as THREE from 'three';
import { rng, canvasTex, skyDome, starField, makeGlow, lambert, makeVehicle, fallingParticles, fitText, photoMat, PH, buildingsGeometry, mergeStatic, glowPoints } from './common.js';
import { SND } from '../sounds.js';
import { makeCharacter, bakeAtlas, impostorCrowd, SKINS, HAIR, CIVILIANS } from '../people.js';
import { Colliders } from '../physics.js';
import * as A from '../audio.js';
import { SoundScope } from '../audio.js';

const BULBS = [0xff3030, 0x30ff60, 0x3080ff, 0xffd030, 0xff50ff, 0xffffff];

function bulbPoints(positions, U, size = 0.35) {
  const n = positions.length / 3;
  const col = new Float32Array(n * 3), seed = new Float32Array(n), c = new THREE.Color();
  for (let i = 0; i < n; i++) { c.set(BULBS[i % BULBS.length]); col.set([c.r, c.g, c.b], i * 3); seed[i] = Math.random(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: U.uTime, uOn: U.uOn, uSize: { value: size } },
    vertexShader: `attribute vec3 aCol; attribute float aSeed; uniform float uTime, uOn, uSize; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vC = aCol;
        vA = uOn * (0.55 + 0.45 * step(0.0, sin(uTime * 2.5 + aSeed * 12.0)));
        gl_PointSize = clamp(uSize * 900.0 / -mv.z, 1.5, 30.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5 || vA < 0.01) discard; gl_FragColor = vec4(vC, vA * smoothstep(0.5, 0.1, d)); }`
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
}

export function createTimesSquare(env) {
  const g = new THREE.Group();
  const R = rng(44);
  const U = { uTime: { value: 0 }, uOn: { value: 1 }, uLight: { value: 1 } };
  const col = new Colliders();

  const hemi = new THREE.HemisphereLight(0xc9b8ff, 0x3a2f3a, 1.15); g.add(hemi);
  const key = new THREE.DirectionalLight(0xfff0e0, 0.5); key.position.set(30, 80, 40); g.add(key);
  const sky = skyDome(0x0a0f24, 0x40284a, { exponent: 0.45 }); g.add(sky);
  const stars = starField(300, 3000, { size: 1.4, minY: 0.3, opacity: 0.0 }); g.add(stars);

  // strade e marciapiedi
  const road = new THREE.Mesh(new THREE.PlaneGeometry(20, 520), photoMat(PH('asphalt_snow'), { fallback: 0x34363c, tint: 0xd8dce6, repeat: [5, 130], normal: PH('asphalt_snow', 'nor_gl') }));
  road.rotation.x = -Math.PI / 2; road.position.z = 40; g.add(road);
  const laneTex = canvasTex(64, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(240,240,240,0.8)'; c.fillRect(0, 0, w, h / 2); }, { repeat: [1, 90] });
  for (const x of [-3.2, 3.2]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 520), new THREE.MeshLambertMaterial({ map: laneTex, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 })); l.rotation.x = -Math.PI / 2; l.position.set(x, 0.01, 40); g.add(l); }
  const walkM = photoMat(PH('snow_floor'), { fallback: 0xc9ccd6, tint: 0xe6e9f0, repeat: [2, 170] });
  for (const x of [-13, 13]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 520), walkM); sw.position.set(x, 0.09, 40); g.add(sw); }
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(6, 0.16, 90), photoMat(PH('red_sandstone_pavement'), { fallback: 0x6e2a2a, tint: 0xa86a64, repeat: [2, 30] })); plaza.position.set(0, 0.08, 15); g.add(plaza);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), lambert(0x1a1a1e)); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; g.add(ground);

  // edifici con finestre illuminate
  // grattacieli: una ripetizione della texture = 12 m x 14 m (5 finestre x 4 piani)
  const facadeTex = canvasTex(512, 600, (c, w, h) => {
    c.fillStyle = '#15171c'; c.fillRect(0, 0, w, h);
    for (let fy = 0; fy < 4; fy++) for (let fx = 0; fx < 5; fx++) {
      const x = fx * w / 5 + 8, y = fy * h / 4 + 14;
      c.fillStyle = '#262a33'; c.fillRect(x, y, w / 5 - 16, h / 4 - 34);
      c.fillStyle = '#323844'; c.fillRect(x + 4, y + 4, w / 5 - 24, h / 4 - 42);
    }
  });
  const litTex = canvasTex(512, 600, (c, w, h) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let fy = 0; fy < 4; fy++) for (let fx = 0; fx < 5; fx++) {
      if (r() < 0.45) continue;
      const x = fx * w / 5 + 12, y = fy * h / 4 + 18;
      c.fillStyle = ['#ffe4a8', '#fff3d6', '#cfe0ff', '#ffd27a'][Math.floor(r() * 4)];
      c.globalAlpha = 0.55 + r() * 0.45; c.fillRect(x, y, w / 5 - 24, h / 4 - 42); c.globalAlpha = 1;
    }
  });
  facadeTex.wrapS = facadeTex.wrapT = litTex.wrapS = litTex.wrapT = THREE.RepeatWrapping;
  const bMat = new THREE.MeshLambertMaterial({ map: facadeTex, vertexColors: true, emissive: 0xffffff, emissiveMap: litTex, emissiveIntensity: 0.9 });
  const blist = []; const facades = [];
  for (const side of [-1, 1]) {
    for (let z = -110; z < 220; ) {
      const len = 18 + R() * 20, h = Math.round(4 + R() * 8) * 14, dep = 30;
      blist.push({ x: side * (16 + dep / 2), y: h / 2, z: z + len / 2, w: dep, h, d: len - 0.6, color: new THREE.Color().setHSL(0.6 + R() * 0.1, 0.1, 0.55 + R() * 0.35).getHex(), u0: Math.floor(R() * 5) / 5 });
      facades.push({ side, z0: z, len, h });
      z += len;
    }
  }
  blist.push({ x: 0, y: 70, z: -128, w: 26, h: 140, d: 18, color: 0x8a90a0 });
  blist.push({ x: 0, y: 60, z: 240, w: 60, h: 120, d: 20, color: 0x8a90a0 });
  const blds = new THREE.Mesh(buildingsGeometry(blist, [12, 14]), bMat);
  g.add(blds);

  // maxischermi pubblicitari (marchi inventati)
  const ads = [
    { t: 'HAPPY HOLIDAYS', s: 'NEW YORK CITY', bg: ['#b30000', '#ff2a2a'], fg: '#ffffff' },
    { t: 'MERRY CHRISTMAS', s: 'FROM TIMES SQUARE', bg: ['#064d1f', '#13a046'], fg: '#ffe9a8' },
    { t: 'SNOWY COLA', s: 'FRESCA COME LA NEVE', bg: ['#0b2a6b', '#2f7dff'], fg: '#ffffff' },
    { t: 'THE NUTCRACKER', s: 'BROADWAY • TONIGHT 8 PM', bg: ['#2b0b4a', '#8a2be2'], fg: '#ffd400' },
    { t: 'WINTER SALE', s: '-50% • 7TH AVENUE', bg: ['#ff6a00', '#ffcc00'], fg: '#1a1a1a' },
    { t: 'I ♥ NY', s: 'WELCOME TO THE BIG APPLE', bg: ['#ffffff', '#e5e5e5'], fg: '#d10000' },
    { t: 'NEW YEAR 2027', s: 'COUNTDOWN • 7 DAYS', bg: ['#000000', '#333333'], fg: '#00e5ff' },
    { t: 'SKATE AT THE RINK', s: 'OPEN UNTIL MIDNIGHT', bg: ['#003a5c', '#00a3d9'], fg: '#ffffff' },
    { t: 'GALAXY PHONE X', s: 'IL REGALO PERFETTO', bg: ['#111111', '#444b5a'], fg: '#7CFC8A' },
    { t: 'HOT CHOCOLATE', s: 'CORNER CAFÉ • 2 $', bg: ['#4a2511', '#8b4513'], fg: '#ffe3c2' }
  ];
  const adMats = [];
  const animated = [];
  const mkAd = (ad, w, h) => {
    const tex = canvasTex(512, Math.round(512 * h / w), () => {}, { mip: false });
    const draw = (k = 0) => tex.redraw((c, cw, ch) => {
      const gr = c.createLinearGradient(0, 0, cw, ch); gr.addColorStop(0, ad.bg[0]); gr.addColorStop(1, ad.bg[1]);
      c.fillStyle = gr; c.fillRect(0, 0, cw, ch);
      if (k) { c.fillStyle = `hsla(${(k * 40) % 360},90%,60%,0.25)`; c.beginPath(); c.arc(cw * (0.5 + 0.4 * Math.sin(k)), ch * 0.5, ch * 0.6, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = ad.fg; c.textAlign = 'center'; c.textBaseline = 'middle';
      const fs = fitText(c, ad.t, cw / 2, ch * 0.42, cw * 0.88, Math.min(ch * 0.36, 120));
      fitText(c, ad.s, cw / 2, ch * 0.76, cw * 0.88, Math.min(ch * 0.13, fs * 0.5), { weight: '700' });
    });
    draw();
    const m = new THREE.MeshBasicMaterial({ map: tex });
    adMats.push(m);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    return { mesh, draw };
  };
  let ai = 0;
  facades.forEach((f, idx) => {
    if (f.z0 > 120) return;
    const nAds = 1 + Math.floor(R() * 3);
    let y = 7;
    for (let k = 0; k < nAds; k++) {
      const w = Math.min(f.len - 2, 9 + R() * 14), h = 5 + R() * 9;
      const { mesh, draw } = mkAd(ads[ai++ % ads.length], w, h);
      mesh.position.set(f.side * 15.9, y + h / 2, f.z0 + f.len / 2 + (R() - 0.5) * (f.len - w - 1));
      mesh.rotation.y = f.side > 0 ? -Math.PI / 2 : Math.PI / 2;
      g.add(mesh); y += h + 1.5 + R() * 4;
      if (R() < 0.35) animated.push(draw);
    }
  });
  // schermi impilati sulla torre di fondo
  for (let k = 0; k < 4; k++) {
    const { mesh, draw } = mkAd(ads[(k * 3 + 1) % ads.length], 24, 9);
    mesh.position.set(0, 12 + k * 11, -118.9); g.add(mesh); animated.push(draw);
  }
  // ticker notizie
  const tickMsg = 'NEWS  ▪  CHRISTMAS EVE IN NEW YORK  ▪  SNOW TONIGHT  ▪  TIMES SQUARE CELEBRATES  ▪  MARKETS CLOSED FOR THE HOLIDAY  ▪  ';
  const tctx = document.createElement('canvas').getContext('2d'); tctx.font = '900 44px Arial';
  const tickTex = canvasTex(Math.ceil(tctx.measureText(tickMsg).width), 64, (c, w, h) => {
    c.fillStyle = '#050505'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffcc00'; c.font = '900 44px Arial'; c.textBaseline = 'middle';
    c.fillText(tickMsg, 0, h / 2);
  }, { repeat: [3, 1], mip: false });
  const tickM = new THREE.MeshBasicMaterial({ map: tickTex }); adMats.push(tickM);
  const ticker = new THREE.Mesh(new THREE.PlaneGeometry(200, 2), tickM); ticker.position.set(-15.85, 5, 20); ticker.rotation.y = Math.PI / 2; g.add(ticker);
  const ticker2 = new THREE.Mesh(new THREE.PlaneGeometry(26, 2), tickM); ticker2.position.set(0, 5.5, -118.8); g.add(ticker2);

  // albero di Natale
  const tree = new THREE.Group(); tree.position.set(0, 0.16, -24); g.add(tree);
  const treeM = lambert(0x0f4d26);
  const bulbs = [];
  [[5, 5, 2.5], [4.2, 4.5, 5.5], [3.2, 4, 8.3], [2.2, 3.5, 10.8], [1.2, 2.6, 12.8]].forEach(([r, h, y]) => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), treeM); c.position.y = y; tree.add(c);
    for (let k = 0; k < 70; k++) { const a = Math.random() * Math.PI * 2, f = Math.random(); const rr = r * (1 - f) * 1.02 + 0.05; bulbs.push(Math.cos(a) * rr, y - h / 2 + f * h, Math.sin(a) * rr - 24); }
  });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.5, 8), lambert(0x4a2b16)); trunk.position.y = 0.75; tree.add(trunk);
  const star = makeGlow(0xffe27a, 3.5, 1); star.position.set(0, 14.5, 0); tree.add(star);
  const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.45), new THREE.MeshBasicMaterial({ color: 0xffe27a })); starCore.position.set(0, 14.4, 0); tree.add(starCore);
  for (let i = 0; i < bulbs.length; i += 3) bulbs[i + 1] += 0.16;
  g.add(bulbPoints(bulbs, U, 0.25));
  // ghirlande luminose sopra la strada
  const gar = [];
  for (const z of [-70, -45, -5, 25, 55, 90]) {
    for (let k = 0; k <= 48; k++) { const x = -16 + (32 * k) / 48; const sag = 2.5 * (1 - Math.pow((x / 16), 2)); gar.push(x, 13 - sag, z); }
  }
  g.add(bulbPoints(gar, U, 0.3));
  // lampioni
  const lampHeads = [], lampHeadM = new THREE.MeshBasicMaterial({ color: 0xfff0c8 }), lampGlowPos = [];
  for (let z = -100; z <= 180; z += 24) for (const x of [-10.6, 10.6]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 7, 6), lambert(0x2b2f36)); p.position.set(x, 3.5, z); g.add(p);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), lampHeadM); hd.position.set(x, 7.1, z); g.add(hd); lampGlowPos.push(x, 7.1, z);
  }

  // taxi e auto
  const cars = [];
  for (let i = 0; i < 10; i++) {
    const dir = i % 2 ? -1 : 1;
    const taxi = R() < 0.7;
    const v = makeVehicle({ body: taxi ? 0xf2bf00 : [0x111111, 0xdddddd, 0x7a0d0d][i % 3], stripe: taxi ? 0x111111 : null, bar: null, len: 4.8, hei: 1.6, wid: 1.9, taxi });
    for (const x of [-0.6, 0.6]) { const hg = makeGlow(0xfff3d0, 2.2, 0.8); hg.position.set(x, 0.75, 2.5); v.add(hg); }
    v.position.set(dir > 0 ? -6.3 : 6.3, 0, -110 + R() * 300); v.rotation.y = dir > 0 ? 0 : Math.PI;
    v.userData.dir = dir; v.userData.sp = 6 + R() * 5; g.add(v); cars.push(v);
    col.follow(v, 0, [2.0, 5.0]);
  }
  // polizia (arriva dopo il blackout)
  const police = [makeVehicle({ body: 0xf2f2f2, stripe: 0x1e40af, bar: 'police', len: 5, hei: 1.7 }), makeVehicle({ body: 0xf2f2f2, stripe: 0x1e40af, bar: 'police', len: 5, hei: 1.7 })];
  police[0].position.set(-3, 0, -95); police[0].rotation.y = 0.9;
  police[1].position.set(4, 0, 140); police[1].rotation.y = 2.3;
  police.forEach((p) => { p.visible = false; g.add(p); col.follow(p, 0, [2.0, 5.2]); });

  // ---- dettagli di strada newyorkesi ----
  const metal = lambert(0x2b2f36);
  // scalinata rossa luminosa (Duffy Square)
  const steps = new THREE.Group(); steps.position.set(0, 0.16, -58); g.add(steps);
  const redGlass = new THREE.MeshPhongMaterial({ color: 0xc0102a, emissive: 0x8a0018, emissiveIntensity: 0.9, shininess: 120, specular: 0xffffff, transparent: true, opacity: 0.92 });
  for (let k = 0; k < 16; k++) { const st = new THREE.Mesh(new THREE.BoxGeometry(12, 0.38, 0.6), redGlass); st.position.set(0, 0.19 + k * 0.38, k * -0.6); st.scale.y = 1; steps.add(st); const riser = new THREE.Mesh(new THREE.BoxGeometry(12, 0.38 * (k + 1), 0.6), lambert(0x2a0a10)); riser.position.set(0, 0.19 * (k + 1), k * -0.6 - 0.001); riser.scale.set(0.999, 1, 0.98); steps.add(riser); }
  col.box(0, -62.5, 12.4, 10);
  // ingresso della metropolitana con i globi verdi
  const sub = new THREE.Group(); sub.position.set(-11.5, 0.18, 12); g.add(sub);
  for (const z of [-2.2, 2.2]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 4.4), metal); rail.position.set(z > 0 ? 0 : 0, 0.5, 0); rail.position.x = z > 0 ? 1.1 : -1.1; sub.add(rail); }
  const subFront = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 0.06), metal); subFront.position.set(0, 0.5, 2.2); sub.add(subFront);
  for (const x of [-1.1, 1.1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), metal); post.position.set(x, 1.3, 2.2); sub.add(post); const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), new THREE.MeshBasicMaterial({ color: 0x41d36b })); globe.position.set(x, 2.7, 2.2); sub.add(globe); const gg = makeGlow(0x41d36b, 1.4, 0.7); gg.position.copy(globe.position); sub.add(gg); sub.userData.lights = (sub.userData.lights || []).concat([globe, gg]); }
  const subSign = canvasTex(512, 96, (c, w, h) => { c.fillStyle = '#111'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.textBaseline = 'middle'; fitText(c, 'SUBWAY  42 St  Times Sq', 16, h / 2, w - 30, 52, { align: 'left' }); });
  const ss = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.4), new THREE.MeshBasicMaterial({ map: subSign })); ss.position.set(0, 1.35, 2.24); sub.add(ss);
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 4.3), lambert(0x050505)); hole.rotation.x = -Math.PI / 2; hole.position.set(0, 0.01, 0); sub.add(hole);
  col.box(-11.5, 12, 2.4, 4.6);
  // carretto degli hot dog
  const cart = new THREE.Group(); cart.position.set(11.4, 0.18, -6); cart.rotation.y = Math.PI / 2; g.add(cart);
  const cbody = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), lambert(0xd9d9d9)); cbody.position.y = 0.8; cart.add(cbody);
  const cTex = canvasTex(512, 128, (c, w, h) => { c.fillStyle = '#ffcc00'; c.fillRect(0, 0, w, h); c.fillStyle = '#c1121f'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'HOT DOGS • PRETZELS', w / 2, h / 2, w * 0.9, 60); });
  const csign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.45), new THREE.MeshLambertMaterial({ map: cTex })); csign.position.set(0, 0.85, 0.51); cart.add(csign);
  const umb = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 12, 1, true), new THREE.MeshLambertMaterial({ color: 0x1e60c8, side: THREE.DoubleSide })); umb.position.y = 2.6; cart.add(umb);
  const up = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), metal); up.position.y = 1.9; cart.add(up);
  for (const x of [-0.8, 0.8]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 14), lambert(0x111111)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.3, 0.55); cart.add(w); }
  col.box(11.4, -6, 1.2, 2.2);
  // garitta della polizia
  const booth = new THREE.Group(); booth.position.set(-11.6, 0.18, -22); g.add(booth);
  const bb = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 1.8), new THREE.MeshPhongMaterial({ color: 0x1e3a8a, shininess: 40 })); bb.position.y = 1.3; booth.add(bb);
  const bTex = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#1e3a8a'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'POLICE', w / 2, h / 2, w * 0.9, 48); });
  for (let k = 0; k < 4; k++) { const bs = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: bTex })); bs.position.set(Math.sin(k * Math.PI / 2) * 0.91, 2.3, Math.cos(k * Math.PI / 2) * 0.91); bs.rotation.y = k * Math.PI / 2; booth.add(bs); }
  col.box(-11.6, -22, 2, 2);
  // idranti, semafori, cartelli stradali, chiusini con vapore
  for (const [x, z] of [[-10.4, -40], [10.4, 30], [-10.4, 60], [10.4, -75]]) {
    const hy = new THREE.Group(); hy.position.set(x, 0.18, z); g.add(hy);
    const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 12), lambert(0xc81e1e)); hb.position.y = 0.35; hy.add(hb);
    const hc = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0xc81e1e)); hc.position.y = 0.7; hy.add(hc);
    col.circle(x, z, 0.25);
  }
  const tlights = [];
  for (const [x, z, ry] of [[-10.2, -32, 0], [10.2, -30, Math.PI], [-10.2, 46, 0], [10.2, 48, Math.PI]]) {
    const tl = new THREE.Group(); tl.position.set(x, 0.18, z); tl.rotation.y = ry; g.add(tl);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.5, 8), metal); pole.position.y = 2.75; tl.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.12), metal); arm.position.set(1.7 * Math.sign(-x), 5.3, 0); tl.add(arm);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.3), lambert(0x1a1a1a)); box.position.set(3.2 * Math.sign(-x), 4.7, 0); tl.add(box);
    const lampsT = [0xff2a2a, 0xffb400, 0x2aff6a].map((cc, k) => { const m = new THREE.MeshBasicMaterial({ color: 0x222222 }); const l = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), m); l.position.set(3.2 * Math.sign(-x), 5.0 - k * 0.3, 0.16); tl.add(l); return { m, cc }; });
    const signT = canvasTex(512, 96, (c, w, h) => { c.fillStyle = '#0d6b3a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, z < 0 ? 'W 47 St' : 'W 44 St', w / 2, h / 2, w * 0.85, 58); });
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.3), new THREE.MeshBasicMaterial({ map: signT, side: THREE.DoubleSide })); sg.position.set(1.0 * Math.sign(-x), 5.65, 0); tl.add(sg);
    tlights.push(lampsT);
    col.circle(x, z, 0.2);
  }
  const bway = canvasTex(512, 96, (c, w, h) => { c.fillStyle = '#0d6b3a'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'BROADWAY', w / 2, h / 2, w * 0.85, 62); });
  const bws = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.34), new THREE.MeshBasicMaterial({ map: bway, side: THREE.DoubleSide })); bws.position.set(-10.2, 3.2, -32); bws.rotation.y = Math.PI / 2; g.add(bws);
  // vapore dai tombini (tipico di New York)
  const steamTex = canvasTex(64, 64, (c, w, h) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  const steam = [];
  for (const [x, z] of [[-4.5, -15], [5, 38], [-5.5, 75]]) {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.4, 12), new THREE.MeshLambertMaterial({ color: 0xff6a00 })); cone.position.set(x, 0.7, z); g.add(cone);
    const strip = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.41, 0.2, 12), lambert(0xffffff)); strip.position.set(x, 0.9, z); g.add(strip);
    col.circle(x, z, 0.45);
    for (let k = 0; k < 14; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0.5 })); sp.userData = { x, z, ph: k / 14 }; g.add(sp); steam.push(sp); }
  }
  // dissuasori e panchine della zona pedonale
  for (let z = -40; z <= 55; z += 5) for (const x of [-3.15, 3.15]) { if (Math.abs(z - 6) < 4) continue; const bo = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.9, 10), lambert(0x6b6f78)); bo.position.set(x, 0.6, z); g.add(bo); col.circle(x, z, 0.15); }
  // colonne dei lampioni e albero
  for (let z = -100; z <= 180; z += 24) for (const x of [-10.6, 10.6]) col.circle(x, z, 0.15);
  col.circle(0, -24, 5.2);
  // gli edifici: non si può entrare
  col.box(-31, 50, 30, 400).box(31, 50, 30, 400).box(0, -128, 26, 18);

  // ---- persone ----
  const people = [];
  const look = () => ({ skin: SKINS[Math.floor(R() * SKINS.length)], hair: HAIR[Math.floor(R() * HAIR.length)], height: 1.58 + R() * 0.3 });
  const winter = [0x1f2937, 0x111827, 0x7f1d1d, 0x374151, 0x1e3a8a, 0x5b3a29, 0xb91c1c, 0x064e3b, 0x6b7280, 0xd4d4d8, 0x3b1f4f];
  const lanes = [[-13.6, -1], [-12.2, 1], [12.2, -1], [13.6, 1], [-2.0, 1], [2.0, -1]];
  const loadP = async () => {
    const jobs = [];
    for (let i = 0; i < 34; i++) {
      const model = CIVILIANS[Math.floor(R() * CIVILIANS.length)];
      const coat = winter[Math.floor(R() * winter.length)];
      jobs.push(makeCharacter(model, { ...look(), colors: { Shirt: coat, Jacket: coat, LightJacket: winter[Math.floor(R() * winter.length)], Dress: coat } }).then((c) => {
        const [x, dir] = lanes[i % lanes.length];
        c.lane = x + (R() - 0.5) * 0.8; c.dir = dir; c.speed = 1.1 + R() * 0.45;
        c.obj.position.set(c.lane, 0.17, -90 + R() * 220); c.obj.rotation.y = dir > 0 ? 0 : Math.PI;
        c.play('walk', { speed: c.speed / 1.3, offset: R() });
        c.torchDelay = 2 + R() * 6;
        // alcuni sono fermi a fare foto all'albero
        if (i % 9 === 0) { c.still = true; c.obj.position.set(-2.5 + R() * 5, 0.16, -14 + R() * 4); c.obj.rotation.y = Math.PI + (R() - 0.5); c.play('idle', { offset: R() }); }
        g.add(c.obj); people.push(c); col.follow(c.obj, 0.3);
      }));
    }
    await Promise.all(jobs);
  };
  const peopleReady = loadP();
  // folla lontana: impostori che camminano sui marciapiedi
  const far = { mesh: null, glow: null };
  const farReady = env && env.renderer ? bakeAtlas(env.renderer, CIVILIANS.map((n, i) => ({ name: n, skin: SKINS[(i * 3) % SKINS.length], hair: HAIR[i % HAIR.length], clip: 'walk', colors: { Shirt: winter[i % winter.length], Jacket: winter[(i + 3) % winter.length] } })), { frames: 8, cellW: 72, cellH: 150 }).then((atlas) => {
    const items = [];
    for (let i = 0; i < 340; i++) {
      const side = i % 2 ? 1 : -1, dir = R() < 0.5 ? 1 : -1;
      items.push({ x: side * (12 + R() * 2.6), y: 0.18, z: 40, yaw: 0, row: i % 8, phase: R(), speed: 0.9 + R() * 0.5, dir: [0, 0, dir] });
    }
    const m = impostorCrowd(atlas, items, { width: 0.9, height: 1.72, fps: 9, mode: 'face', uniforms: U, walk: { len: 260 } });
    g.add(m); far.mesh = m;
    // torce dei telefoni degli impostori (stesso movimento, calcolato nello shader)
    const q = new THREE.PlaneGeometry(0.5, 0.5);
    const gg = new THREE.InstancedBufferGeometry(); gg.index = q.index; gg.attributes.position = q.attributes.position; gg.attributes.uv = q.attributes.uv;
    for (const k of ['iOff', 'iDir', 'iPh', 'iSp']) gg.setAttribute(k, m.geometry.attributes[k]);
    gg.instanceCount = items.length;
    const gm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: U.uTime, uOn: { value: 0 } },
      vertexShader: `attribute vec3 iOff; attribute vec3 iDir; attribute float iPh; attribute float iSp; uniform float uTime, uOn; varying vec2 vUv; varying float vA;
        void main(){ vUv = uv; vec3 o = iOff + iDir * (mod(uTime * iSp * 1.3 + iPh * 260.0, 260.0) - 130.0); o.y += 1.35;
          vA = uOn * step(0.45, fract(iPh * 7.31));
          vec3 camR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); vec3 camU = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
          vec3 w = o + camR * (position.x + 0.25) + camU * position.y; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }`,
      fragmentShader: 'varying vec2 vUv; varying float vA; void main(){ float d = length(vUv - 0.5); if (vA < 0.5) discard; gl_FragColor = vec4(1.0, 0.98, 0.92, smoothstep(0.5, 0.0, d)); }'
    });
    const glowM = new THREE.Mesh(gg, gm); glowM.frustumCulled = false; g.add(glowM); far.glow = gm;
  }) : Promise.resolve();

  const snow = fallingParticles({ count: 2600, box: [70, 40, 70], color: 0xffffff, size: 0.07, speed: 1.3, drift: 0.9, opacity: 0.9 });
  g.add(snow);

  const lampGlow = glowPoints(lampGlowPos, { color: 0xffe2a0, size: 5, opacity: 0.65 }); g.add(lampGlow);
  mergeStatic(g);
  let T = -1, started = false, blackoutAt = 35, out = false, outT = 0, boFired = false, snd = null, animT = 0, animK = 0;
  const tmp = new THREE.Vector3();
  const setPower = (k) => {
    adMats.forEach((m) => m.color.setScalar(k));
    bMat.emissiveIntensity = 0.9 * k;
    U.uOn.value = k > 0.5 ? 1 : 0;
    star.visible = starCore.visible = k > 0.5;
    lampHeadM.color.setHex(k > 0.5 ? 0xfff0c8 : 0x222222); lampGlow.visible = k > 0.5;
    redGlass.emissiveIntensity = 0.9 * k;
    (sub.userData.lights || []).forEach((o) => (o.visible = k > 0.5));
    tlights.forEach((ls) => ls.forEach((l) => l.m.color.setHex(k > 0.5 ? l.m.userData.on || 0x222222 : 0x111111)));
  };

  const inst = {
    group: g,
    spawn: { x: 0, z: 6, yaw: 0 },
    background: 0x0a0f24,
    fog: new THREE.Fog(0x241a30, 80, 420),
    studio: { distance: 2.3, scale: 1 },
    colliders: col,
    ready: Promise.all([peopleReady, farReady]),
    update(dt, t, ph, cam) {
      U.uTime.value = t;
      snow.userData.mat.uniforms.uTime.value = t;
      if (cam) { cam.getWorldPosition(tmp); snow.userData.mat.uniforms.uCenter.value.set(tmp.x, 0, tmp.z); }
      if (started) T += dt;
      tickTex.offset.x = (t * 0.04) % 1;
      if (!out) {
        animT += dt;
        if (animT > 0.35) { animT = 0; animK += 0.4; animated.forEach((d, i) => d(animK + i)); }
        // semafori: rosso, verde, giallo
        const cyc = (t % 20);
        tlights.forEach((ls, i) => { const st = ((cyc + i * 10) % 20) < 9 ? 2 : ((cyc + i * 10) % 20) < 11 ? 1 : 0; ls.forEach((l, k) => { l.m.userData.on = k === st ? l.cc : 0x222222; l.m.color.setHex(l.m.userData.on); }); });
      }
      steam.forEach((sp) => { const k = (t * 0.25 + sp.userData.ph) % 1; sp.position.set(sp.userData.x + Math.sin(t + k * 5) * 0.4 * k, 1.2 + k * 6, sp.userData.z + k * 0.8); sp.scale.setScalar(0.8 + k * 3.2); sp.material.opacity = 0.45 * (1 - k); });
      cars.forEach((v) => {
        const sp = v.userData.sp * (out ? 0.55 : 1);
        v.position.z += v.userData.dir * sp * dt;
        v.userData.wheels.forEach((w) => (w.rotation.x += sp * dt / 0.36));
        if (v.position.z > 200) v.position.z = -112; if (v.position.z < -112) v.position.z = 200;
      });
      for (const c of people) {
        if (!c.still) {
          const sp = c.speed * (out ? 0.55 : 1);
          c.obj.position.z += c.dir * sp * dt;
          if (c.obj.position.z > 140) c.obj.position.z = -95; if (c.obj.position.z < -95) c.obj.position.z = 140;
          if (c.lane > -4 && c.lane < 4 && c.obj.position.z > -30 && c.obj.position.z < -17) c.obj.position.z = c.dir > 0 ? -17 : -30; // girano attorno all'albero
          if (c.current) c.current.timeScale = out ? 0.55 * c.speed / 1.3 : c.speed / 1.3;
        }
        if (out && !c.torchOn && T > blackoutAt + c.torchDelay) c.setTorch(true);
        c.update(dt);
      }
      if (far.glow) far.glow.uniforms.uOn.value = out && T > blackoutAt + 3 ? 1 : 0;
      if (far.mesh) { far.mesh.setFog(inst.fog); U.uLight.value = out ? 0.35 : 1; }
      // blackout
      if (started && !out && T >= blackoutAt) {
        outT += dt;
        const flick = outT < 1.4 ? (Math.sin(outT * 47) > 0.2 ? 1 : 0.1) : 0;
        setPower(flick);
        if (!boFired) { boFired = true; if (snd) snd.blackout(); }
        if (outT >= 1.4) {
          out = true; setPower(0.02);
          hemi.intensity = 0.22; hemi.color.setHex(0x8090b0); key.intensity = 0.12;
          sky.setColors(0x020309, 0x0b0d16); stars.material.opacity = 0.8;
          inst.fog.color.setHex(0x070910); snow.userData.mat.uniforms.uColor.value.setHex(0x9aa3b5);
          inst.background = 0x020309;
          police.forEach((p) => (p.visible = true));
        }
      }
      if (out) police.forEach((p, i) => p.userData.flash(t + i));
      if (snd) snd.update();
    },
    debugBlackout() { started = true; T = blackoutAt + 12; },
    onPhase(ph, info) {
      if (ph === 'immersion') { started = true; T = 0; if (info && info.duration) blackoutAt = Math.max(30, info.duration - 28); }
    },
    bounds(p) { p.x = THREE.MathUtils.clamp(p.x, -15.6, 15.6); p.z = THREE.MathUtils.clamp(p.z, -100, 150); },
    startAudio(s) {
      const dest = s.out;
      let music = null, street = null, market = null, synthMusic = null;
      const streetLP = s.filter('lowpass', 18000, 0.5, dest);
      street = s.stream(SND.timesSquare.url, { gain: 1.0, dest: streetLP, onFail: () => {
        A.bed(s, dest, { kind: 'pink', type: 'bandpass', f: 520, q: 1.6, level: 0.1, lfo: 0.9, depth: 0.5 });
        A.bed(s, dest, { kind: 'brown', type: 'lowpass', f: 300, q: 0.5, level: 0.22, lfo: 0.05, depth: 0.2 });
      } });
      market = s.stream(SND.mercatino.url, { gain: 0.35, dest });
      s.stream(SND.folla.url, { gain: 0.4, dest: s.panner(0, 2, -10, { ref: 15, roll: 0.5 }) });
      const speakers = s.panner(0, 6, -22, { ref: 18, roll: 0.7 });
      music = s.stream(SND.jingle.url, { gain: 0.75, dest: speakers, random: false, onFail: () => { synthMusic = A.jingle(s, speakers, { level: 0.3 }); } });
      s.every(4000, () => { if (Math.random() < 0.45) A.horn(s, s.panner((Math.random() < 0.5 ? -6 : 6), 1, -60 + Math.random() * 140, { ref: 10 }), s.t, 0.12, 330 + Math.random() * 160); });
      snd = {
        blackout() {
          // la musica rallenta e si ferma come quando manca la corrente
          if (music && music.ok) {
            let r = 1; const id = setInterval(() => { r -= 0.08; if (r <= 0.3) { clearInterval(id); try { music.el.pause(); } catch (e) {} s.fade(music, 0, 0.1); } else music.el.playbackRate = r; }, 60);
          }
          if (synthMusic) synthMusic.stop();
          A.powerDown(s, dest, s.t);
          A.crowdOoh(s, dest, s.t + 0.4, 0.3);
          s.fade(market, 0, 1.5);
          s.fade(street, 0.6, 2);
          streetLP.frequency.setTargetAtTime(2500, s.t, 0.8);
          s.after(1500, () => s.stream(SND.blackout.url, { gain: 0.8, dest }));
          s.after(5000, () => {
            police.forEach((p, i) => { const pn = s.panner(p.position.x, 2, p.position.z, { ref: 30, roll: 0.8 }); s.stream(SND.sirenaNY.url, { gain: 1.0, dest: pn, onFail: () => A.sirenUS(s, pn, { level: 0.3 }) }); });
          });
        },
        update() {}
      };
    }
  };
  return inst;
}
