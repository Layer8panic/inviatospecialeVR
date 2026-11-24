// Persone 3D animate (Quaternius, Animated Men/Women Pack, CC0) e folle a "impostori" per stadio e strade.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const BASE = new URL('../assets/people/', import.meta.url).href;
const loader = new GLTFLoader();
const templates = new Map();

export const MEN = ['m_casual', 'm_long', 'm_shirt', 'm_suit'];
export const WOMEN = ['f_casual', 'f_dress', 'f_street', 'f_tank'];
export const CIVILIANS = [...MEN, ...WOMEN];
// nomi semplici delle animazioni -> nome nel file
const ANIM = { idle: 'Idle', walk: 'Walk', run: 'Run', clap: 'Clapping', sit: 'Sitting', jump: 'Jump', stand: 'Standing', cheer: 'Jump' };
export const SKINS = [0xf1c8a8, 0xe0ac86, 0xc68a62, 0x9c6644, 0x6f4630, 0x4a2e22, 0xf6d6bf];
export const HAIR = [0x1d140e, 0x3b2616, 0x5a3b22, 0x8b6136, 0xc9a464, 0x6b6b6b, 0x111111];

// colore dei materiali per nome (i file originali hanno colori molto scuri per alcune parti)
const KEEP = new Set(['Shirt', 'Pants', 'Belt', 'Vest', 'Hat', 'Main', 'Black', 'Brown', 'Details', 'Shoes', 'Jacket', 'Skirt', 'Dress', 'Tie', 'Coat', 'Sweater', 'Scarf', 'Apron', 'Gray', 'White', 'Red', 'Blue', 'Green']);

async function loadTemplate(name) {
  if (templates.has(name)) return templates.get(name);
  const p = loader.loadAsync(BASE + name + '.glb').then((g) => {
    const scene = g.scene;
    const skinned = [];
    scene.traverse((o) => { if (o.isSkinnedMesh) skinned.push(o); });
    const geos = [];
    const parts = [];
    for (const m of skinned) {
      const geo = m.geometry.clone();
      const n = geo.attributes.position.count;
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      const col = new Float32Array(n * 3);
      const c = mat.color ? mat.color.clone() : new THREE.Color(1, 1, 1);
      for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'skinIndex', 'skinWeight', 'color'].includes(k)) geo.deleteAttribute(k);
      parts.push({ name: mat.name || '', start: geos.reduce((a, g2) => a + g2.attributes.position.count, 0), count: n });
      geos.push(geo);
    }
    const merged = mergeGeometries(geos);
    const main = skinned[0];
    // altezza reale della persona: vertici trasformati dalle ossa (posa di riposo) e dalla scena
    scene.updateMatrixWorld(true);
    main.skeleton.update();
    const v = new THREE.Vector3(); let y0 = Infinity, y1 = -Infinity;
    for (const sm of skinned) {
      const pos = sm.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 3) {
        v.fromBufferAttribute(pos, i); sm.applyBoneTransform(i, v); v.applyMatrix4(sm.matrixWorld);
        if (v.y < y0) y0 = v.y; if (v.y > y1) y1 = v.y;
      }
    }
    const h = y1 - y0;
    const mesh = new THREE.SkinnedMesh(merged, sharedMat());
    mesh.name = 'body';
    main.parent.add(mesh);
    mesh.bind(main.skeleton, main.bindMatrix);
    skinned.forEach((s) => s.parent.remove(s));
    const clipMap = {};
    for (const a of g.animations) { const k = a.name.split('|').pop().replace(/^(Man|Female)_/, ''); clipMap[k] = a; }
    const t = { scene, parts, height: h, clips: clipMap };
    return t;
  });
  templates.set(name, p);
  return p;
}

let _mat = null;
function sharedMat() {
  if (!_mat) { _mat = new THREE.MeshLambertMaterial({ vertexColors: true }); _mat.userData.shared = true; }
  return _mat;
}

export async function preload(names = CIVILIANS) {
  await Promise.all(names.map(loadTemplate));
}

