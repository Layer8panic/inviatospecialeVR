// INVIATO SPECIALE VR – regia dell'esperienza
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { AudioEngine } from './audio.js';
import { WORLDS, WORLD_ORDER, COMMON_BRIEF, STORY_TASK } from './content.js';
import { SND } from './sounds.js';
import * as UI from './ui.js';
import { createStadium } from './worlds/stadium.js';
import { createVesuvio } from './worlds/vesuvio.js';
import { createMars } from './worlds/mars.js';
import { createTimesSquare } from './worlds/timessquare.js';
import { createNewsroom } from './worlds/newsroom.js';

const BUILDERS = { sport: createStadium, vesuvio: createVesuvio, marte: createMars, times: createTimesSquare, newsroom: createNewsroom };
const params = new URLSearchParams(location.search);
const FAST = params.has('fast');
const DEBUG = FAST || params.has('debug');

// ---------- renderer e scena ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setFramebufferScaleFactor(1.15); // immagine più nitida nel visore
if (renderer.xr.setFoveation) renderer.xr.setFoveation(0.35);
document.getElementById('app').appendChild(renderer.domElement);
UI.UIConf.aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070c);
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 5000);
camera.rotation.order = 'YXZ';
camera.position.set(0, 1.6, 0);
const rig = new THREE.Group(); rig.add(camera); scene.add(rig);
const uiRoot = new THREE.Group(); scene.add(uiRoot);
const audio = new AudioEngine();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- stato ----------
let mode = 'idle'; // idle | vr | preview
const S = { worldId: 'sport', immersion: 60 };
let world = null, scope = null, phase = 'none', phaseT = 0, elapsed = 0, bgHex = -1;
let active = null, studio = null, prompter = null, countdown = null, hint = null, cdLast = 99, onAir = false;
let pauseMenu = null, paused = false;

function immersionDur() { return FAST ? 8 : Math.max(world && world.minImmersion || 60, S.immersion); }

// ---------- controller ----------
const controllers = [];
const factory = new XRControllerModelFactory();
const ray = new THREE.Raycaster();
const tmpM = new THREE.Matrix4();
const wristBtn = new UI.Button('≡ MENU', { w: 0.13, h: 0.055, bg: '#c1121f', hover: '#e5383b', size: 0.5, onSelect: () => togglePause() });
wristBtn.visible = false;
for (let i = 0; i < 2; i++) {
  const c = renderer.xr.getController(i);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
  line.scale.z = 4; line.visible = false; c.add(line);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd400, depthTest: false }));
  dot.renderOrder = 1000; dot.visible = false; scene.add(dot);
  const grip = renderer.xr.getControllerGrip(i);
  try { grip.add(factory.createControllerModel(grip)); } catch (e) {}
  rig.add(grip);
  c.userData = { line, dot, src: null, grip, prev: [] };
  c.addEventListener('connected', (e) => {
    c.userData.src = e.data; line.visible = e.data.targetRayMode !== 'gaze';
    // pulsante MENU sul polso sinistro
    if (e.data.handedness === 'left') { grip.add(wristBtn); wristBtn.position.set(0, 0.06, 0.06); wristBtn.rotation.set(-Math.PI / 2.6, 0, 0); wristBtn.visible = true; }
  });
  c.addEventListener('disconnected', () => { c.userData.src = null; line.visible = false; dot.visible = false; if (wristBtn.parent === grip) wristBtn.visible = false; });
  c.addEventListener('select', () => selectFrom(c));
  c.addEventListener('squeeze', () => recenter());
  rig.add(c);
  controllers.push(c);
}

function rayFrom(c) {
  tmpM.identity().extractRotation(c.matrixWorld);
  ray.ray.origin.setFromMatrixPosition(c.matrixWorld);
  ray.ray.direction.set(0, 0, -1).applyMatrix4(tmpM);
}
function pick(exclude) {
  const list = [...UI.interactives].filter((o) => o !== exclude && UI.isShown(o));
  if (!list.length) return null;
  return ray.intersectObjects(list, false)[0] || null;
}
function haptic(src, v = 0.4, ms = 35) {
  const hp = src && src.gamepad && src.gamepad.hapticActuators;
  if (hp && hp[0] && hp[0].pulse) hp[0].pulse(v, ms);
}
function selectFrom(c) {
  rayFrom(c);
  // il raggio della mano sinistra non può premere il proprio pulsante del polso
  const own = c.userData.src && c.userData.src.handedness === 'left' ? wristBtn : null;
  const h = pick(own);
  if (h && h.object.userData.onSelect) { h.object.userData.onSelect(); haptic(c.userData.src); }
}

