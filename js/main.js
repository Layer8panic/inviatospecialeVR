// INVIATO SPECIALE VR – regia dell'esperienza
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { AudioEngine } from './audio.js';
import { WORLDS, WORLD_ORDER, COMMON_BRIEF, STORY_TASK } from './content.js';
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
if (renderer.xr.setFoveation) renderer.xr.setFoveation(0.5);
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
const S = { worldId: 'sport', name: '', immersion: 60 };
let world = null, scope = null, phase = 'none', phaseT = 0, elapsed = 0, bgHex = -1;
let active = null, studio = null, prompter = null, countdown = null, hint = null, cdLast = 99, onAir = false;

function immersionDur() { return FAST ? 8 : Math.max(60, S.immersion); }

// ---------- controller ----------
const controllers = [];
const factory = new XRControllerModelFactory();
const ray = new THREE.Raycaster();
const tmpM = new THREE.Matrix4();
for (let i = 0; i < 2; i++) {
  const c = renderer.xr.getController(i);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
  line.scale.z = 4; line.visible = false; c.add(line);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd400, depthTest: false }));
  dot.renderOrder = 1000; dot.visible = false; scene.add(dot);
  c.userData = { line, dot, src: null };
  c.addEventListener('connected', (e) => { c.userData.src = e.data; line.visible = e.data.targetRayMode !== 'gaze'; });
  c.addEventListener('disconnected', () => { c.userData.src = null; line.visible = false; dot.visible = false; });
  c.addEventListener('select', () => selectFrom(c));
  c.addEventListener('squeeze', () => recenter());
  rig.add(c);
  const grip = renderer.xr.getControllerGrip(i);
  try { grip.add(factory.createControllerModel(grip)); } catch (e) {}
  rig.add(grip);
  controllers.push(c);
}

function rayFrom(c) {
  tmpM.identity().extractRotation(c.matrixWorld);
  ray.ray.origin.setFromMatrixPosition(c.matrixWorld);
  ray.ray.direction.set(0, 0, -1).applyMatrix4(tmpM);
}
function pick() {
  const list = [...UI.interactives].filter(UI.isShown);
  if (!list.length) return null;
  return ray.intersectObjects(list, false)[0] || null;
}
function selectFrom(c) {
  rayFrom(c);
  const h = pick();
  if (h && h.object.userData.onSelect) {
    h.object.userData.onSelect();
    const hp = c.userData.src && c.userData.src.gamepad && c.userData.src.gamepad.hapticActuators;
    if (hp && hp[0] && hp[0].pulse) hp[0].pulse(0.4, 35);
  }
}

// mouse / touch per l'anteprima su schermo (LIM, PC)
const mouse = new THREE.Vector2(-9, -9);
let drag = null, yaw = 0, pitch = 0;
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
  if (e.key === 'Escape') exitPreview();
  if (e.key === 'r' || e.key === 'R') recenter();
  if (prompter && phase === 'live') {
    if (e.key === 'ArrowDown') prompter.nudge(120);
    if (e.key === 'ArrowUp') prompter.nudge(-120);
    if (e.key === ' ') prompter.toggle();
  }
  if (DEBUG && (e.key === 'n' || e.key === 'N')) phaseT += 1000;
});

function updatePointers() {
  const hov = new Set();
  if (mode === 'vr') {
    for (const c of controllers) {
      const { src, line, dot } = c.userData;
      if (!src || src.targetRayMode === 'gaze') { dot.visible = false; continue; }
      rayFrom(c);
      const h = pick();
      if (h) { hov.add(h.object); dot.position.copy(h.point); dot.visible = true; line.scale.z = h.distance; }
      else { dot.visible = false; line.scale.z = 4; }
    }
  } else if (mode === 'preview' && !drag) {
    ray.setFromCamera(mouse, camera);
    const h = pick(); if (h) hov.add(h.object);
    cv.style.cursor = h ? 'pointer' : 'grab';
  }
  UI.interactives.forEach((b) => b.setHover && b.setHover(hov.has(b)));
}

