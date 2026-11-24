// CRONACA – Il Vesuvio si risveglia: Napoli in allerta (emergenza simulata)
import * as THREE from 'three';
import { rng, canvasTex, skyDome, makeGlow, lambert, makeVehicle, fallingParticles, fitText, photoMat, applyTex, PH, LOCAL, buildingsGeometry, mergeStatic, glowPoints } from './common.js';
import { SND } from '../sounds.js';
import { makeCharacter, bakeAtlas, impostorCrowd, SKINS, HAIR, CIVILIANS } from '../people.js';
import { Colliders } from '../physics.js';
import * as A from '../audio.js';
import { SoundScope } from '../audio.js';

const VX = 700, VZ = -2400;
const PROFILE = [[1500, 0], [1150, 90], [800, 260], [520, 480], [330, 650], [250, 700], [200, 680], [120, 640], [0, 630]];
function heightAt(r) {
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [r0, h0] = PROFILE[i], [r1, h1] = PROFILE[i + 1];
    if (r <= r0 && r >= r1) return h0 + (h1 - h0) * ((r0 - r) / (r0 - r1));
  }
  return 0;
}

export function createVesuvio(env) {
  const g = new THREE.Group();
  const R = rng(21);
  const U = { uTime: { value: 0 }, uFlash: { value: 0 }, uLight: { value: 0.85 } };
  const col = new Colliders();

  g.add(new THREE.HemisphereLight(0xb7a393, 0x3a2e28, 1.0));
  const sun = new THREE.DirectionalLight(0xffa36b, 0.9); sun.position.set(400, 300, -600); g.add(sun);
  const fill = new THREE.DirectionalLight(0xcfd8e6, 0.35); fill.position.set(-200, 200, 300); g.add(fill);
  const sky = skyDome(0x2a2321, 0x7a6050, { exponent: 0.5 }); g.add(sky);

  // mare e costa
  let seaNormal = null;
  const seaM = new THREE.MeshPhongMaterial({ color: 0x243841, specular: 0xffa070, shininess: 70 });
  applyTex(seaM, LOCAL('waternormals.jpg'), { slot: 'normalMap', repeat: [400, 190], color: false, onLoad: (t) => { seaNormal = t; } });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 4200), seaM);
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -1.2, -2106); g.add(sea);
  const land = new THREE.Mesh(new THREE.CircleGeometry(1750, 64), photoMat(PH('aerial_grass_rock'), { fallback: 0x3a362b, tint: 0x8a8070, repeat: [60, 60] })); land.rotation.x = -Math.PI / 2; land.position.set(VX, 0.5, VZ); g.add(land);

  // Vesuvio (con il Monte Somma)
  const pts = PROFILE.map(([r, h]) => new THREE.Vector2(r, h));
  const vgeo = new THREE.LatheGeometry(pts, 72);
  const vp = vgeo.attributes.position;
  for (let i = 0; i < vp.count; i++) {
    const x = vp.getX(i), z = vp.getZ(i), y = vp.getY(i);
    const n = Math.sin(x * 0.011) * Math.cos(z * 0.013) * 22 + Math.sin(x * 0.031 + z * 0.02) * 9;
    if (y > 2) vp.setY(i, y + n * Math.min(1, y / 120));
  }
  vgeo.computeVertexNormals();
  const volcano = new THREE.Mesh(vgeo, photoMat(PH('aerial_rocks_02'), { fallback: 0x4b4038, tint: 0x9a8a80, repeat: [14, 3] })); volcano.position.set(VX, 0, VZ); g.add(volcano);
  const somma = new THREE.Mesh(new THREE.LatheGeometry([[1300, 0], [900, 200], [700, 430], [620, 520], [560, 470]].map(([r, h]) => new THREE.Vector2(r, h)), 48, Math.PI * 0.15, Math.PI * 0.9), photoMat(PH('aerial_rocks_02'), { fallback: 0x3f3730, tint: 0x8a7a70, repeat: [10, 2] }));
  somma.position.set(VX - 150, 0, VZ - 250); g.add(somma);

  // paesi ai piedi del vulcano
  const townN = 420;
  const town = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), lambert(0xffffff), townN);
  const m4 = new THREE.Matrix4(), tcol = new THREE.Color(), q = new THREE.Quaternion();
  for (let i = 0; i < townN; i++) {
    const a = Math.PI * 0.5 + (R() - 0.5) * 1.9, rr = 1250 + R() * 430;
    const x = VX + Math.cos(a) * rr, z = VZ + Math.sin(a) * rr;
    const h = 10 + R() * 22;
    m4.compose(new THREE.Vector3(x, h / 2 + heightAt(rr), z), q.identity(), new THREE.Vector3(16 + R() * 20, h, 16 + R() * 20));
    town.setMatrixAt(i, m4); tcol.set([0xcbb79a, 0xd8c7a8, 0xb59a7a, 0xe0d3bd][Math.floor(R() * 4)]); town.setColorAt(i, tcol);
  }
  g.add(town);

  // bagliore del cratere e colate di lava
  const craterGlow = makeGlow(0xff5a1a, 520, 0.9); craterGlow.position.set(VX, 720, VZ); g.add(craterGlow);
  const craterCore = makeGlow(0xffc070, 180, 1); craterCore.position.set(VX, 700, VZ); g.add(craterCore);
  const lavaM = new THREE.MeshBasicMaterial({ color: 0xff5214, fog: false });
  const lavaGlows = [];
  for (const ang of [Math.PI * 0.42, Math.PI * 0.6, Math.PI * 0.25]) {
    const path = [];
    for (let k = 0; k <= 10; k++) {
      const rr = 230 + k * 75 + Math.sin(k * 1.3) * 20;
      const a = ang + Math.sin(k * 0.8) * 0.05;
      path.push(new THREE.Vector3(VX + Math.cos(a) * rr, heightAt(rr) + 6, VZ + Math.sin(a) * rr));
    }
    const curve = new THREE.CatmullRomCurve3(path);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 9, 6), lavaM));
    for (let k = 0; k < 4; k++) { const gl = makeGlow(0xff4a10, 160, 0.55); gl.position.copy(curve.getPoint(k / 4)); g.add(gl); lavaGlows.push(gl); }
  }

  // colonna eruttiva (particelle animate nello shader)
  const N = 760;
  const seed = new Float32Array(N), ang = new Float32Array(N), rad = new Float32Array(N), pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { seed[i] = R(); ang[i] = R() * Math.PI * 2; rad[i] = Math.sqrt(R()); }
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  cg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  cg.setAttribute('aAng', new THREE.BufferAttribute(ang, 1));
  cg.setAttribute('aRad', new THREE.BufferAttribute(rad, 1));
  const column = new THREE.Points(cg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: U.uTime, uFlash: U.uFlash, uBase: { value: new THREE.Vector3(VX, 690, VZ) } },
    vertexShader: `attribute float aSeed; attribute float aAng; attribute float aRad;
      uniform float uTime; uniform vec3 uBase; varying float vF; varying float vH;
      void main(){
        float f = fract(uTime * 0.02 * (0.8 + aSeed * 0.4) + aSeed);
        float h = pow(f, 0.8) * 1750.0;
        float spread = 50.0 + h * 0.14 + smoothstep(950.0, 1750.0, h) * 950.0;
        vec3 p = uBase + vec3(cos(aAng) * spread * aRad, h, sin(aAng) * spread * aRad * 0.7);
        p.x += pow(h / 1750.0, 2.0) * 650.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp((110.0 + f * 460.0) * 800.0 / -mv.z, 2.0, 240.0);
        vF = f; vH = h;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform float uFlash; varying float vF; varying float vH;
      void main(){
        float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.05, d) * (1.0 - smoothstep(0.72, 1.0, vF)) * smoothstep(0.0, 0.03, vF) * 0.5;
        vec3 c = mix(vec3(0.13, 0.115, 0.105), vec3(0.40, 0.37, 0.35), smoothstep(0.0, 1500.0, vH));
        c = mix(vec3(1.0, 0.38, 0.1), c, smoothstep(0.0, 260.0, vH));
        c += uFlash * vec3(0.6, 0.25, 0.05) * (1.0 - smoothstep(0.0, 900.0, vH));
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }`
  }));
  column.frustumCulled = false; g.add(column);

  // fulmini vulcanici
  const boltGeo = new THREE.BufferGeometry(); boltGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
  const bolt = new THREE.Line(boltGeo, new THREE.LineBasicMaterial({ color: 0xdfe8ff, fog: false })); bolt.visible = false; bolt.frustumCulled = false; g.add(bolt);
  const fireBolt = () => {
    const a = boltGeo.attributes.position.array;
    let x = VX + (Math.random() - 0.3) * 500, y = 1100 + Math.random() * 400, z = VZ + (Math.random() - 0.5) * 200;
    for (let i = 0; i < 14; i++) { a.set([x, y, z], i * 3); x += (Math.random() - 0.5) * 80; y -= 30 + Math.random() * 40; z += (Math.random() - 0.5) * 40; }
    boltGeo.attributes.position.needsUpdate = true; bolt.visible = true; boltT = 0.18;
  };
  let boltT = 0;

  // lungomare, strada, città alle spalle
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 80), photoMat(PH('cobblestone_floor_08'), { fallback: 0x7d746b, tint: 0xc8beb4, repeat: [300, 27], normal: PH('cobblestone_floor_08', 'nor_gl') })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 34); g.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(900, 8), photoMat(PH('asphalt_02'), { fallback: 0x2b2b2e, tint: 0x9a9a9a, repeat: [225, 2], polygonOffset: true, polygonOffsetFactor: -1 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, 10); g.add(road);
  const dashTex = canvasTex(256, 16, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#eeeeee'; c.fillRect(0, 4, 128, 8); }, { repeat: [150, 1] });
  const dash = new THREE.Mesh(new THREE.PlaneGeometry(900, 0.2), new THREE.MeshLambertMaterial({ map: dashTex, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }));
  dash.rotation.x = -Math.PI / 2; dash.position.set(0, 0.03, 10); g.add(dash);
  const wallM = lambert(0x9a8f84);
  const sea_wall = new THREE.Mesh(new THREE.BoxGeometry(900, 1.4, 1.2), wallM); sea_wall.position.set(0, -0.5, -6.2); g.add(sea_wall);
  const railM = lambert(0x2f3a3f);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(900, 0.06, 0.06), railM); rail.position.set(0, 1.05, -5.6); g.add(rail);
  const postG = new THREE.CylinderGeometry(0.03, 0.03, 1.05, 5);
  const posts = new THREE.InstancedMesh(postG, railM, 300);
  for (let i = 0; i < 300; i++) { m4.makeTranslation(-450 + i * 3, 0.52, -5.6); posts.setMatrixAt(i, m4); }
  g.add(posts);
  // lampioni
  const lampHeadM = new THREE.MeshBasicMaterial({ color: 0xffe2a8 }), lampGlow = [];
  for (let x = -132; x <= 132; x += 24) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 5.5, 6), railM); p.position.set(x, 2.75, -4.5); g.add(p);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), lampHeadM); l.position.set(x, 5.6, -4.5); g.add(l);
    lampGlow.push(x, 5.6, -4.5);
    col.circle(x, -4.5, 0.15);
  }
  g.add(glowPoints(lampGlow, { color: 0xffcf80, size: 3, opacity: 0.6 }));
  // facciata napoletana: intonaco, finestre con persiane verdi, balconi in ferro (una ripetizione = 6 m x 3.5 m)
  const facade = canvasTex(512, 300, (c, w, h) => {
    c.fillStyle = '#e9e1d2'; c.fillRect(0, 0, w, h);
    const r = rng(77);
    for (let k = 0; k < 1800; k++) { c.fillStyle = `rgba(${90 + r() * 60},${80 + r() * 50},${60 + r() * 40},${r() * 0.08})`; c.fillRect(r() * w, r() * h, 2 + r() * 6, 2 + r() * 6); }
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, h - 14, w, 6);
    for (const x0 of [w * 0.18, w * 0.62]) {
      const ww = w * 0.2, wh = h * 0.55, y0 = h * 0.18;
      c.fillStyle = '#d8ccb6'; c.fillRect(x0 - 8, y0 - 10, ww + 16, wh + 18);
      c.fillStyle = '#2a2622'; c.fillRect(x0, y0, ww, wh);
      c.fillStyle = '#3f5f3a'; c.fillRect(x0 - ww * 0.42, y0, ww * 0.4, wh); c.fillRect(x0 + ww * 1.02, y0, ww * 0.4, wh);
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2;
      for (let yy = y0 + 6; yy < y0 + wh; yy += 8) { c.beginPath(); c.moveTo(x0 - ww * 0.42, yy); c.lineTo(x0 - ww * 0.02, yy); c.moveTo(x0 + ww * 1.02, yy); c.lineTo(x0 + ww * 1.42, yy); c.stroke(); }
      c.fillStyle = '#1b1b1b'; c.fillRect(x0 - 14, y0 + wh, ww + 28, 6);
      for (let xx = x0 - 12; xx < x0 + ww + 14; xx += 8) c.fillRect(xx, y0 + wh - 26, 2, 26);
      c.fillRect(x0 - 14, y0 + wh - 28, ww + 28, 3);
    }
  });
  facade.wrapS = facade.wrapT = THREE.RepeatWrapping;
  const pal = [0xe0b46a, 0xd08a5a, 0xf0dcb8, 0xc86a50, 0xf2e6c4, 0xdcae7c, 0xd9a090, 0xe8c890];
  const blist = [];
  for (const rowZ of [27, 52, 78]) {
    for (let x = -330; x < 330; ) {
      const w = 14 + R() * 16, d = 18 + R() * 6, h = Math.round((4 + Math.floor(R() * 4) + (rowZ > 30 ? 2 : 0))) * 3.5;
      blist.push({ x: x + w / 2, y: h / 2, z: rowZ + (R() - 0.5) * 3, w, h, d, color: pal[Math.floor(R() * pal.length)], u0: R() });
      x += w + 0.5;
    }
  }
  const blds = new THREE.Mesh(buildingsGeometry(blist, [6, 3.5]), new THREE.MeshLambertMaterial({ map: facade, vertexColors: true }));
  g.add(blds);
  const roofs = new THREE.Mesh(buildingsGeometry(blist.map((b) => ({ ...b, y: b.h + 0.5, h: 1, w: b.w + 0.6, d: b.d + 0.6, color: 0x8a5a44 }))), lambert(0x8a5a44));
  g.add(roofs);

  // pannello della Protezione Civile
  const signTex = canvasTex(1024, 256, () => {});
  const msgs = ['EMERGENZA VESUVIO', 'ALLONTANARSI DALLA ZONA ROSSA', 'SEGUIRE LE INDICAZIONI', 'NON AVVICINARSI AL VULCANO'];
  let msgI = 0;
  const drawSign = () => signTex.redraw((c, w, h) => {
    c.fillStyle = '#080808'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffb000'; c.textAlign = 'center'; c.textBaseline = 'middle';
    fitText(c, 'PROTEZIONE CIVILE', w / 2, 60, w * 0.9, 44); fitText(c, msgs[msgI % msgs.length], w / 2, 170, w * 0.92, 64);
  });
  drawSign();
  const signG = new THREE.Group(); signG.position.set(-9, 0, -3.2); signG.rotation.y = 0.35;
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), new THREE.MeshBasicMaterial({ map: signTex })); sp.position.y = 2.8; signG.add(sp);
  const sback = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.3, 0.15), lambert(0x222222)); sback.position.set(0, 2.8, -0.09); signG.add(sback);
  for (const x of [-2, 2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), lambert(0x555555)); p.position.set(x, 1.1, -0.09); signG.add(p); }
  g.add(signG);
  col.box(-9, -3.3, 4.4, 0.4, 0.35);
  const signG2 = signG.clone(); signG2.position.set(26, 0, -3.2); signG2.rotation.y = -0.3; g.add(signG2);
  col.box(26, -3.3, 4.4, 0.4, -0.3);

  // mezzi di soccorso in movimento
  const vehicles = [];
  const vdefs = [
    { body: 0xffffff, stripe: 0xff6a00, bar: 'blue', lane: 8, dir: 1, x: -200, sp: 13, siren: true },
    { body: 0x1f3f8f, stripe: 0xffd200, bar: 'amber', lane: 12, dir: -1, x: 80, sp: 11 },
    { body: 0x2f5fb3, stripe: 0xffffff, bar: 'blue', lane: 8, dir: 1, x: 40, sp: 14 },
    { body: 0xb91c1c, stripe: 0xffffff, bar: 'blue', lane: 12, dir: -1, x: -120, sp: 10, len: 8, hei: 3, siren: true },
    { body: 0xffffff, stripe: 0xff6a00, bar: 'blue', lane: 12, dir: -1, x: 230, sp: 12 },
    { body: 0x2d3640, stripe: null, bar: null, lane: 8, dir: 1, x: 150, sp: 9 }
  ];
  vdefs.forEach((d) => {
    const v = makeVehicle({ body: d.body, stripe: d.stripe, bar: d.bar, len: d.len || 5.4, hei: d.hei || 2.4 });
    v.position.set(d.x, 0, d.lane); v.rotation.y = d.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    v.userData.d = d; g.add(v); vehicles.push(v);
    col.follow(v, 0, [d.len ? 2.3 : 2.2, (d.len || 5.4) + 0.2]);
  });
  // ambulanza ferma, transenne e postazione dei soccorritori
  const amb = makeVehicle({ body: 0xffffff, stripe: 0xff6a00, bar: 'blue' }); amb.position.set(12, 0, 3.4); amb.rotation.y = -Math.PI / 2.3; g.add(amb);
  col.follow(amb, 0, [2.3, 5.6]);
  const barrierM = [lambert(0xdc2626), lambert(0xffffff)];
  for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.4), barrierM[i % 2]); b.position.set(17 + i * 1.25, 0.45, 2.2); g.add(b); }
  col.box(21.4, 2.2, 10, 0.5);
  const tent = new THREE.Group(); tent.position.set(-14, 0, 2.5); g.add(tent);
  const tentTop = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.4, 4), lambert(0x1f4fa8)); tentTop.rotation.y = Math.PI / 4; tentTop.position.y = 3.1; tent.add(tentTop);
  for (const [x, z] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6), lambert(0xcccccc)); l.position.set(x, 1.25, z); tent.add(l); }
  const pcTex = canvasTex(512, 96, (c, w, h) => { c.fillStyle = '#1f4fa8'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd200'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'PROTEZIONE CIVILE', w / 2, h / 2, w * 0.9, 60); });
  for (const r of [0, Math.PI]) { const band = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.6), new THREE.MeshLambertMaterial({ map: pcTex, side: THREE.DoubleSide })); band.position.set(0, 2.35, r ? -2.21 : 2.21); band.rotation.y = r; tent.add(band); }
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.9), lambert(0xdddddd)); table.position.set(0, 0.85, 0); tent.add(table);
  for (const x of [-1, 1]) { const tl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 0.8), lambert(0x888888)); tl.position.set(x, 0.42, 0); tent.add(tl); }
  const kit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.35), lambert(0xd32f2f)); kit.position.set(0.5, 1.04, 0); tent.add(kit);
  const stretcher = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 2), lambert(0xff7a00)); stretcher.position.set(9.5, 0.7, 4.5); g.add(stretcher);
  for (const [x, z] of [[-16.2, 0.3], [-11.8, 0.3], [-16.2, 4.7], [-11.8, 4.7]]) col.circle(x, z, 0.15);
  col.box(-14, 2.5, 2.6, 1.1);
  col.box(9.5, 4.5, 0.8, 2.2);

  // ---- persone: chi scappa, chi soccorre ----
  const people = [];
  const vest = { Shirt: 0xff7a00, Shirt2: 0xff7a00, Jacket: 0xff7a00, LightJacket: 0xff7a00, Pants: 0x1f2937 };
  const police = { Shirt: 0x1b2a4a, Shirt2: 0x1b2a4a, Pants: 0x1b2a4a, Jacket: 0x1b2a4a, LightJacket: 0x1b2a4a };
  const look = () => ({ skin: SKINS[Math.floor(R() * SKINS.length)], hair: HAIR[Math.floor(R() * HAIR.length)], height: 1.58 + R() * 0.3 });
  const mk = async (model, opts, setup) => { const c = await makeCharacter(model, { ...look(), ...opts }); g.add(c.obj); setup(c); people.push(c); col.follow(c.obj, 0.32); return c; };
  const lanes = [-4.3, -2.8, -1.4, 0.6, 14.8, 16.2];
  const loadP = async () => {
    const jobs = [];
    for (let i = 0; i < 26; i++) {
      const model = CIVILIANS[Math.floor(R() * CIVILIANS.length)];
      jobs.push(mk(model, {}, (c) => {
        c.mode = i < 17 ? 'run' : 'hurry';
        c.lane = lanes[Math.floor(R() * lanes.length)] + (R() - 0.5) * 0.6;
        c.speed = c.mode === 'run' ? 3.6 + R() * 1.6 : 1.7 + R() * 0.5;
        c.obj.position.set(-90 + R() * 180, 0, c.lane);
        c.obj.rotation.y = -Math.PI / 2;
        c.play(c.mode === 'run' ? 'run' : 'walk', { speed: c.mode === 'run' ? c.speed / 4.2 : 1.35, offset: R() });
      }));
    }
    // soccorritori attorno all'ambulanza e alla tenda
    [[9.2, 1.2, -0.8], [10.6, 0.4, 0.2], [-13.2, 3.4, 0.4], [-15, 3.2, -0.3], [8.4, 5.6, 2.8]].forEach(([x, z, ry], k) => {
      jobs.push(mk(k % 2 ? 'f_street' : 'm_long', { colors: vest }, (c) => { c.mode = 'rescuer'; c.obj.position.set(x, 0, z); c.obj.rotation.y = ry; c.play(k === 4 ? 'clap' : 'idle', { offset: R() }); }));
    });
    // agenti che indicano la via di fuga
    [[3, -2.2, -1.4], [30, 5, -1.7]].forEach(([x, z, ry]) => jobs.push(mk('m_shirt', { colors: police }, (c) => { c.mode = 'police'; c.obj.position.set(x, 0, z); c.obj.rotation.y = ry; c.play('idle'); })));
    await Promise.all(jobs);
  };
  const peopleReady = loadP();
  // folla lontana sul marciapiede opposto (impostori che corrono, visti di lato)
  const far = { mesh: null };
  const farReady = env && env.renderer ? bakeAtlas(env.renderer, CIVILIANS.map((n, i) => ({ name: n, skin: SKINS[i % SKINS.length], hair: HAIR[i % HAIR.length], clip: i % 3 ? 'run' : 'walk' })), { frames: 8, cellW: 72, cellH: 150, angle: -Math.PI / 2 }).then((atlas) => {
    const items = [];
    for (let i = 0; i < 160; i++) items.push({ x: (R() - 0.5) * 300, y: 0.18, z: 17.4 + R() * 1.4, yaw: 0, row: i % 8, phase: R(), speed: 1.0 + R() * 0.6, dir: [-1, 0, 0] });
    const m = impostorCrowd(atlas, items, { width: 0.9, height: 1.72, fps: 10, uniforms: U, walk: { len: 300 } });
    g.add(m); far.mesh = m;
  }) : Promise.resolve();

  // elicotteri
  const helis = [];
  const mkHeli = (color) => {
    const h = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 2.4, 4, 10), lambert(color)); body.rotation.x = Math.PI / 2; h.add(body);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 5), lambert(color)); tail.position.set(0, 0.3, -3.8); h.add(tail);
    const rotor = new THREE.Group(); rotor.position.y = 1.4; h.add(rotor);
    for (let k = 0; k < 2; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(11, 0.05, 0.3), lambert(0x222222)); bl.rotation.y = (k * Math.PI) / 2; rotor.add(bl); }
    const tr = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.6, 0.2), lambert(0x222222)); tr.position.set(0.25, 0.5, -6.2); h.add(tr);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.8), lambert(color)); fin.position.set(0, 0.8, -6); h.add(fin);
    for (const x of [-0.8, 0.8]) { const sk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 3), lambert(0x222222)); sk.position.set(x, -1.3, 0); h.add(sk); }
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0x223344, shininess: 90, specular: 0xffffff })); glass.rotation.x = Math.PI / 2; glass.position.set(0, 0.15, 1.7); h.add(glass);
    const beacon = makeGlow(0xff2020, 4, 1); beacon.position.y = -1; h.add(beacon);
    h.userData = { rotor, tr, beacon, dynamic: true };
    return h;
  };
  [[0xd7261e, -60, -300, 220, 95, 0.07], [0x1e3a8a, 120, -120, 140, 70, -0.1]].forEach(([c, cx, cz, rr, hh, w]) => {
    const h = mkHeli(c); h.userData.o = { cx, cz, rr, hh, w, a: Math.random() * 6 }; g.add(h); helis.push(h);
  });

  // cenere che cade
  const ash = fallingParticles({ count: 1800, box: [70, 32, 70], color: 0x4a4542, size: 0.05, speed: 0.9, drift: 0.8, opacity: 0.85 });
  g.add(ash);

  mergeStatic(g);
  let snd = null, boomTimer = 4, glowBase = 0.9;
  const tmpV = new THREE.Vector3();

  const inst = {
    group: g,
    spawn: { x: 0, z: -2.2, yaw: -0.25 },
    colliders: col,
    ready: Promise.all([peopleReady, farReady]),
    background: 0x6e5c50,
    fog: new THREE.Fog(0x6e5a4d, 180, 4200),
    studio: { distance: 2.3, scale: 1 },
    update(dt, t, ph, cam) {
      U.uTime.value = t;
      if (seaNormal) { seaNormal.offset.x = t * 0.004; seaNormal.offset.y = t * 0.0025; }
      ash.userData.mat.uniforms.uTime.value = t;
      if (cam) { cam.getWorldPosition(tmpV); ash.userData.mat.uniforms.uCenter.value.set(tmpV.x, 0, tmpV.z); }
      U.uFlash.value = Math.max(0, U.uFlash.value - dt * 0.8);
      const fl = U.uFlash.value;
      craterGlow.material.opacity = glowBase + Math.sin(t * 3.1) * 0.06 + fl * 0.4;
      craterGlow.scale.setScalar(520 + fl * 300 + Math.sin(t * 2) * 20);
      craterCore.material.opacity = 0.85 + Math.sin(t * 7.3) * 0.15;
      lavaGlows.forEach((l, i) => { l.material.opacity = 0.45 + Math.sin(t * 2 + i) * 0.1; });
      if (boltT > 0) { boltT -= dt; if (boltT <= 0) bolt.visible = false; }
      boomTimer -= dt;
      if (boomTimer <= 0) {
        boomTimer = 9 + Math.random() * 8;
        U.uFlash.value = 1;
        if (Math.random() < 0.6) fireBolt();
        if (snd) snd.boom();
      }
      vehicles.forEach((v) => {
        const d = v.userData.d;
        v.position.x += d.dir * d.sp * dt;
        v.userData.wheels && v.userData.wheels.forEach((w) => (w.rotation.x += d.sp * dt / 0.36));
        if (v.position.x > 280) v.position.x = -280; if (v.position.x < -280) v.position.x = 280;
        v.userData.flash(t + d.x);
      });
      amb.userData.flash(t);
      for (const c of people) {
        if (c.mode === 'run' || c.mode === 'hurry') {
          c.obj.position.x -= c.speed * dt;
          if (c.obj.position.x < -95) { c.obj.position.x = 95; c.obj.position.z = lanes[Math.floor(Math.random() * lanes.length)] + (Math.random() - 0.5) * 0.6; }
        }
        c.update(dt);
      }
      if (far.mesh) far.mesh.setFog(inst.fog);
      helis.forEach((h) => {
        const o = h.userData.o; o.a += o.w * dt;
        h.position.set(o.cx + Math.cos(o.a) * o.rr, o.hh + Math.sin(t * 0.3) * 4, o.cz + Math.sin(o.a) * o.rr);
        // direzione di volo = tangente alla circonferenza
        const vx = -Math.sin(o.a) * Math.sign(o.w), vz = Math.cos(o.a) * Math.sign(o.w);
        h.rotation.order = 'YXZ';
        h.rotation.y = Math.atan2(vx, vz);
        h.rotation.x = 0.12;                       // muso leggermente giù, come in volo avanzato
        h.rotation.z = -0.22 * Math.sign(o.w);     // inclinato verso il centro della virata
        h.userData.rotor.rotation.y += dt * 30; h.userData.tr.rotation.x += dt * 40;
        h.userData.beacon.material.opacity = Math.sin(t * 6) > 0.7 ? 1 : 0;
      });
      if (snd) snd.update();
    },
    onPhase() {},
    bounds(p) { p.x = THREE.MathUtils.clamp(p.x, -70, 70); p.z = THREE.MathUtils.clamp(p.z, -5.0, 18.5); },
    startAudio(s) {
      const dest = s.out;
      const dir = new THREE.Vector3(VX, 0, VZ).normalize();
      const volPan = s.panner(dir.x * 300, 150, dir.z * 300, { ref: 300, roll: 0.2 });
      const fallback = () => {
        if (inst._fb) return; inst._fb = true;
        A.bed(s, dest, { kind: 'brown', type: 'lowpass', f: 260, q: 0.5, level: 0.35, lfo: 0.04, depth: 0.3 });
        A.bed(s, volPan, { kind: 'brown', type: 'lowpass', f: 90, q: 0.7, level: 0.55, lfo: 0.13, depth: 0.5 });
        vehicles.forEach((v) => { if (v.userData.d.siren) { const p = s.panner(v.position.x, 1.5, v.position.z, { ref: 8, roll: 1.1 }); A.sirenIT(s, p, { level: 0.3 }); v.userData.sirenPan = p; } });
      };
      // vulcano: cratere dell'Etna e un'eruzione vera, dalla direzione del Vesuvio
      const lowVol = s.filter('lowpass', 1400, 0.5, volPan);
      s.stream(SND.etna.url, { gain: 1.0, dest: lowVol, onFail: fallback });
      s.stream(SND.eruzione.url, { gain: 0.8, dest: lowVol });
      // città alle spalle: traffico e ambulanze vere (Catania), Napoli al mattino
      s.stream(SND.cittaSirene.url, { gain: 0.85, dest: s.panner(0, 6, 40, { ref: 30, roll: 0.4 }) });
      // gente che scappa e voci concitate
      s.stream(SND.follaInMovimento.url, { gain: 0.75, dest: s.panner(-10, 2, 2, { ref: 8, roll: 0.6 }) });
      s.stream(SND.folla.url, { gain: 0.5, dest: s.panner(20, 2, 12, { ref: 10, roll: 0.6 }) });
      // il mare sotto il lungomare
      s.stream(SND.mareNapoli.url, { gain: 0.7, dest: s.panner(0, -1, -9, { ref: 6, roll: 0.8 }) });
      // elicotteri che seguono la loro posizione
      const heliPans = helis.map((h, i) => { const p = s.panner(0, 80, -200, { ref: 40, roll: 0.9 }); s.stream(i ? SND.elicotteroPolizia.url : SND.elicottero.url, { gain: 1.0, dest: p }); return [p, h]; });
      // una sirena bitonale vera in movimento sull'ambulanza
      const amb1 = vehicles.find((v) => v.userData.d.siren);
      const sirPan = s.panner(0, 1.5, 8, { ref: 10, roll: 1 });
      A.sirenIT(s, s.filter('bandpass', 1100, 0.7, sirPan), { level: 0.22 });
      const pc = [
        'Attenzione. Avviso della Protezione Civile. Mantenete la calma e allontanatevi dalla zona rossa seguendo i percorsi indicati.',
        'Non avvicinatevi al vulcano. Seguite soltanto le comunicazioni ufficiali e le indicazioni delle forze dell\'ordine.'
      ];
      let pi = 0;
      s.after(7000, () => s.say(pc[pi++ % 2], { rate: 0.92, volume: 0.9 }));
      s.every(30000, () => s.say(pc[pi++ % 2], { rate: 0.92, volume: inst._phase === 'live' ? 0.35 : 0.9 }));
      s.every(6000, () => { msgI++; drawSign(); });
      snd = {
        boom() { A.boom(s, volPan, s.t + 0.4, 1.3); },
        update() {
          if (amb1) SoundScope.setPos(sirPan, amb1.position.x, 1.5, amb1.position.z);
          vehicles.forEach((v) => { if (v.userData.sirenPan) SoundScope.setPos(v.userData.sirenPan, v.position.x, 1.5, v.position.z); });
          heliPans.forEach(([p, h]) => SoundScope.setPos(p, h.position.x, h.position.y, h.position.z));
        }
      };
    }
  };
  return inst;
}