// ---------- mouse e tastiera per l'anteprima su schermo ----------
const mouse = new THREE.Vector2(-9, -9);
let drag = null, yaw = 0, pitch = 0;
const keys = new Set();
const cv = renderer.domElement;
cv.addEventListener('pointerdown', (e) => { if (mode !== 'preview') return; drag = { x: e.clientX, y: e.clientY, moved: 0 }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', (e) => {
  mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
  yaw += dx * 0.0045; pitch = THREE.MathUtils.clamp(pitch + dy * 0.0045, -1.2, 1.2);
});
cv.addEventListener('pointerup', () => {
  if (drag && drag.moved < 8) { ray.setFromCamera(mouse, camera); const h = pick(); if (h) h.object.userData.onSelect(); }
  drag = null;
});
cv.addEventListener('wheel', (e) => { if (prompter && phase === 'live') prompter.nudge(e.deltaY * 0.8); }, { passive: true });
window.addEventListener('keydown', (e) => {
  if (mode !== 'preview') return;
  keys.add(e.key.toLowerCase());
  if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') togglePause();
  if (e.key === 'r' || e.key === 'R') recenter();
  if (prompter && phase === 'live') {
    if (e.key === 'PageDown') prompter.nudge(120);
    if (e.key === 'PageUp') prompter.nudge(-120);
    if (e.key === ' ') prompter.toggle();
  }
  if (DEBUG && (e.key === 'n' || e.key === 'N')) phaseT += 1000;
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

function updatePointers() {
  const hov = new Set();
  if (mode === 'vr') {
    for (const c of controllers) {
      const { src, line, dot } = c.userData;
      if (!src || src.targetRayMode === 'gaze') { dot.visible = false; continue; }
      rayFrom(c);
      const h = pick(src.handedness === 'left' ? wristBtn : null);
      if (h) {
        if (!hov.has(h.object) && !h.object.hovered) haptic(src, 0.15, 12);
        hov.add(h.object); dot.position.copy(h.point); dot.visible = true; line.scale.z = h.distance;
      } else { dot.visible = false; line.scale.z = 4; }
    }
  } else if (mode === 'preview' && !drag) {
    ray.setFromCamera(mouse, camera);
    const h = pick(); if (h) hov.add(h.object);
    cv.style.cursor = h ? 'pointer' : 'grab';
  }
  UI.interactives.forEach((b) => b.setHover && b.setHover(hov.has(b)));
}

// ---------- levette: movimento e rotazione fluidi ----------
// levetta DESTRA: ti sposti nella direzione in cui guardi
// levetta SINISTRA: giri la visuale in modo continuo (sinistra/destra); su/giù scorre il gobbo in diretta
const loco = { vx: 0, vz: 0, turn: 0 };
const _head = new THREE.Vector3(), _fwd = new THREE.Vector3(), _q2 = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);
const dz = (v, d = 0.12) => (Math.abs(v) < d ? 0 : Math.sign(v) * (Math.abs(v) - d) / (1 - d));
function readSticks() {
  const out = { mx: 0, my: 0, tx: 0, ty: 0, buttons: [] };
  const s = renderer.xr.getSession(); if (!s) return out;
  for (const src of s.inputSources) {
    const gp = src.gamepad; if (!gp) continue;
    const ax = gp.axes;
    const x = ax.length >= 4 ? ax[2] : ax[0] || 0, y = ax.length >= 4 ? ax[3] : ax[1] || 0;
    if (src.handedness === 'left') { out.tx = dz(x); out.ty = dz(y); } else { out.mx = dz(x); out.my = dz(y); }
    out.buttons.push({ src, pressed: gp.buttons.map((b) => b.pressed) });
  }
  return out;
}
const prevBtn = new Map();
function updateLocomotion(dt) {
  let mx = 0, my = 0, tx = 0, ty = 0;
  if (mode === 'vr') {
    const st = readSticks(); mx = st.mx; my = st.my; tx = st.tx; ty = st.ty;
    // tasti Y (sinistra) e B (destra): apre e chiude il menu
    for (const b of st.buttons) {
      const p = prevBtn.get(b.src) || [];
      if (b.pressed[5] && !p[5]) togglePause();
      prevBtn.set(b.src, b.pressed);
    }
    if (phase === 'live' && prompter && !paused) prompter.scrollBy(ty * 300 * dt);
  } else if (mode === 'preview') {
    if (keys.has('w') || keys.has('arrowup')) my -= 1;
    if (keys.has('s') || keys.has('arrowdown')) my += 1;
    if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
    if (keys.has('d') || keys.has('arrowright')) mx += 1;
    if (keys.has('q')) tx -= 1;
    if (keys.has('e')) tx += 1;
  } else return;
  if (paused) { mx = my = tx = 0; }
  // rotazione continua, con curva morbida per i piccoli movimenti
  const targetTurn = -Math.sign(tx) * tx * tx * 2.0; // rad/s
  loco.turn += (targetTurn - loco.turn) * Math.min(1, dt * 10);
  // movimento con accelerazione e frenata morbide
  camera.getWorldQuaternion(_q2);
  _fwd.set(0, 0, -1).applyQuaternion(_q2); _fwd.y = 0; if (_fwd.lengthSq() < 1e-4) _fwd.set(0, 0, -1); _fwd.normalize();
  const rx = -_fwd.z, rz = _fwd.x; // destra
  const speed = 2.4;
  const tvx = (_fwd.x * -my + rx * mx) * speed, tvz = (_fwd.z * -my + rz * mx) * speed;
  const k = Math.min(1, dt * 8);
  loco.vx += (tvx - loco.vx) * k; loco.vz += (tvz - loco.vz) * k;
  if (Math.abs(loco.turn) < 1e-4 && Math.abs(loco.vx) < 1e-4 && Math.abs(loco.vz) < 1e-4) return;
  camera.updateMatrixWorld(true);
  _head.setFromMatrixPosition(camera.matrixWorld);
  // ruota attorno alla testa, non attorno ai piedi del rig
  const dTh = loco.turn * dt;
  if (dTh) {
    const off = rig.position.clone().sub(_head).applyAxisAngle(_up, dTh);
    rig.position.copy(_head).add(off);
    rig.rotation.y += dTh;
  }
  // spostamento con i limiti del mondo
  const next = _head.clone(); next.x += loco.vx * dt; next.z += loco.vz * dt;
  if (world && world.bounds) world.bounds(next);
  rig.position.x += next.x - _head.x; rig.position.z += next.z - _head.z;
}

// ---------- posizionamento davanti allo studente ----------
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _d = new THREE.Vector3();
function eye() {
  camera.updateMatrixWorld(true);
  _p.setFromMatrixPosition(camera.matrixWorld);
  camera.getWorldQuaternion(_q);
  _d.set(0, 0, -1).applyQuaternion(_q); _d.y = 0;
  if (_d.lengthSq() < 1e-4) _d.set(0, 0, -1).applyQuaternion(rig.quaternion);
  _d.normalize();
  return { p: _p.clone(), d: _d.clone(), yaw: Math.atan2(-_d.x, -_d.z) };
}
function placeFront(obj, dist, dy = 0, floor = false) {
  const { p, d, yaw: y } = eye();
  if (world && world.panelDist) dist = world.panelDist(p, d, dist);
  obj.position.set(p.x + d.x * dist, floor ? rig.position.y : p.y + dy, p.z + d.z * dist);
  obj.rotation.set(0, y, 0);
  obj.userData.place = { dist, dy, floor };
}
function recenter() {
  for (const o of uiRoot.children) { const pl = o.userData.place; if (pl) placeFront(o, pl.dist, pl.dy, pl.floor); }
}

// ---------- mondi ----------
function clearUI() {
  for (const o of [...uiRoot.children]) { uiRoot.remove(o); UI.disposeTree(o); }
  active = studio = prompter = countdown = hint = null;
  pauseMenu = null; paused = false;
}
function loadWorld(id, withAudio = true) {
  if (scope) { scope.stop(0.6); scope = null; }
  audio.hush();
  if (world) { if (world.dispose) world.dispose(); scene.remove(world.group); UI.disposeTree(world.group); world = null; }
  world = BUILDERS[id]();
  world.id = id;
  scene.add(world.group);
  scene.fog = world.fog || null;
  bgHex = -1;
  rig.position.set(world.spawn.x, 0, world.spawn.z);
  rig.rotation.set(0, world.spawn.yaw || 0, 0);
  loco.vx = loco.vz = loco.turn = 0;
  if (withAudio && audio.ctx) { scope = audio.scope(); world.startAudio(scope); }
}
function setPhase(p) {
  phase = p; phaseT = 0;
  if (world) { world._phase = p; if (world.onPhase) world.onPhase(p, { duration: immersionDur() }); }
}
const sc = () => (world && world.studio ? world.studio.scale : 1);
const dist = (k = 1) => (world && world.studio ? world.studio.distance : 2.2) * k;

function startMission(id) {
  clearUI();
  S.worldId = id;
  loadWorld(id);
  audio.setDuck(0.45, 0.3);
  setPhase('briefing');
}

function showBriefing() {
  const w = WORLDS[S.worldId];
  const g = new THREE.Group();
  const panel = UI.makeInfoPanel({
    w: 1.6, h: 0.98, kicker: `COMUNICAZIONE DALLA REDAZIONE  •  ${w.category}`, title: w.title,
    text: [w.briefing, COMMON_BRIEF], accent: '#ffd400'
  });
  g.add(panel);
  const btn = new UI.Button('SONO PRONTO: INIZIA LA MISSIONE', { w: 1.1, h: 0.15, bg: '#c1121f', hover: '#e5383b', size: 0.4, onSelect: () => { audio.click(); beginImmersion(); } });
  btn.position.set(0, -0.6, 0.01); g.add(btn);
  g.scale.setScalar(sc());
  uiRoot.add(g); placeFront(g, dist(0.9), -0.05);
  active = g;
  audio.beep(660, 0.12, 0.2); audio.beep(990, 0.18, 0.2, 'sine', 0.13);
}

function beginImmersion() {
  clearUI();
  audio.setDuck(1, 1.5);
  setPhase('immersion');
  const help = mode === 'vr'
    ? 'Guardati intorno: cosa vedi? Cosa senti? Levetta destra per spostarti, levetta sinistra per girarti. Tra poco andrai in diretta.'
    : 'Guardati intorno: cosa vedi? Cosa senti? Trascina per girarti, WASD per spostarti. Tra poco andrai in diretta.';
  const h = UI.makeInfoPanel({ w: 1.35, h: 0.36, kicker: 'MISSIONE IN CORSO', text: help, accent: '#7CFC8A' });
  h.scale.setScalar(sc());
  uiRoot.add(h); placeFront(h, dist(0.95), -0.38);
  hint = h;
}

function startCountdown() {
  clearUI();
  const { p } = eye();
  const s = sc();
  const eyeY = Math.max(1.0, p.y - rig.position.y);
  studio = new THREE.Group();
  studio.scale.setScalar(s);
  const cam = UI.makeTVCamera((eyeY - 0.05) / s);
  cam.position.set(-0.98, 0, 0.12);
  cam.scale.setScalar(0.001);
  studio.add(cam);
  studio.userData.cam = cam;
  studio.userData.panelY = (eyeY - 0.12) / s;
  countdown = new UI.CountdownPanel();
  countdown.position.set(0.2, studio.userData.panelY, 0);
  countdown.visible = false;
  studio.add(countdown);
  uiRoot.add(studio);
  placeFront(studio, dist(), 0, true);
  cdLast = 99; onAir = false;
  setPhase('countdown');
  audio.beep(520, 0.25, 0.2, 'triangle');
}

function updateStudio(dt) {
  if (!studio) return;
  const cam = studio.userData.cam;
  studio.userData.k = Math.min(1, (studio.userData.k || 0) + dt * 1.8);
  cam.scale.setScalar(Math.max(0.001, 1 - Math.pow(1 - studio.userData.k, 3)));
  const head = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
  const loc = cam.worldToLocal(head);
  const yawG = cam.userData.yawG;
  yawG.rotation.y = Math.atan2(loc.x, loc.z);
  const dy = loc.y - (cam.userData.headY + 0.2);
  yawG.rotation.x = -Math.atan2(dy, Math.hypot(loc.x, loc.z)) * 0.8;
  if (phase === 'countdown') UI.setTally(cam, Math.floor(phaseT * 2) % 2 === 0);
}

function updateCountdown() {
  if (phaseT < 1.2) return;
  countdown.visible = true;
  const n = 10 - Math.floor(phaseT - 1.2);
  if (n !== cdLast) {
    cdLast = n;
    if (n >= 1) { countdown.show(n); audio.beep(n <= 3 ? 1200 : 1000, 0.12, 0.25); }
    else if (!onAir) { onAir = true; countdown.onAir(); audio.beep(1500, 0.6, 0.3); UI.setTally(studio.userData.cam, true); }
  }
  if (onAir && phaseT >= 12.2) goLive();
}

function goLive() {
  const w = WORLDS[S.worldId];
  studio.remove(countdown); UI.disposeTree(countdown); countdown = null;
  prompter = new UI.Teleprompter(w.news, { reporter: 'INVIATO SPECIALE', place: w.place, onFinish: finishLive, onClick: () => audio.click() });
  prompter.position.set(0.2, studio.userData.panelY, 0);
  studio.add(prompter);
  UI.setTally(studio.userData.cam, true);
  audio.setDuck(0.55, 1.2);
  setPhase('live');
}

function finishLive() {
  if (phase !== 'live') return;
  audio.beep(880, 0.1, 0.2); audio.beep(660, 0.2, 0.2, 'sine', 0.1);
  clearUI();
  audio.setDuck(1, 1.5);
  if (world.postLiveSeconds && !FAST) setPhase('postlive');
  else startQuiz();
}

function startQuiz() {
  clearUI();
  const w = WORLDS[S.worldId];
  const qp = new UI.QuizPanel(w.quiz, {
    onDone: showResult, onClick: () => audio.click(),
    sfx: (ok) => { if (ok) { audio.beep(880, 0.12, 0.22); audio.beep(1320, 0.22, 0.22, 'sine', 0.12); } else audio.beep(200, 0.35, 0.2, 'square'); }
  });
  qp.scale.setScalar(sc());
  uiRoot.add(qp); placeFront(qp, dist(0.92), -0.05);
  active = qp;
  audio.setDuck(0.5, 1);
  setPhase('quiz');
}

function saveResult(score, total) {
  try {
    const key = 'inviatoSpecialeVR.registro';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.unshift({ world: S.worldId, score, total, date: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list.slice(0, 200)));
  } catch (e) {}
}

// pulsanti grandi per scegliere un mondo, riusati in redazione, pausa e risultato
function missionButtons(g, y0, { w = 0.74, h = 0.2, cols = 2, gap = 0.03, current } = {}) {
  WORLD_ORDER.forEach((id, i) => {
    const W = WORLDS[id];
    const b = new UI.Button(`${W.category}\n${W.title}`, { w, h, bg: id === current ? '#374151' : W.color, hover: '#111827', size: 0.26, onSelect: () => { audio.click(); startMission(id); } });
    const c = i % cols, r = Math.floor(i / cols);
    b.position.set((c - (cols - 1) / 2) * (w + gap), y0 - r * (h + gap), 0.01);
    g.add(b);
  });
}

function showResult(score, total) {
  saveResult(score, total);
  clearUI();
  const w = WORLDS[S.worldId];
  const msg = score === total ? 'Perfetto! Sei un vero inviato speciale.' : score >= 3 ? 'Ottimo lavoro, inviato! Hai capito bene la notizia.' : 'Missione compiuta, ma rileggi con calma la notizia: alcuni dettagli ti sono sfuggiti.';
  const g = new THREE.Group();
  const p = UI.makeInfoPanel({ w: 1.6, h: 0.78, kicker: `MISSIONE COMPIUTA  •  ${w.category}`, title: `${score} risposte corrette su ${total}`, text: [msg, STORY_TASK], accent: '#7CFC8A' });
  p.position.y = 0.3; g.add(p);
  const lab = new UI.CanvasPlane(1.6, 0.08, { px: 1200 });
  lab.draw((c, cw, ch) => { c.fillStyle = '#ffd400'; c.font = `800 ${ch * 0.6}px ${UI.FONT}`; c.textBaseline = 'middle'; c.fillText('PROSSIMA MISSIONE', 10, ch / 2); });
  lab.position.y = -0.14; g.add(lab);
  missionButtons(g, -0.3, { w: 0.78, h: 0.16, current: S.worldId });
  const mk = (label, x, bg, hover, fn) => { const b = new UI.Button(label, { w: 0.5, h: 0.12, bg, hover, size: 0.38, onSelect: () => { audio.click(); fn(); } }); b.position.set(x, -0.7, 0.01); g.add(b); };
  mk('RIFAI LA MISSIONE', -0.54, '#374151', '#4b5563', () => startMission(S.worldId));
  mk('REDAZIONE', 0, '#1d4ed8', '#2563eb', showHub);
  mk('ESCI', 0.54, '#b91c1c', '#dc2626', exitAll);
  g.scale.setScalar(sc());
  uiRoot.add(g); placeFront(g, dist(0.95), 0);
  active = g;
  audio.setDuck(0.6, 1);
  setPhase('result');
  audio.beep(660, 0.12, 0.2); audio.beep(880, 0.12, 0.2, 'sine', 0.12); audio.beep(1320, 0.3, 0.2, 'sine', 0.24);
}

// ---------- redazione (punto di partenza in VR) ----------
function showHub() {
  clearUI();
  loadWorld('newsroom');
  audio.setDuck(1, 0.5);
  setPhase('hub');
  const g = new THREE.Group();
  const head = new UI.CanvasPlane(1.56, 0.2, { px: 1400 });
  head.draw((c, w, h) => { c.fillStyle = '#c1121f'; UI.roundRect(c, 0, 0, w, h, 30); c.fill(); c.fillStyle = '#fff'; c.font = `900 ${h * 0.42}px ${UI.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('REDAZIONE  •  SCEGLI LA MISSIONE', w / 2, h / 2); });
  head.position.y = 0.5; g.add(head);
  missionButtons(g, 0.26, { w: 0.77, h: 0.22 });
  const imm = new UI.Button('', { w: 0.77, h: 0.12, bg: '#374151', hover: '#4b5563', size: 0.34, onSelect: () => {
    audio.click(); S.immersion = S.immersion >= 120 ? 60 : S.immersion + 30; imm.setLabel(immLabel()); syncForm();
  } });
  const immLabel = () => `IMMERSIONE: ${S.immersion === 60 ? '1 MINUTO' : S.immersion === 90 ? '1 MINUTO E MEZZO' : '2 MINUTI'}`;
  imm.setLabel(immLabel());
  imm.position.set(-0.4, -0.3, 0.01); g.add(imm);
  const ex = new UI.Button('ESCI', { w: 0.77, h: 0.12, bg: '#b91c1c', hover: '#dc2626', onSelect: exitAll });
  ex.position.set(0.4, -0.3, 0.01); g.add(ex);
  uiRoot.add(g); placeFront(g, 2.0, -0.08);
  active = g;
}

// ---------- menu di pausa ----------
function togglePause() {
  if (mode === 'idle') return;
  if (pauseMenu) { closePause(); return; }
  if (phase === 'hub') { recenter(); return; }
  audio.click();
  paused = true;
  uiRoot.children.forEach((o) => { if (o !== pauseMenu) o.userData.hiddenByPause = o.visible, o.visible = false; });
  const g = new THREE.Group();
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.2), new THREE.MeshBasicMaterial({ color: 0x070b14, transparent: true, opacity: 0.95, fog: false, depthTest: false, depthWrite: false }));
  bg.renderOrder = 19; bg.position.set(0, 0.05, -0.01); g.add(bg);
  const head = new UI.CanvasPlane(1.56, 0.14, { px: 1400 });
  head.draw((c, w, h) => { c.fillStyle = '#fff'; c.font = `900 ${h * 0.55}px ${UI.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('MENU', w / 2, h / 2); });
  head.position.y = 0.55; g.add(head);
  const row = (items, y) => {
    const w = (1.56 - (items.length - 1) * 0.03) / items.length;
    items.forEach(([label, bgc, fn], i) => {
      const b = new UI.Button(label, { w, h: 0.13, bg: bgc, hover: '#4b5563', size: 0.34, onSelect: () => { audio.click(); fn(); } });
      b.position.set(-0.78 + w / 2 + i * (w + 0.03), y, 0.01); g.add(b);
    });
  };
  row([['▶ RIPRENDI', '#15803d', closePause], ['↻ RICOMINCIA', '#374151', () => startMission(S.worldId)]], 0.37);
  const canSkip = phase === 'briefing' || phase === 'immersion';
  row([[canSkip ? 'VAI SUBITO ALLA DIRETTA' : 'RIPORTA I PANNELLI DAVANTI', '#374151', () => { closePause(); if (canSkip) { if (phase === 'briefing') beginImmersion(); phaseT = 1e6; } else recenter(); }], ['REDAZIONE', '#1d4ed8', showHub]], 0.21);
  const lab = new UI.CanvasPlane(1.56, 0.07, { px: 1200 });
  lab.draw((c, cw, ch) => { c.fillStyle = '#ffd400'; c.font = `800 ${ch * 0.6}px ${UI.FONT}`; c.textBaseline = 'middle'; c.fillText('CAMBIA MONDO', 6, ch / 2); });
  lab.position.y = 0.08; g.add(lab);
  missionButtons(g, -0.06, { w: 0.765, h: 0.15, current: S.worldId });
  row([['ESCI DAL VR', '#b91c1c', exitAll]], -0.44);
  uiRoot.add(g); placeFront(g, 1.8, -0.05);
  pauseMenu = g;
  audio.setDuck(0.3, 0.4);
}
function closePause() {
  if (!pauseMenu) return;
  uiRoot.remove(pauseMenu); UI.disposeTree(pauseMenu); pauseMenu = null; paused = false;
  uiRoot.children.forEach((o) => { if (o.userData.hiddenByPause !== undefined) { o.visible = o.userData.hiddenByPause; delete o.userData.hiddenByPause; } });
  audio.setDuck(phase === 'live' ? 0.55 : phase === 'quiz' || phase === 'result' || phase === 'briefing' ? 0.5 : 1, 0.6);
}

function exitAll() {
  if (mode === 'vr') { const s = renderer.xr.getSession(); if (s) s.end(); }
  else if (mode === 'preview') exitPreview();
}

function updateMission(dt) {
  switch (phase) {
    case 'briefing': if (!active && phaseT > 1.2) showBriefing(); break;
    case 'immersion':
      if (hint && phaseT > 10) { uiRoot.remove(hint); UI.disposeTree(hint); hint = null; }
      if (phaseT >= immersionDur()) startCountdown();
      break;
    case 'countdown': updateCountdown(); break;
    case 'live': if (prompter) prompter.update(dt, 0); break;
    case 'postlive': if (phaseT >= world.postLiveSeconds) startQuiz(); break;
  }
  updateStudio(dt);
}

// ---------- pagina iniziale ----------
const $ = (s) => document.querySelector(s);
function readForm() { S.immersion = parseInt($('#immersion').value, 10) || 60; }
function syncForm() { const el = $('#immersion'); if (el) el.value = String(S.immersion); }
document.querySelectorAll('.world-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.world-card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected'); S.worldId = card.dataset.world;
  });
});