// colori di gioco: { Shirt: 0xffffff, Pants: ... } sovrascrivono i materiali con quel nome
export class Character {
  constructor(t, { skin, hair, colors = {}, height = 1.72, tint } = {}) {
    this.root = SkeletonUtils.clone(t.scene);
    this.root.traverse((o) => { if (o.isSkinnedMesh) { this.mesh = o; o.frustumCulled = false; } if (o.isBone) (this.bones || (this.bones = {}))[o.name] = o; });
    const geo = this.mesh.geometry.clone();
    const col = geo.attributes.color;
    const c = new THREE.Color();
    for (const p of t.parts) {
      let hex = null;
      if (p.name === 'Skin') hex = skin;
      else if (p.name === 'Hair' || p.name === 'HairBase' || p.name === 'Hair2') hex = hair;
      else if (colors[p.name] !== undefined) hex = colors[p.name];
      if (hex === null || hex === undefined) {
        if (p.name === 'Face') continue;
        if (tint) { for (let i = p.start; i < p.start + p.count; i++) { c.fromBufferAttribute(col, i).lerp(tint, 0.35); col.setXYZ(i, c.r, c.g, c.b); } }
        continue;
      }
      c.set(hex);
      for (let i = p.start; i < p.start + p.count; i++) col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
    this.mesh.geometry = geo;
    this.obj = new THREE.Group(); this.obj.userData.dynamic = true;
    this.obj.add(this.root);
    this.root.scale.setScalar(height / t.height);
    this.mixer = new THREE.AnimationMixer(this.root);
    this.clips = t.clips; this.actions = {}; this.current = null;
    this.torch = null; this.torchOn = false; this.armUp = 0;
  }
  play(name, { fade = 0.3, speed = 1, once = false, offset } = {}) {
    name = ANIM[name] || name;
    if (!this.clips[name]) return;
    let a = this.actions[name];
    if (!a) { a = this.actions[name] = this.mixer.clipAction(this.clips[name]); }
    a.timeScale = speed;
    if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity);
    if (this.current === a) return a;
    a.reset();
    if (offset !== undefined) a.time = offset * this.clips[name].duration;
    a.play();
    if (this.current) this.current.crossFadeTo(a, fade, false);
    this.current = a;
    return a;
  }
  // il telefono usato come torcia: braccio alzato, luce davanti e chiazza luminosa a terra
  setTorch(on) {
    this.torchOn = on;
    if (on && !this.torch) {
      const g = new THREE.Group();
      const phone = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.012), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      phone.rotation.x = -1.2; g.add(phone);
      const led = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      led.scale.setScalar(0.4); led.position.set(0, 0, 0.05); g.add(led);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.2, 16, 1, true), beamMat());
      beam.rotation.x = -Math.PI / 2 - 0.35; beam.position.set(0, -0.55, 1.5); g.add(beam);
      this.obj.add(g);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 24), poolMat());
      pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.03, 2.4); pool.scale.set(1.0, 1.5, 1);
      this.obj.add(pool);
      this.torch = { g, pool };
    }
    if (this.torch) { this.torch.g.visible = on; this.torch.pool.visible = on; }
  }
  update(dt) {
    this.mixer.update(dt);
    const k = this.torchOn ? 1 : 0;
    this.armUp += (k - this.armUp) * Math.min(1, dt * 4);
    if (this.torch && this.torchOn) {
      const hand = this.bones['PalmR'] || this.bones['LowerArmR'];
      if (hand) { this.root.updateMatrixWorld(true); const v = hand.getWorldPosition(new THREE.Vector3()); this.obj.worldToLocal(v); this.torch.g.position.copy(v); }
    }
    if (this.armUp > 0.01) {
      const ua = this.bones['UpperArmR'], la = this.bones['LowerArmR'];
      if (ua) ua.rotation.x = THREE.MathUtils.lerp(ua.rotation.x, -1.2, this.armUp);
      if (la) la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -0.3, this.armUp);
    }
  }
}

