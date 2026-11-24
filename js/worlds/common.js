// Mattoncini condivisi dai mondi: cielo, stelle, bagliori, persone, folle, veicoli.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

export function canvasTex(w, h, draw, { repeat, mip = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (!mip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.userData.canvas = c; t.userData.ctx = ctx;
  t.redraw = (fn) => { fn(ctx, w, h); t.needsUpdate = true; };
  return t;
}

export function skyDome(top, bottom, { radius = 3500, exponent = 0.6 } = {}) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) }, exponent: { value: exponent } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; uniform float exponent; varying vec3 vP; void main(){ float h = max(vP.y, 0.0); gl_FragColor = vec4(mix(bottom, top, pow(h, exponent)), 1.0);\n#include <colorspace_fragment>\n}'
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat);
  m.renderOrder = -10; m.frustumCulled = false;
  m.setColors = (t, b) => { mat.uniforms.top.value.set(t); mat.uniforms.bottom.value.set(b); };
  m.lerpColors = (t1, b1, t2, b2, k) => {
    mat.uniforms.top.value.set(t1).lerp(new THREE.Color(t2), k);
    mat.uniforms.bottom.value.set(b1).lerp(new THREE.Color(b2), k);
  };
  return m;
}

export function starField(n = 1500, radius = 3000, { size = 2, minY = -0.05, color = 0xffffff, opacity = 1 } = {}) {
  const pos = new Float32Array(n * 3);
  const r = rng(99);
  for (let i = 0; i < n; i++) {
    let x, y, z;
    do { x = r() * 2 - 1; y = r() * 2 - 1; z = r() * 2 - 1; } while (x * x + y * y + z * z > 1 || y < minY);
    const l = Math.hypot(x, y, z) || 1;
    pos[i * 3] = (x / l) * radius; pos[i * 3 + 1] = (y / l) * radius; pos[i * 3 + 2] = (z / l) * radius;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ size, sizeAttenuation: false, color, transparent: true, opacity, fog: false, depthWrite: false });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = -9;
  return p;
}

let _glow = null;
export function glowTexture() {
  if (_glow) return _glow;
  _glow = canvasTex(128, 128, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  _glow.userData.shared = true;
  return _glow;
}

export function makeGlow(color = 0xffffff, size = 4, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.setScalar(size);
  return s;
}

const matCache = new Map();
export function lambert(color) {
  const k = 'l' + color;
  if (!matCache.has(k)) { const m = new THREE.MeshLambertMaterial({ color }); m.userData.shared = true; matCache.set(k, m); }
  return matCache.get(k);
}
export function basic(color) {
  const k = 'b' + color;
  if (!matCache.has(k)) { const m = new THREE.MeshBasicMaterial({ color }); m.userData.shared = true; matCache.set(k, m); }
  return matCache.get(k);
}

function shared(g) { g.userData.shared = true; return g; }
const PG = {
  torso: shared(new THREE.BoxGeometry(0.42, 0.58, 0.24)),
  head: shared(new THREE.SphereGeometry(0.12, 12, 8)),
  leg: shared(new THREE.BoxGeometry(0.14, 0.8, 0.15).translate(0, -0.4, 0)),
  arm: shared(new THREE.BoxGeometry(0.1, 0.62, 0.11).translate(0, -0.31, 0)),
  helmet: shared(new THREE.SphereGeometry(0.19, 16, 12)),
  visor: shared(new THREE.SphereGeometry(0.17, 16, 10, -Math.PI * 0.35, Math.PI * 0.7, Math.PI * 0.3, Math.PI * 0.35))
};

// Persona articolata (giocatori, astronauti, soccorritori)
export function makePerson({ shirt = 0xffffff, shorts = 0x222222, skin = 0xd9a77a, socks, astronaut = false } = {}) {
  const p = new THREE.Group();
  const torso = new THREE.Mesh(PG.torso, lambert(shirt)); torso.position.y = 1.18; p.add(torso);
  const head = new THREE.Mesh(PG.head, lambert(skin)); head.position.y = 1.6; p.add(head);
  const mk = (geo, color, x, y) => { const piv = new THREE.Group(); piv.position.set(x, y, 0); piv.add(new THREE.Mesh(geo, lambert(color))); p.add(piv); return piv; };
  const legL = mk(PG.leg, socks ?? shorts, -0.11, 0.88), legR = mk(PG.leg, socks ?? shorts, 0.11, 0.88);
  const armL = mk(PG.arm, astronaut ? shirt : skin, -0.27, 1.44), armR = mk(PG.arm, astronaut ? shirt : skin, 0.27, 1.44);
  if (astronaut) {
    const h = new THREE.Mesh(PG.helmet, lambert(0xf2f2f2)); h.position.y = 1.62; p.add(h);
    const v = new THREE.Mesh(PG.visor, new THREE.MeshLambertMaterial({ color: 0xc99a2e, emissive: 0x3a2a05 }));
    v.position.y = 1.62; v.position.z = 0.03; v.rotation.y = Math.PI / 2; p.add(v);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.18), lambert(0xdddddd)); pack.position.set(0, 1.2, -0.2); p.add(pack);
    head.visible = false;
  }
  p.userData = { legL, legR, armL, armR, torso, head };
  return p;
}