let startTarget = 'hub';
async function enterVR(target) {
  if (!navigator.xr) return;
  audio.init();
  readForm();
  startTarget = target;
  try {
    const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
    session.addEventListener('end', onSessionEnd);
    await renderer.xr.setSession(session);
    mode = 'vr';
    document.body.classList.add('in-vr');
    camera.rotation.set(0, 0, 0);
    if (startTarget === 'hub') showHub(); else startMission(startTarget);
  } catch (err) {
    alert('Non riesco ad avviare la realtà virtuale: ' + (err && err.message ? err.message : err));
  }
}
function onSessionEnd() {
  mode = 'idle';
  document.body.classList.remove('in-vr');
  stopAll();
}
function startPreview(target) {
  audio.init();
  readForm();
  mode = 'preview';
  document.body.classList.add('in-preview');
  camera.position.set(0, 1.6, 0); yaw = 0; pitch = 0;
  if (target === 'hub') showHub(); else startMission(target);
}
function exitPreview() {
  mode = 'idle';
  document.body.classList.remove('in-preview');
  stopAll();
}
function stopAll() {
  clearUI();
  if (scope) { scope.stop(0.5); scope = null; }
  audio.hush();
  loadWorld('newsroom', false);
  setPhase('none');
  camera.position.set(0, 1.6, 0); camera.rotation.set(0, 0, 0);
  renderRegistro();
}