function stickY() {
  const s = renderer.xr.getSession(); if (!s) return 0;
  let v = 0;
  for (const src of s.inputSources) {
    const ax = src.gamepad && src.gamepad.axes; if (!ax) continue;
    const y = ax.length > 3 ? ax[3] : ax[1] || 0;
    if (Math.abs(y) > Math.abs(v)) v = y;
  }
  return v;
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
  const h = UI.makeInfoPanel({ w: 1.3, h: 0.34, kicker: 'MISSIONE IN CORSO', text: 'Guardati intorno a 360°: cosa vedi? Cosa senti? Tra poco andrai in diretta.', accent: '#7CFC8A' });
  h.scale.setScalar(sc());
  uiRoot.add(h); placeFront(h, dist(0.95), -0.35);
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
  cam.userData.yawG.rotation.y = Math.atan2(loc.x, loc.z);
  const yawG = cam.userData.yawG;
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
  prompter = new UI.Teleprompter(w.news, {
    reporter: S.name ? 'INVIATO: ' + S.name : 'INVIATO SPECIALE', place: w.place,
    onFinish: finishLive, onClick: () => audio.click()
  });
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
    list.unshift({ name: S.name || '—', world: S.worldId, score, total, date: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list.slice(0, 200)));
  } catch (e) {}
}

function showResult(score, total) {
  saveResult(score, total);
  clearUI();
  const w = WORLDS[S.worldId];
  const msg = score === total ? 'Perfetto! Sei un vero inviato speciale.' : score >= 3 ? 'Ottimo lavoro, inviato! Hai capito bene la notizia.' : 'Missione compiuta, ma rileggi con calma la notizia: alcuni dettagli ti sono sfuggiti.';
  const g = new THREE.Group();
  g.add(UI.makeInfoPanel({ w: 1.6, h: 0.9, kicker: `MISSIONE COMPIUTA  •  ${w.category}`, title: `${score} risposte corrette su ${total}`, text: [msg, STORY_TASK], accent: '#7CFC8A' }));
  const mk = (label, x, bg, hover, fn) => { const b = new UI.Button(label, { w: 0.5, h: 0.14, bg, hover, size: 0.36, onSelect: () => { audio.click(); fn(); } }); b.position.set(x, -0.56, 0.01); g.add(b); };
  mk('RIFAI LA MISSIONE', -0.54, '#374151', '#4b5563', () => startMission(S.worldId));
  mk('ALTRA MISSIONE', 0, '#1d4ed8', '#2563eb', showMenu);
  mk('ESCI', 0.54, '#b91c1c', '#dc2626', exitAll);
  g.scale.setScalar(sc());
  uiRoot.add(g); placeFront(g, dist(0.92), -0.05);
  active = g;
  audio.setDuck(0.6, 1);
  setPhase('result');
  audio.beep(660, 0.12, 0.2); audio.beep(880, 0.12, 0.2, 'sine', 0.12); audio.beep(1320, 0.3, 0.2, 'sine', 0.24);
}