export function animatePerson(p, phase, amp = 0.6, armAmp) {
  const u = p.userData; const s = Math.sin(phase);
  u.legL.rotation.x = s * amp; u.legR.rotation.x = -s * amp;
  const a = armAmp ?? amp * 0.8;
  u.armL.rotation.x = -s * a; u.armR.rotation.x = s * a;
}

// Geometria unica per folle istanziate: busto (colore istanza) + testa (pelle) + gambe (scure)
export function crowdGeometry({ legs = true } = {}) {
  const parts = [];
  const add = (geo, part) => {
    const n = geo.attributes.position.count;
    geo.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(n).fill(part), 1));
    parts.push(geo);
  };
  if (legs) {
    add(new THREE.BoxGeometry(0.44, 0.66, 0.26).translate(0, 1.13, 0), 0);
    add(new THREE.BoxGeometry(0.34, 0.8, 0.22).translate(0, 0.4, 0), 2);
  } else {
    add(new THREE.BoxGeometry(0.44, 1.4, 0.28).translate(0, 0.76, 0), 0);
  }
  add(new THREE.BoxGeometry(0.2, 0.24, 0.22).translate(0, 1.6, 0), 1);
  const g = mergeGeometries(parts);
  return g;
}

export function crowdMaterial(u = {}, { jump = false } = {}) {
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  mat.customProgramCacheKey = () => 'crowd-' + jump;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = u.uTime || { value: 0 };
    sh.uniforms.uExcite = u.uExcite || { value: 1 };
    sh.uniforms.uOla = u.uOla || { value: 0 };
    sh.vertexShader = 'attribute float aPart;\nvarying float vPart;\nvarying float vSeed;\nuniform float uTime;\nuniform float uExcite;\nuniform float uOla;\n' +
      sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vPart = aPart; vSeed = 0.5;
        #ifdef USE_INSTANCING_COLOR
          vSeed = fract(sin(dot(instanceColor, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        #endif
        #ifdef USE_INSTANCING
          ${jump ? `vec3 ip = vec3(instanceMatrix[3]);
          float ps = fract(sin(dot(ip.xz, vec2(12.9898, 78.233))) * 43758.5453);
          float j = max(0.0, sin(uTime * (4.0 + ps * 3.0) + ps * 40.0));
          float ola = smoothstep(0.9, 1.0, sin(atan(ip.z, ip.x) - uTime * 1.2)) * uOla;
          transformed.y += j * j * 0.22 * uExcite * step(0.3, ps) + ola * 0.6;` : ''}
        #endif`);
    sh.fragmentShader = 'varying float vPart;\nvarying float vSeed;\n' +
      sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        vec3 skin = mix(vec3(0.80, 0.52, 0.36), vec3(0.20, 0.11, 0.06), vSeed * vSeed);
        if (vPart > 0.5 && vPart < 1.5) diffuseColor.rgb = skin;
        else if (vPart > 1.5) diffuseColor.rgb = vec3(0.03, 0.03, 0.045) + vSeed * 0.04;`);
  };
  return mat;
}

// Pedoni che camminano lungo segmenti
export class Walkers {
  constructor(count, { segments, colors, speed = [1.0, 1.6], seed = 3, geometry, material, loop = 'wrap' }) {
    const r = rng(seed);
    this.mesh = new THREE.InstancedMesh(geometry || crowdGeometry(), material || crowdMaterial(), count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.items = [];
    const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const s = segments[Math.floor(r() * segments.length)];
      const a = new THREE.Vector3(...s.a), b = new THREE.Vector3(...s.b);
      const off = (r() - 0.5) * (s.width || 2);
      const dir = b.clone().sub(a); const len = dir.length(); dir.normalize();
      const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(off);
      const rev = s.both && r() < 0.5;
      this.items.push({ a: rev ? b.clone().add(side) : a.clone().add(side), b: rev ? a.clone().add(side) : b.clone().add(side), len, u: r(), sp: speed[0] + r() * (speed[1] - speed[0]), ph: r() * 10 });
      col.set(colors[Math.floor(r() * colors.length)]).offsetHSL(0, 0, (r() - 0.5) * 0.08);
      this.mesh.setColorAt(i, col);
    }
    this.mesh.instanceColor.needsUpdate = true;
    this.speedMul = 1;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1); this._e = new THREE.Euler();
    this.update(0, 0);
  }
  update(dt, t) {
    const { _m, _q, _p, _s, _e } = this;
    this.items.forEach((w, i) => {
      w.u += (w.sp * this.speedMul * dt) / w.len;
      if (w.u > 1) w.u -= 1;
      _p.lerpVectors(w.a, w.b, w.u);
      _p.y += Math.abs(Math.sin(w.ph + t * w.sp * 5)) * 0.04 * this.speedMul;
      _e.set(0, Math.atan2(w.b.x - w.a.x, w.b.z - w.a.z), 0); _q.setFromEuler(_e);
      _m.compose(_p, _q, _s); this.mesh.setMatrixAt(i, _m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// Veicolo semplice con lampeggianti
export function makeVehicle({ body = 0xffffff, stripe = 0xff6600, len = 5.2, wid = 2.1, hei = 2.3, bar = 'blue', cabin = true, taxi = false } = {}) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(wid, hei * 0.62, len), lambert(body)); b.position.y = 0.35 + hei * 0.31; g.add(b);
  if (cabin) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.96, hei * 0.36, taxi ? len * 0.5 : len * 0.62), lambert(body));
    c.position.set(0, 0.35 + hei * 0.62 + hei * 0.18, taxi ? -len * 0.05 : -len * 0.12); g.add(c);
    const win = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.98, hei * 0.22, taxi ? len * 0.46 : len * 0.58), lambert(0x1b2430));
    win.position.copy(c.position); win.position.y += 0.01; g.add(win);
  }
  if (stripe !== null) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(wid * 1.01, 0.22, len * 1.005), lambert(stripe)); s.position.y = 0.35 + hei * 0.3; g.add(s);
  }
  const wg = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 12); wg.rotateZ(Math.PI / 2);
  const wheels = [];
  const hubM = lambert(0x9a9a9a);
  for (const [x, z] of [[-wid / 2, len * 0.32], [wid / 2, len * 0.32], [-wid / 2, -len * 0.32], [wid / 2, -len * 0.32]]) {
    const w = new THREE.Mesh(wg, lambert(0x111111)); w.position.set(x, 0.36, z); g.add(w); wheels.push(w);
    const hub = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.08), hubM); hub.position.x = Math.sign(x) * 0.02; w.add(hub);
  }
  g.userData.wheels = wheels;
  const headM = new THREE.MeshBasicMaterial({ color: 0xfff6d8 }), tailM = new THREE.MeshBasicMaterial({ color: 0xff2020 });
  for (const x of [-wid * 0.33, wid * 0.33]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.05), headM); h.position.set(x, 0.75, len / 2 + 0.01); g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.05), tailM); t.position.set(x, 0.8, -len / 2 - 0.01); g.add(t);
  }
  const lights = [];
  if (bar) {
    const topY = cabin ? 0.35 + hei * 0.62 + hei * 0.36 + 0.07 : 0.35 + hei * 0.62 + 0.07;
    const cols = bar === 'blue' ? [0x2a6bff, 0x2a6bff] : bar === 'police' ? [0xff2020, 0x2a6bff] : [0xffaa00, 0xffaa00];
    cols.forEach((c, i) => {
      const m = new THREE.MeshBasicMaterial({ color: c });
      const l = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.35, 0.14, 0.3), m);
      l.position.set((i - 0.5) * wid * 0.42, topY, cabin ? -len * 0.12 + len * 0.2 : len * 0.2); g.add(l);
      const glow = makeGlow(c, 2.4, 0.9); glow.position.copy(l.position); g.add(glow);
      lights.push({ m, glow, base: new THREE.Color(c), i });
    });
  }
  if (taxi) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.25), new THREE.MeshBasicMaterial({ color: 0xfff1a8 }));
    sign.position.set(0, 0.35 + hei * 0.62 + hei * 0.36 + 0.09, -len * 0.05); g.add(sign);
  }
  g.userData.lights = lights; g.userData.wheels = wheels;
  g.userData.flash = (t) => {
    lights.forEach((L) => {
      const on = Math.sin(t * 14 + L.i * Math.PI) > 0;
      L.m.color.copy(L.base).multiplyScalar(on ? 1 : 0.08);
      L.glow.material.opacity = on ? 0.95 : 0.0;
    });
  };
  return g;
}

// Particelle che cadono (neve, cenere) attorno all'utente, animate nello shader
export function fallingParticles({ count = 2000, box = [60, 30, 60], color = 0xffffff, size = 0.08, speed = 1.2, drift = 0.6, opacity = 0.9 } = {}) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  const r = rng(11);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (r() - 0.5) * box[0]; pos[i * 3 + 1] = r() * box[1]; pos[i * 3 + 2] = (r() - 0.5) * box[2]; seed[i] = r();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uSize: { value: size }, uBox: { value: new THREE.Vector3(...box) }, uSpeed: { value: speed }, uDrift: { value: drift }, uOpacity: { value: opacity }, uCenter: { value: new THREE.Vector3() } },
    vertexShader: `attribute float aSeed; uniform float uTime, uSize, uSpeed, uDrift; uniform vec3 uBox, uCenter; varying float vA;
      void main(){
        vec3 p = position;
        p.y = mod(p.y - uTime * uSpeed * (0.7 + aSeed * 0.6), uBox.y);
        p.x += sin(uTime * 0.6 + aSeed * 30.0) * uDrift;
        p.z += cos(uTime * 0.5 + aSeed * 20.0) * uDrift;
        p.x = mod(p.x - uCenter.x + uBox.x * 0.5, uBox.x) - uBox.x * 0.5 + uCenter.x;
        p.z = mod(p.z - uCenter.z + uBox.z * 0.5, uBox.z) - uBox.z * 0.5 + uCenter.z;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(uSize * 900.0 / -mv.z, 1.0, 40.0);
        vA = smoothstep(0.0, 2.0, p.y) * smoothstep(uBox.y, uBox.y - 4.0, p.y);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(uColor, uOpacity * vA * smoothstep(0.5, 0.15, d));
#include <colorspace_fragment>
}`
  });
  const p = new THREE.Points(g, mat); p.frustumCulled = false;
  p.userData.mat = mat;
  return p;
}

export function lerp(a, b, k) { return a + (b - a) * k; }
export function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

// ---------- testo che non esce dagli schermi ----------
export function fitText(ctx, text, x, y, maxW, size, { weight = '900', family = 'Arial, Helvetica, sans-serif', min = 10, align } = {}) {
  let fs = size;
  ctx.font = `${weight} ${fs}px ${family}`;
  while (ctx.measureText(text).width > maxW && fs > min) { fs -= 2; ctx.font = `${weight} ${fs}px ${family}`; }
  if (align) ctx.textAlign = align;
  ctx.fillText(text, x, y);
  return fs;
}

// ---------- texture fotografiche ----------
const loader = new THREE.TextureLoader();
loader.setCrossOrigin('anonymous');
export const BASE = new URL('../../', import.meta.url).href;
export const LOCAL = (f) => BASE + 'assets/tex/' + f;
// Poly Haven (CC0): https://polyhaven.com
export const PH = (id, map = 'diff', res = '1k') => `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/${res}/${id}/${id}_${map}_${res}.jpg`;

export function applyTex(mat, url, { slot = 'map', repeat = [1, 1], color = true, aniso = 8, onLoad } = {}) {
  loader.load(url, (t) => {
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = aniso;
    mat[slot] = t;
    if (slot === 'map' && mat.userData.mapTint !== undefined) mat.color.setHex(mat.userData.mapTint);
    mat.needsUpdate = true;
    if (onLoad) onLoad(t);
  }, undefined, () => {});
  return mat;
}

// Materiale che mostra un colore finché la foto non è arrivata, poi la foto (tinta con mapTint)
export function photoMat(url, { fallback = 0x808080, tint = 0xffffff, repeat = [1, 1], normal, normalScale = 1, kind = 'lambert', ...rest } = {}) {
  const M = kind === 'phong' ? THREE.MeshPhongMaterial : kind === 'standard' ? THREE.MeshStandardMaterial : THREE.MeshLambertMaterial;
  const m = new M({ color: fallback, ...rest });
  m.userData.mapTint = tint;
  applyTex(m, url, { repeat });
  if (normal) applyTex(m, normal, { slot: 'normalMap', repeat, color: false, onLoad: () => m.normalScale && m.normalScale.set(normalScale, normalScale) });
  return m;
}

// ---------- edifici con UV in metri (finestre sempre in scala) ----------
// list: [{ x, y, z, w, h, d, color }], tile: dimensioni in metri di una ripetizione della texture
export function buildingsGeometry(list, tile = [6, 3.5]) {
  const geos = [];
  const c = new THREE.Color();
  for (const b of list) {
    const g = new THREE.BoxGeometry(b.w, b.h, b.d);
    const uv = g.attributes.uv;
    // ordine facce BoxGeometry: +x, -x, +y, -y, +z, -z (4 vertici ciascuna)
    const dims = [[b.d, b.h], [b.d, b.h], [b.w, b.d], [b.w, b.d], [b.w, b.h], [b.w, b.h]];
    for (let f = 0; f < 6; f++) {
      const [fw, fh] = dims[f];
      for (let k = 0; k < 4; k++) {
        const i = f * 4 + k;
        uv.setXY(i, uv.getX(i) * fw / tile[0] + (b.u0 || 0), uv.getY(i) * fh / tile[1]);
      }
    }
    // tetti senza finestre: uv a zero (pixel in basso a sinistra della texture)
    for (const f of [2, 3]) for (let k = 0; k < 4; k++) uv.setXY(f * 4 + k, 0.001, 0.001);
    g.translate(b.x, b.y, b.z);
    c.set(b.color);
    const col = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < col.length; i += 3) { col[i] = c.r; col[i + 1] = c.g; col[i + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geos.push(g);
  }
  return mergeGeometries(geos);
}