let _glow = null, _beam = null, _pool = null;
function glow() {
  if (_glow) return _glow;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  _glow = new THREE.CanvasTexture(c); _glow.userData.shared = true; return _glow;
}
function beamMat() {
  if (_beam) return _beam;
  _beam = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float edge = pow(abs(dot(vN, vV)), 1.5); gl_FragColor = vec4(vec3(1.0,0.97,0.9), 0.12 * vY * edge); }'
  });
  _beam.userData.shared = true; return _beam;
}
function poolMat() {
  if (_pool) return _pool;
  _pool = new THREE.MeshBasicMaterial({ map: glow(), color: 0xfff4dd, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  _pool.userData.shared = true; return _pool;
}

export async function makeCharacter(name, opts = {}) {
  const t = await loadTemplate(name);
  return new Character(t, opts);
}

export function randomLook(r = Math.random) {
  return { skin: SKINS[Math.floor(r() * SKINS.length)], hair: HAIR[Math.floor(r() * HAIR.length)], height: 1.6 + r() * 0.28 };
}

// ---------------- folle a impostori ----------------
// Fotografa i personaggi animati da davanti in un atlante (righe = varianti, colonne = fotogrammi).
// Poi migliaia di persone sono semplici rettangoli che mostrano il fotogramma giusto.
export async function bakeAtlas(renderer, variants, { clip = 'clap', frames = 8, cellW = 96, cellH = 192, angle = 0 } = {}) {
  const rows = variants.length;
  const rt = new THREE.WebGLRenderTarget(cellW * frames, cellH * rows, { samples: 0 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.6));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(0.5, 1, 2); scene.add(dl);
  const cam = new THREE.OrthographicCamera(-0.48, 0.48, 2.05, -0.05, 0.1, 10);
  cam.position.set(Math.sin(angle) * 4, 0, Math.cos(angle) * 4); cam.lookAt(0, 0, 0);
  const xr = renderer.xr.enabled; renderer.xr.enabled = false;
  const prevRT = renderer.getRenderTarget(); const prevClear = renderer.getClearAlpha(); const pc = new THREE.Color(); renderer.getClearColor(pc);
  const autoClear = renderer.autoClear;
  renderer.setClearColor(0x000000, 0);
  rt.viewport.set(0, 0, rt.width, rt.height); renderer.setRenderTarget(rt); renderer.clear();
  renderer.autoClear = false;
  for (let r = 0; r < rows; r++) {
    const v = variants[r];
    const ch = await makeCharacter(v.name, { ...v, height: 1.75 });
    scene.add(ch.obj);
    const a = ch.play(v.clip || clip);
    const dur = a.getClip().duration;
    for (let f = 0; f < frames; f++) {
      a.time = (f / frames) * dur; ch.mixer.update(0);
      rt.viewport.set(f * cellW, (rows - 1 - r) * cellH, cellW, cellH);
      rt.scissor.set(f * cellW, (rows - 1 - r) * cellH, cellW, cellH); rt.scissorTest = true;
      renderer.setRenderTarget(rt);
      renderer.render(scene, cam);
    }
    scene.remove(ch.obj); ch.mesh.skeleton.dispose(); ch.mesh.geometry.dispose();
  }
  rt.scissorTest = false; rt.viewport.set(0, 0, rt.width, rt.height); rt.scissor.set(0, 0, rt.width, rt.height);
  renderer.setRenderTarget(prevRT);
  renderer.autoClear = autoClear; renderer.setClearColor(pc, prevClear);
  renderer.xr.enabled = xr;
  rt.texture.generateMipmaps = true; rt.texture.minFilter = THREE.LinearMipmapLinearFilter;
  return { texture: rt.texture, rt, rows, frames };
}

// items: [{ x, y, z, yaw, row, phase, speed }]; mode 'fixed' (rivolti verso yaw) o 'face' (verso chi guarda)
export function impostorCrowd(atlas, items, { width = 0.8, height = 1.75 * 2.1 / 2.1, fps = 8, mode = 'fixed', uniforms = {}, walk } = {}) {
  const base = new THREE.PlaneGeometry(width, height * 1.0);
  base.translate(0, height / 2 - 0.05 * height / 2.1 * 0, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
  const n = items.length;
  const off = new Float32Array(n * 3), yaw = new Float32Array(n), row = new Float32Array(n), ph = new Float32Array(n), sp = new Float32Array(n), dir = new Float32Array(n * 3);
  items.forEach((it, i) => {
    off.set([it.x, it.y || 0, it.z], i * 3); yaw[i] = it.yaw || 0; row[i] = it.row; ph[i] = it.phase ?? Math.random(); sp[i] = it.speed ?? 1;
    if (it.dir) dir.set(it.dir, i * 3);
  });
  g.setAttribute('iOff', new THREE.InstancedBufferAttribute(off, 3));
  g.setAttribute('iYaw', new THREE.InstancedBufferAttribute(yaw, 1));
  g.setAttribute('iRow', new THREE.InstancedBufferAttribute(row, 1));
  g.setAttribute('iPh', new THREE.InstancedBufferAttribute(ph, 1));
  g.setAttribute('iSp', new THREE.InstancedBufferAttribute(sp, 1));
  g.setAttribute('iDir', new THREE.InstancedBufferAttribute(dir, 3));
  g.instanceCount = n;
  const U = {
    uMap: { value: atlas.texture }, uTime: uniforms.uTime || { value: 0 }, uRows: { value: atlas.rows }, uFrames: { value: atlas.frames },
    uFps: { value: fps }, uLight: uniforms.uLight || { value: 1 }, uExcite: uniforms.uExcite || { value: 1 }, uOla: uniforms.uOla || { value: 0 },
    uFogColor: { value: new THREE.Color(0x000000) }, uFogNear: { value: 1e6 }, uFogFar: { value: 2e6 }, uWalkLen: { value: walk ? walk.len : 0 }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide,
    vertexShader: `
      attribute vec3 iOff; attribute float iYaw; attribute float iRow; attribute float iPh; attribute float iSp; attribute vec3 iDir;
      uniform float uTime, uRows, uFrames, uFps, uExcite, uOla, uWalkLen;
      varying vec2 vUv; varying float vFog;
      void main(){
        float fr = floor(mod(uTime * uFps * iSp + iPh * uFrames, uFrames));
        vUv = vec2((fr + uv.x) / uFrames, (uRows - 1.0 - iRow + uv.y) / uRows);
        vec3 o = iOff;
        ${walk ? 'o += iDir * (mod(uTime * iSp * 1.3 + iPh * uWalkLen, uWalkLen) - uWalkLen * 0.5);' : ''}
        float ola = smoothstep(0.92, 1.0, sin(atan(o.z, o.x) - uTime * 1.1)) * uOla;
        o.y += ola * 0.5 + max(0.0, sin(uTime * 6.0 + iPh * 40.0)) * 0.08 * uExcite * step(0.55, iPh);
        vec3 p = position;
        ${mode === 'face'
          ? 'vec3 camR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); camR.y = 0.0; camR = normalize(camR); vec3 w = o + camR * p.x + vec3(0.0, p.y, 0.0);'
          : 'float c = cos(iYaw), s = sin(iYaw); vec3 w = o + vec3(p.x * c, p.y, -p.x * s);'}
        vec4 mv = viewMatrix * vec4(w, 1.0);
        vFog = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uMap; uniform float uLight; uniform vec3 uFogColor; uniform float uFogNear, uFogFar;
      varying vec2 vUv; varying float vFog;
      void main(){
        vec4 c = texture2D(uMap, vUv);
        if (c.a < 0.5) discard;
        vec3 col = c.rgb * uLight;
        col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, vFog));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.userData.U = U; mesh.userData.rt = atlas.rt;
  mesh.setFog = (fog) => { if (fog) { U.uFogColor.value.copy(fog.color); U.uFogNear.value = fog.near; U.uFogFar.value = fog.far; } };
  return mesh;
}