function showMenu() {
  clearUI();
  loadWorld('newsroom');
  audio.setDuck(1, 0.5);
  setPhase('menu');
  const g = new THREE.Group();
  const head = new UI.CanvasPlane(1.5, 0.22, { px: 1400 });
  head.draw((c, w, h) => { c.fillStyle = '#c1121f'; UI.roundRect(c, 0, 0, w, h, 30); c.fill(); c.fillStyle = '#fff'; c.font = `900 ${h * 0.42}px ${UI.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SCEGLI LA TUA PROSSIMA MISSIONE', w / 2, h / 2); });
  head.position.y = 0.42; g.add(head);
  WORLD_ORDER.forEach((id, i) => {
    const w = WORLDS[id];
    const b = new UI.Button(`${w.category}  –  ${w.title}`, { w: 1.5, h: 0.15, bg: w.color, hover: '#ffffff', fg: '#ffffff', size: 0.34, onSelect: () => { audio.click(); startMission(id); } });
    b.hoverBg = '#111827';
    b.position.y = 0.2 - i * 0.18; g.add(b);
  });
  const ex = new UI.Button('ESCI', { w: 0.5, h: 0.13, bg: '#374151', hover: '#4b5563', onSelect: exitAll });
  ex.position.y = -0.56; g.add(ex);
  uiRoot.add(g); placeFront(g, 2.1, -0.1);
}

function exitAll() {
  if (mode === 'vr') { const s = renderer.xr.getSession(); if (s) s.end(); }
  else if (mode === 'preview') exitPreview();
}

function updateMission(dt) {
  switch (phase) {
    case 'briefing': if (!active && phaseT > 1.2) showBriefing(); break;
    case 'immersion':
      if (hint && phaseT > 8) { uiRoot.remove(hint); UI.disposeTree(hint); hint = null; }
      if (phaseT >= immersionDur()) startCountdown();
      break;
    case 'countdown': updateCountdown(); break;
    case 'live': if (prompter) prompter.update(dt, stickY()); break;
    case 'postlive': if (phaseT >= world.postLiveSeconds) startQuiz(); break;
  }
  updateStudio(dt);
}

// ---------- pagina iniziale ----------
const $ = (s) => document.querySelector(s);
function readForm() {
  S.name = ($('#reporter').value || '').trim().slice(0, 28);
  S.immersion = parseInt($('#immersion').value, 10) || 60;
  try { localStorage.setItem('inviatoSpecialeVR.nome', S.name); } catch (e) {}
}
document.querySelectorAll('.world-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.world-card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected'); S.worldId = card.dataset.world;
  });
});
try { $('#reporter').value = localStorage.getItem('inviatoSpecialeVR.nome') || ''; } catch (e) {}

async function enterVR() {
  if (!navigator.xr) return;
  audio.init();
  readForm();
  try {
    const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
    session.addEventListener('end', onSessionEnd);
    await renderer.xr.setSession(session);
    mode = 'vr';
    document.body.classList.add('in-vr');
    camera.rotation.set(0, 0, 0);
    startMission(S.worldId);
  } catch (err) {
    alert('Non riesco ad avviare la realtà virtuale: ' + (err && err.message ? err.message : err));
  }
}
function onSessionEnd() {
  mode = 'idle';
  document.body.classList.remove('in-vr');
  stopAll();
}
function startPreview() {
  audio.init();
  readForm();
  mode = 'preview';
  document.body.classList.add('in-preview');
  camera.position.set(0, 1.6, 0); yaw = 0; pitch = 0;
  startMission(S.worldId);
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

$('#btn-preview').addEventListener('click', startPreview);
$('#btn-exit-preview').addEventListener('click', exitPreview);
$('#btn-vr').addEventListener('click', enterVR);
const vrStatus = $('#vr-status');
if (navigator.xr && navigator.xr.isSessionSupported) {
  navigator.xr.isSessionSupported('immersive-vr').then((ok) => {
    $('#btn-vr').disabled = !ok;
    vrStatus.textContent = ok ? 'Visore pronto: premi «Entra in VR».' : 'Questo dispositivo non supporta la VR: usa l\'anteprima su schermo, oppure apri la pagina dal browser del Meta Quest.';
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
  if (!list.length) { box.innerHTML = '<tr><td colspan="4" class="empty">Nessuna missione completata su questo dispositivo.</td></tr>'; return; }
  box.innerHTML = list.slice(0, 40).map((r) => {
    const d = new Date(r.date);
    const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    return `<tr><td>${esc(r.name)}</td><td>${esc(NAMES[r.world] || r.world)}</td><td><b>${r.score}/${r.total}</b></td><td>${d.toLocaleDateString('it-IT')} ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</td></tr>`;
  }).join('');
}
$('#btn-clear').addEventListener('click', () => {
  if (confirm('Cancellare il registro delle missioni su questo dispositivo?')) { try { localStorage.removeItem('inviatoSpecialeVR.registro'); } catch (e) {} renderRegistro(); }
});
renderRegistro();

// sfondo animato della pagina iniziale
loadWorld('newsroom', false);

// ---------- ciclo principale ----------
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  elapsed += dt; phaseT += dt;
  if (mode === 'idle') { rig.rotation.y += dt * 0.05; }
  else if (mode === 'preview') camera.rotation.set(pitch * -1, -yaw, 0);
  updateMission(dt);
  if (world) {
    if (scene.fog !== (world.fog || null)) scene.fog = world.fog || null;
    if (world.background !== bgHex) { bgHex = world.background; scene.background.setHex(bgHex); }
    world.update(dt, elapsed, phase, camera);
  }
  updatePointers();
  audio.updateListener(camera);
  renderer.render(scene, camera);
});

if (DEBUG) window.__isvr = { S, startMission, startPreview, get phase() { return phase; }, skip: () => { phaseT += 1000; } };