$('#btn-vr').addEventListener('click', () => enterVR(S.worldId));
$('#btn-hub').addEventListener('click', () => (vrOK ? enterVR('hub') : startPreview('hub')));
$('#btn-preview').addEventListener('click', () => startPreview(S.worldId));
$('#btn-exit-preview').addEventListener('click', exitPreview);
$('#btn-menu-preview').addEventListener('click', togglePause);
let vrOK = false;
const vrStatus = $('#vr-status');
if (navigator.xr && navigator.xr.isSessionSupported) {
  navigator.xr.isSessionSupported('immersive-vr').then((ok) => {
    vrOK = ok;
    $('#btn-vr').disabled = !ok;
    vrStatus.textContent = ok ? 'Visore pronto.' : 'Questo dispositivo non supporta la VR: usa l\'anteprima su schermo, oppure apri la pagina dal browser del Meta Quest.';
  }).catch(() => { $('#btn-vr').disabled = true; });
} else {
  $('#btn-vr').disabled = true;
  vrStatus.textContent = window.isSecureContext ? 'WebXR non disponibile su questo browser: usa l\'anteprima su schermo.' : 'Serve una connessione https per la VR.';
}

const NAMES = Object.fromEntries(WORLD_ORDER.map((id) => [id, WORLDS[id].category]));
function renderRegistro() {
  const box = $('#registro-body');
  let list = [];
  try { list = JSON.parse(localStorage.getItem('inviatoSpecialeVR.registro') || '[]'); } catch (e) {}
  if (!list.length) { box.innerHTML = '<tr><td colspan="3" class="empty">Nessuna missione completata su questo dispositivo.</td></tr>'; return; }
  box.innerHTML = list.slice(0, 40).map((r) => {
    const d = new Date(r.date);
    return `<tr><td>${NAMES[r.world] || ''}</td><td><b>${r.score}/${r.total}</b></td><td>${d.toLocaleDateString('it-IT')} ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</td></tr>`;
  }).join('');
}
$('#btn-clear').addEventListener('click', () => {
  if (confirm('Cancellare il registro delle missioni su questo dispositivo?')) { try { localStorage.removeItem('inviatoSpecialeVR.registro'); } catch (e) {} renderRegistro(); }
});
renderRegistro();
{ const ul = $('#crediti'); if (ul) ul.innerHTML = Object.values(SND).map((x) => `<li>${x.credit}</li>`).join(''); }

// sfondo animato della pagina iniziale
loadWorld('newsroom', false);

// ---------- ciclo principale ----------
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  elapsed += dt;
  if (!paused) phaseT += dt;
  if (mode === 'idle') { rig.rotation.y += dt * 0.05; }
  else if (mode === 'preview') camera.rotation.set(-pitch, -yaw, 0);
  updateLocomotion(dt);
  if (!paused) updateMission(dt);
  if (world) {
    if (scene.fog !== (world.fog || null)) scene.fog = world.fog || null;
    if (world.background !== bgHex) { bgHex = world.background; scene.background.setHex(bgHex); }
    if (!paused) world.update(dt, elapsed, phase, camera);
  }
  updatePointers();
  audio.updateListener(camera);
  renderer.render(scene, camera);
});

if (DEBUG) window.__isvr = {
  S, startMission, startPreview, beginImmersion, finishLive, startQuiz, showHub, togglePause,
  get phase() { return phase; }, get world() { return world; }, get active() { return active; },
  skip: (s = 1000) => { phaseT += s; }, look: (y, p = 0) => { yaw = y; pitch = p; }
};
