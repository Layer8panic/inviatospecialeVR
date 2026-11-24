// CRONACA – Il Vesuvio si risveglia: Napoli in allerta (emergenza simulata)
import * as THREE from 'three';
import { rng, canvasTex, skyDome, makeGlow, lambert, makePerson, animatePerson, Walkers, makeVehicle, fallingParticles } from './common.js';
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

export function createVesuvio() {
  const g = new THREE.Group();
  const R = rng(21);
  const U = { uTime: { value: 0 }, uFlash: { value: 0 } };

  g.add(new THREE.HemisphereLight(0xb7a393, 0x3a2e28, 1.0));
  const sun = new THREE.DirectionalLight(0xffa36b, 0.9); sun.position.set(400, 300, -600); g.add(sun);
  const fill = new THREE.DirectionalLight(0xcfd8e6, 0.35); fill.position.set(-200, 200, 300); g.add(fill);
  const sky = skyDome(0x2a2321, 0x7a6050, { exponent: 0.5 }); g.add(sky);

  // mare e costa
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 4200), new THREE.MeshLambertMaterial({ color: 0x2e3d44 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -1.2, -2106); g.add(sea);
  const land = new THREE.Mesh(new THREE.CircleGeometry(1750, 64), lambert(0x3a362b)); land.rotation.x = -Math.PI / 2; land.position.set(VX, 0.5, VZ); g.add(land);

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
  const volcano = new THREE.Mesh(vgeo, lambert(0x4b4038)); volcano.position.set(VX, 0, VZ); g.add(volcano);
  const somma = new THREE.Mesh(new THREE.LatheGeometry([[1300, 0], [900, 200], [700, 430], [620, 520], [560, 470]].map(([r, h]) => new THREE.Vector2(r, h)), 48, Math.PI * 0.15, Math.PI * 0.9), lambert(0x3f3730));
  somma.position.set(VX - 150, 0, VZ - 250); g.add(somma);

  // paesi ai piedi del vulcano
  const townN = 420;
  const town = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), lambert(0xffffff), townN);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion();
  for (let i = 0; i < townN; i++) {
    const a = Math.PI * 0.5 + (R() - 0.5) * 1.9, rr = 1250 + R() * 430;
    const x = VX + Math.cos(a) * rr, z = VZ + Math.sin(a) * rr;
    const h = 10 + R() * 22;
    m4.compose(new THREE.Vector3(x, h / 2 + heightAt(rr), z), q.identity(), new THREE.Vector3(16 + R() * 20, h, 16 + R() * 20));
    town.setMatrixAt(i, m4); col.set([0xcbb79a, 0xd8c7a8, 0xb59a7a, 0xe0d3bd][Math.floor(R() * 4)]); town.setColorAt(i, col);
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
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 80), lambert(0x7d746b)); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 34); g.add(ground);
  const roadTex = canvasTex(512, 64, (c, w, h) => { c.fillStyle = '#2b2b2e'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8e8e8'; for (let x = 0; x < w; x += 64) c.fillRect(x, h / 2 - 2, 32, 4); }, { repeat: [60, 1] });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(900, 8), new THREE.MeshLambertMaterial({ map: roadTex })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, 10); g.add(road);
  const wallM = lambert(0x9a8f84);
  const sea_wall = new THREE.Mesh(new THREE.BoxGeometry(900, 1.4, 1.2), wallM); sea_wall.position.set(0, -0.5, -6.2); g.add(sea_wall);
  const railM = lambert(0x2f3a3f);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(900, 0.06, 0.06), railM); rail.position.set(0, 1.05, -5.6); g.add(rail);
  const postG = new THREE.CylinderGeometry(0.03, 0.03, 1.05, 5);
  const posts = new THREE.InstancedMesh(postG, railM, 300);
  for (let i = 0; i < 300; i++) { m4.makeTranslation(-450 + i * 3, 0.52, -5.6); posts.setMatrixAt(i, m4); }
  g.add(posts);
  // lampioni
  for (let x = -120; x <= 120; x += 24) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 5.5, 6), railM); p.position.set(x, 2.75, -4.5); g.add(p);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe2a8 })); l.position.set(x, 5.6, -4.5); g.add(l);
    const gl = makeGlow(0xffcf80, 3, 0.6); gl.position.copy(l.position); g.add(gl);
  }
  const winTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    for (let y = 18; y < h - 20; y += 52) for (let x = 18; x < w - 20; x += 46) {
      c.fillStyle = '#3a3330'; c.fillRect(x, y, 22, 32); c.fillStyle = '#5b6e4e'; c.fillRect(x - 5, y, 4, 32); c.fillRect(x + 23, y, 4, 32);
    }
  });
  const bN = 170;
  const blds = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ map: winTex }), bN);
  const pal = [0xd9b26f, 0xc97b4a, 0xe3c9a0, 0xb5553c, 0xe8d9b0, 0xd4a373, 0xcf9e8a];
  let bi = 0;
  for (const rowZ of [27, 52, 78]) {
    for (let x = -330; x < 330 && bi < bN; ) {
      const w = 14 + R() * 16, d = 18 + R() * 6, h = 14 + R() * 20 + (rowZ > 30 ? 8 : 0);
      m4.compose(new THREE.Vector3(x + w / 2, h / 2, rowZ + (R() - 0.5) * 3), q.identity(), new THREE.Vector3(w, h, d));
      blds.setMatrixAt(bi, m4); col.set(pal[Math.floor(R() * pal.length)]); blds.setColorAt(bi, col); bi++;
      x += w + 0.5;
    }
  }
  blds.count = bi; g.add(blds);

  // pannello della Protezione Civile
  const signTex = canvasTex(1024, 256, () => {});
  const msgs = ['EMERGENZA VESUVIO', 'ALLONTANARSI DALLA ZONA ROSSA', 'SEGUIRE LE INDICAZIONI', 'NON AVVICINARSI AL VULCANO'];
  let msgI = 0;
  const drawSign = () => signTex.redraw((c, w, h) => {
    c.fillStyle = '#080808'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffb000'; c.font = '900 44px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('PROTEZIONE CIVILE', w / 2, 60); c.font = '900 64px Arial'; c.fillText(msgs[msgI % msgs.length], w / 2, 170);
  });
  drawSign();
  const signG = new THREE.Group(); signG.position.set(-9, 0, -3.2); signG.rotation.y = 0.35;
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), new THREE.MeshBasicMaterial({ map: signTex })); sp.position.y = 2.8; signG.add(sp);
  const sback = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.3, 0.15), lambert(0x222222)); sback.position.set(0, 2.8, -0.09); signG.add(sback);
  for (const x of [-2, 2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), lambert(0x555555)); p.position.set(x, 1.1, -0.09); signG.add(p); }
  g.add(signG);

  // mezzi di soccorso in movimento
  const vehicles = [];
  const vdefs = [
    { body: 0xffffff, stripe: 0xff6a00, bar: 'blue', lane: 8, dir: 1, x: -200, sp: 13, siren: true },
    { body: 0x1f3f8f, stripe: 0xffd200, bar: 'amber', lane: 12, dir: -1, x: 80, sp: 11 },
    { body: 0x0c1a3a, stripe: 0xc81e1e, bar: 'blue', lane: 8, dir: 1, x: 40, sp: 14 },
    { body: 0xb91c1c, stripe: 0xffffff, bar: 'blue', lane: 12, dir: -1, x: -120, sp: 10, len: 8, hei: 3, siren: true },
    { body: 0xffffff, stripe: 0xff6a00, bar: 'blue', lane: 12, dir: -1, x: 230, sp: 12 },
    { body: 0x2d3640, stripe: null, bar: null, lane: 8, dir: 1, x: 150, sp: 9 }
  ];
  vdefs.forEach((d) => {
    const v = makeVehicle({ body: d.body, stripe: d.stripe, bar: d.bar, len: d.len || 5.4, hei: d.hei || 2.4 });
    v.position.set(d.x, 0, d.lane); v.rotation.y = d.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    v.userData.d = d; g.add(v); vehicles.push(v);
  });
  // ambulanza ferma con soccorritori
  const amb = makeVehicle({ body: 0xffffff, stripe: 0xff6a00, bar: 'blue' }); amb.position.set(12, 0, 3.4); amb.rotation.y = -Math.PI / 2.3; g.add(amb);
  const rescuers = [];
  [[9, 1.5], [10.5, 0.6], [14, 1.2]].forEach(([x, z], i) => {
    const p = makePerson({ shirt: 0xff7a00, shorts: 0x1f2937 }); p.position.set(x, 0, z); p.rotation.y = -0.8 + i * 0.5; g.add(p); rescuers.push(p);
  });
  const barrierM = [lambert(0xdc2626), lambert(0xffffff)];
  for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.4), barrierM[i % 2]); b.position.set(17 + i * 1.25, 0.45, 2.2); g.add(b); }

  // persone che si allontanano
  const walkers = new Walkers(170, {
    segments: [
      { a: [260, 0, -1.5], b: [-300, 0, -1.5], width: 4 },
      { a: [260, 0, 16], b: [-300, 0, 16], width: 2.5 },
      { a: [260, 0, 3], b: [-300, 0, 3], width: 2 }
    ],
    colors: [0x3b4252, 0x6b4f3a, 0x2f4858, 0x8c2f39, 0xc9b79c, 0x1f2937, 0x4a5d23, 0x7a6c5d, 0x2e5c8a],
    speed: [1.1, 1.9], seed: 5
  });
  g.add(walkers.mesh);

  // elicotteri
  const helis = [];
  const mkHeli = (color) => {
    const h = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 2.4, 4, 10), lambert(color)); body.rotation.x = Math.PI / 2; h.add(body);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 5), lambert(color)); tail.position.set(0, 0.3, -3.8); h.add(tail);
    const rotor = new THREE.Group(); rotor.position.y = 1.4; h.add(rotor);
    for (let k = 0; k < 2; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(11, 0.05, 0.3), lambert(0x222222)); bl.rotation.y = (k * Math.PI) / 2; rotor.add(bl); }
    const tr = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.6, 0.2), lambert(0x222222)); tr.position.set(0.25, 0.5, -6.2); h.add(tr);
    const beacon = makeGlow(0xff2020, 4, 1); beacon.position.y = -1; h.add(beacon);
    h.userData = { rotor, tr, beacon };
    return h;
  };
  [[0xd7261e, -60, -300, 220, 95, 0.07], [0x1e3a8a, 120, -120, 140, 70, -0.1]].forEach(([c, cx, cz, rr, hh, w]) => {
    const h = mkHeli(c); h.userData.o = { cx, cz, rr, hh, w, a: Math.random() * 6 }; g.add(h); helis.push(h);
  });

  // cenere che cade
  const ash = fallingParticles({ count: 1800, box: [70, 32, 70], color: 0x4a4542, size: 0.05, speed: 0.9, drift: 0.8, opacity: 0.85 });
  g.add(ash);

  let snd = null, boomTimer = 4, glowBase = 0.9;
  const tmpV = new THREE.Vector3();

  const inst = {
    group: g,
    spawn: { x: 0, z: 0, yaw: -0.25 },
    background: 0x6e5c50,
    fog: new THREE.Fog(0x6e5a4d, 180, 4200),
    studio: { distance: 2.3, scale: 1 },
    update(dt, t, ph, cam) {
      U.uTime.value = t;
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
        if (v.position.x > 280) v.position.x = -280; if (v.position.x < -280) v.position.x = 280;
        v.userData.flash(t + d.x);
      });
      amb.userData.flash(t);
      rescuers.forEach((p, i) => { p.userData.armR.rotation.x = -0.6 + Math.sin(t * 2 + i) * 0.5; });
      rescuers[0].userData.armL.rotation.z = -1.3 + Math.sin(t * 3) * 0.4;
      walkers.update(dt, t);
      helis.forEach((h) => {
        const o = h.userData.o; o.a += o.w * dt;
        h.position.set(o.cx + Math.cos(o.a) * o.rr, o.hh + Math.sin(t * 0.3) * 4, o.cz + Math.sin(o.a) * o.rr);
        h.rotation.y = -o.a + (o.w > 0 ? Math.PI : 0); h.rotation.z = 0.12 * Math.sign(o.w);
        h.userData.rotor.rotation.y += dt * 30; h.userData.tr.rotation.x += dt * 40;
        h.userData.beacon.material.opacity = Math.sin(t * 6) > 0.7 ? 1 : 0;
      });
      if (snd) snd.update();
    },
    onPhase() {},
    startAudio(s) {
      const dest = s.out;
      A.bed(s, dest, { kind: 'brown', type: 'lowpass', f: 260, q: 0.5, level: 0.35, lfo: 0.04, depth: 0.3 });
      A.bed(s, dest, { kind: 'pink', f: 700, q: 0.6, level: 0.08, lfo: 0.11, depth: 0.5 });
      const rumble = A.bed(s, s.panner(VX, 400, VZ, { ref: 2500, roll: 1 }), { kind: 'brown', type: 'lowpass', f: 90, q: 0.7, level: 0.55, lfo: 0.13, depth: 0.5 });
      const volPan = s.panner(VX, 400, VZ, { ref: 2500, roll: 1 });
      const sirenPans = [];
      vehicles.forEach((v) => { if (v.userData.d.siren) { const p = s.panner(v.position.x, 1.5, v.position.z, { ref: 8, roll: 1.1 }); A.sirenIT(s, p, { level: 0.35, hi: v.userData.d.len ? 860 : 930, lo: v.userData.d.len ? 650 : 700 }); sirenPans.push([p, v]); } });
      const farSiren = s.panner(-400, 5, 120, { ref: 40 }); A.sirenIT(s, farSiren, { level: 0.25, hi: 900, lo: 680 });
      const heliPans = helis.map((h) => { const p = s.panner(0, 80, -200, { ref: 40, roll: 1 }); A.heli(s, p, 0.6); return [p, h]; });
      s.every(5000, () => { if (Math.random() < 0.5) A.horn(s, s.panner((Math.random() - 0.5) * 200, 1, 10 + Math.random() * 20, { ref: 10 }), s.t, 0.12, 380 + Math.random() * 120); });
      const pc = [
        'Attenzione, attenzione. Avviso della Protezione Civile. Mantenete la calma.',
        'Allontanatevi dalla zona rossa seguendo i percorsi indicati. Non avvicinatevi al vulcano.',
        'Seguite soltanto le comunicazioni ufficiali e le indicazioni delle forze dell\'ordine.'
      ];
      const radio = [
        'Centrale a tutte le unità: evacuazione in corso nel settore est. Passo.',
        'Unità dodici, ricevuto. Ci dirigiamo verso il punto di raccolta. Passo.',
        'Squadra soccorso, confermate posizione. Strada libera sul lungomare. Passo.'
      ];
      let pi = 0, ri = 0;
      s.after(6000, () => s.say(pc[pi++ % 3], { rate: 0.92, volume: 0.9 }));
      s.every(24000, () => s.say(pc[pi++ % 3], { rate: 0.92, volume: inst._phase === 'live' ? 0.4 : 0.9 }));
      s.every(15000, () => { A.squelch(s, dest, s.t, 0.16); s.after(350, () => s.say(radio[ri++ % 3], { rate: 1.1, volume: inst._phase === 'live' ? 0.3 : 0.65, pitch: 0.85 })); s.after(4500, () => A.squelch(s, dest, s.t, 0.12)); });
      s.every(6000, () => { msgI++; drawSign(); });
      snd = {
        boom() { A.boom(s, volPan, s.t + 0.5, 1.2); const t = s.t; rumble.gain.setValueAtTime(0.55, t); rumble.gain.linearRampToValueAtTime(0.9, t + 1); rumble.gain.linearRampToValueAtTime(0.55, t + 6); },
        update() {
          sirenPans.forEach(([p, v]) => SoundScope.setPos(p, v.position.x, 1.5, v.position.z));
          heliPans.forEach(([p, h]) => SoundScope.setPos(p, h.position.x, h.position.y, h.position.z));
        }
      };
    }
  };
  return inst;
}
