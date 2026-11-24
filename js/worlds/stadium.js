// SPORT – La notte della grande finale
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, canvasTex, skyDome, starField, makeGlow, lambert, makePerson, animatePerson, crowdGeometry, crowdMaterial } from './common.js';
import { makeTVCamera } from '../ui.js';
import * as A from '../audio.js';

const REAL = [0xffffff, 0xffffff, 0xf3f3f3, 0x5b2a86, 0xe0b52a];
const BARCA = [0xa50044, 0x004d98, 0xa50044, 0x004d98, 0xedbb00];

export function createStadium() {
  const g = new THREE.Group();
  const R = rng(7);
  const U = { uTime: { value: 0 }, uExcite: { value: 0.7 }, uOla: { value: 0 } };

  g.add(new THREE.HemisphereLight(0xc8d8ff, 0x22331c, 1.1));
  const dl = new THREE.DirectionalLight(0xffffff, 1.5); dl.position.set(30, 80, 40); g.add(dl);
  const dl2 = new THREE.DirectionalLight(0xdfe8ff, 0.7); dl2.position.set(-40, 60, -30); g.add(dl2);
  g.add(skyDome(0x02040d, 0x14203d));
  g.add(starField(700, 3000, { size: 1.6, minY: 0.15, opacity: 0.7 }));

  // ---- campo ----
  const PW = 115, PH = 76;
  const pitchTex = canvasTex(1840, 1216, (c, w, h) => {
    const s = w / PW;
    for (let i = 0; i < 20; i++) { c.fillStyle = i % 2 ? '#2e8b35' : '#287d2f'; c.fillRect((i * w) / 20, 0, w / 20 + 1, h); }
    c.strokeStyle = '#f4f4f4'; c.lineWidth = 0.14 * s * 1.2;
    const X = (m) => (m + PW / 2) * s, Y = (m) => (m + PH / 2) * s;
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
    c.beginPath(); c.arc(X(0), Y(0), 0.3 * s, 0, Math.PI * 2); c.fill();
  });
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshLambertMaterial({ map: pitchTex }));
  pitch.rotation.x = -Math.PI / 2; g.add(pitch);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(240, 200), lambert(0x1d4a24)); apron.rotation.x = -Math.PI / 2; apron.position.y = -0.08; g.add(apron);

  // porte
  const postM = lambert(0xffffff);
  for (const sg of [-1, 1]) {
    const gp = new THREE.Group(); gp.position.x = sg * 52.5;
    const pg = new THREE.CylinderGeometry(0.07, 0.07, 2.44, 8);
    for (const z of [-3.66, 3.66]) { const p = new THREE.Mesh(pg, postM); p.position.set(0, 1.22, z); gp.add(p); }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 7.32, 8), postM); bar.rotation.x = Math.PI / 2; bar.position.y = 2.44; gp.add(bar);
    const net = new THREE.Mesh(new THREE.BoxGeometry(2, 2.44, 7.32), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, wireframe: true }));
    net.position.set(sg * 1, 1.22, 0); gp.add(net);
    g.add(gp);
  }

  // ---- tribune + tifosi ----
  const ROWS = 24, D = 0.9, RH = 0.55, Y0 = 1.25, SP = 0.82;
  const stands = [
    { axis: 'z', sign: 1, from: -56, to: 56, base: 42, palette: (x) => (x < 0 ? REAL : BARCA) },
    { axis: 'z', sign: -1, from: -56, to: 56, base: 42, palette: (x) => (x < 0 ? REAL : BARCA) },
    { axis: 'x', sign: -1, from: -37, to: 37, base: 60, palette: () => REAL },
    { axis: 'x', sign: 1, from: -37, to: 37, base: 60, palette: () => BARCA }
  ];
  const stepGeos = [];
  const seats = [];
  for (const st of stands) {
    const L = st.to - st.from;
    for (let r = 0; r < ROWS; r++) {
      const top = Y0 + r * RH, d = st.base + r * D + D / 2;
      const box = new THREE.BoxGeometry(st.axis === 'z' ? L : D, RH, st.axis === 'z' ? D : L);
      if (st.axis === 'z') box.translate(0, top - RH / 2, st.sign * d); else box.translate(st.sign * d, top - RH / 2, 0);
      stepGeos.push(box);
      for (let a = st.from + SP / 2; a < st.to; a += SP) {
        if (R() < 0.04) continue;
        const jit = (R() - 0.5) * 0.12;
        const x = st.axis === 'z' ? a + jit : st.sign * d;
        const z = st.axis === 'z' ? st.sign * d : a + jit;
        const pal = st.palette(x);
        seats.push({ x, y: top, z, color: pal[Math.floor(R() * pal.length)], yaw: st.axis === 'z' ? (st.sign > 0 ? Math.PI : 0) : (st.sign > 0 ? -Math.PI / 2 : Math.PI / 2) });
      }
    }
    // muro frontale con LED pubblicitari
    const wall = new THREE.BoxGeometry(st.axis === 'z' ? L : 0.3, Y0, st.axis === 'z' ? 0.3 : L);
    if (st.axis === 'z') wall.translate(0, Y0 / 2, st.sign * st.base); else wall.translate(st.sign * st.base, Y0 / 2, 0);
    stepGeos.push(wall);
    // muro posteriore
    const backH = Y0 + ROWS * RH + 3, bd = st.base + ROWS * D + 0.5;
    const back = new THREE.BoxGeometry(st.axis === 'z' ? L + 8 : 1, backH, st.axis === 'z' ? 1 : L + 8);
    if (st.axis === 'z') back.translate(0, backH / 2, st.sign * bd); else back.translate(st.sign * bd, backH / 2, 0);
    stepGeos.push(back);
  }
  g.add(new THREE.Mesh(mergeGeometries(stepGeos), lambert(0x3d424c)));

  const crowd = new THREE.InstancedMesh(crowdGeometry({ legs: false }), crowdMaterial(U, { jump: true }), seats.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), e = new THREE.Euler();
  seats.forEach((s, i) => {
    q.setFromEuler(e.set(0, s.yaw, 0));
    m4.compose(new THREE.Vector3(s.x, s.y, s.z), q, new THREE.Vector3(1, 0.9 + R() * 0.2, 1));
    crowd.setMatrixAt(i, m4);
    col.set(s.color).offsetHSL(0, 0, (R() - 0.5) * 0.1); crowd.setColorAt(i, col);
  });
  crowd.frustumCulled = false;
  g.add(crowd);

  // LED a bordo campo (scorrono)
  const ledTex = canvasTex(2048, 64, (c, w, h) => {
    const msgs = ['FINALE INTERNAZIONALE', 'REAL MADRID', 'BARCELLONA', 'NOTTE DI CALCIO', 'FAIR PLAY', 'INVIATO SPECIALE TV'];
    let x = 0; c.fillStyle = '#05070c'; c.fillRect(0, 0, w, h);
    c.font = '900 44px Arial'; c.textBaseline = 'middle';
    msgs.forEach((m, i) => { c.fillStyle = ['#ffd400', '#ffffff', '#ff3b6b', '#46e0ff', '#7CFC8A', '#ff8a00'][i]; c.fillText(m + '   •   ', x, h / 2); x += c.measureText(m + '   •   ').width; });
  }, { repeat: [3, 1] });
  const ledM = new THREE.MeshBasicMaterial({ map: ledTex });
  const ledSegs = [
    [0, 0.6, 41.8, 112, Math.PI], [0, 0.6, -41.8, 112, 0], [-59.8, 0.6, 0, 74, Math.PI / 2], [59.8, 0.6, 0, 74, -Math.PI / 2]
  ];
  for (const [x, y, z, L, ry] of ledSegs) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.9), ledM); m.position.set(x, y, z); m.rotation.y = ry; g.add(m);
  }

  // tetti, torri faro, maxischermi
  const roofM = lambert(0x1b1e25);
  const roofs = [
    [0, 21.5, 59, 120, 22], [0, 21.5, -59, 120, 22]
  ];
  roofs.forEach(([x, y, z, w, d]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, d), roofM); r.position.set(x, y, z); g.add(r);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff })); strip.position.set(x, y - 0.5, z - Math.sign(z) * d / 2); g.add(strip); });
  for (const [x, z] of [[-74, -56], [74, -56], [-74, 56], [74, 56]]) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 46, 10), lambert(0x6b7280)); tower.position.set(x, 23, z); g.add(tower);
    const head = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 1), new THREE.MeshBasicMaterial({ color: 0xf8fbff }));
    head.position.set(x, 47, z); head.lookAt(0, 0, 0); g.add(head);
    const gl = makeGlow(0xe8f0ff, 40, 0.85); gl.position.set(x * 0.98, 47, z * 0.98); g.add(gl);
  }

  const screenTex = canvasTex(1024, 512, () => {});
  const drawScreen = (mode, minute = 0) => screenTex.redraw((c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#071a3a'); gr.addColorStop(1, '#02060f');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffd400';
    c.font = '900 64px Arial'; c.fillText('FINALE INTERNAZIONALE', w / 2, 80);
    c.fillStyle = '#ffffff'; c.font = '900 78px Arial';
    if (mode === 'live') {
      c.fillText('REAL MADRID  1 - 1  BARCELLONA', w / 2, 250);
      c.fillStyle = '#ff3b3b'; c.font = '900 110px Arial'; c.fillText(`${minute}'`, w / 2, 400);
    } else if (mode === 'count') {
      c.fillText('REAL MADRID  vs  BARCELLONA', w / 2, 250);
      c.fillStyle = '#ff3b3b'; c.font = '900 80px Arial'; c.fillText('ULTIMI MINUTI!', w / 2, 400);
    } else {
      c.fillText('REAL MADRID  vs  BARCELLONA', w / 2, 250);
      c.fillStyle = '#7CFC8A'; c.font = '800 60px Arial'; c.fillText('RISCALDAMENTO IN CORSO', w / 2, 400);
    }
  });
  drawScreen('warm');
  const scrM = new THREE.MeshBasicMaterial({ map: screenTex });
  for (const sg of [-1, 1]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1, 13.5, 25.5), lambert(0x111111)); frame.position.set(sg * 89.6, 27, 0); g.add(frame);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(24, 12), scrM); s.position.set(sg * 89, 27, 0); s.rotation.y = -sg * Math.PI / 2; g.add(s);
  }

  // bandiere sventolanti
  const flagMatBase = (tex) => {
    const m = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = U.uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = modelMatrix[3].x * 0.37 + modelMatrix[3].z * 0.21;
        transformed.z += sin(position.x * 3.2 - uTime * 7.0 + ph) * 0.16 * position.x;`);
    };
    return m;
  };
  const realFlag = canvasTex(256, 160, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#5b2a86'; c.fillRect(0, h * 0.42, w, h * 0.16); c.fillStyle = '#e0b52a'; c.fillRect(0, h * 0.36, w, h * 0.05); c.fillRect(0, h * 0.59, w, h * 0.05); });
  const barcaFlag = canvasTex(256, 160, (c, w, h) => { for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#004d98' : '#a50044'; c.fillRect((i * w) / 6, 0, w / 6 + 1, h); } c.fillStyle = '#edbb00'; c.fillRect(0, 0, w, h * 0.12); });
  const fRM = flagMatBase(realFlag), fBM = flagMatBase(barcaFlag);
  const flagGeo = new THREE.PlaneGeometry(1.8, 1.1, 12, 4).translate(0.9, 0, 0);
  const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.4, 5).translate(0, 1.2, 0);
  const flags = [];
  for (let i = 0; i < 46; i++) {
    const s = seats[Math.floor(R() * seats.length)];
    const fg = new THREE.Group(); fg.position.set(s.x, s.y + 0.9, s.z);
    const barca = BARCA.includes(s.color);
    fg.add(new THREE.Mesh(poleGeo, lambert(0x999999)));
    const f = new THREE.Mesh(flagGeo, barca ? fBM : fRM); f.position.y = 1.8; fg.add(f);
    fg.rotation.y = R() * Math.PI * 2; fg.userData.ph = R() * 6;
    g.add(fg); flags.push(fg);
  }

  // lampi dei flash dei telefoni in tribuna
  const flashN = 260, fpos = new Float32Array(flashN * 3), fseed = new Float32Array(flashN);
  for (let i = 0; i < flashN; i++) { const s = seats[Math.floor(R() * seats.length)]; fpos.set([s.x, s.y + 1.5, s.z], i * 3); fseed[i] = R(); }
  const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3)); fgeo.setAttribute('aSeed', new THREE.BufferAttribute(fseed, 1));
  const flashes = new THREE.Points(fgeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: U.uTime },
    vertexShader: 'attribute float aSeed; uniform float uTime; varying float vA; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); float k = fract(sin(aSeed*91.3 + floor(uTime*6.0 + aSeed*7.0)*13.17)*43758.5); vA = step(0.93, k); gl_PointSize = 18.0 * 60.0 / -mv.z + 2.0; gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(vA<0.5||d>0.5) discard; gl_FragColor = vec4(1.0,1.0,1.0, smoothstep(0.5,0.0,d)); }'
  }));
  flashes.frustumCulled = false; g.add(flashes);

  // telecamere TV a bordo campo + panchine + allenatori
  const tvCams = [];
  for (const [x, z, ry] of [[-14, 36.5, Math.PI], [22, 36.5, Math.PI], [-56, 6, Math.PI / 2], [0, -37, 0]]) {
    const cam = makeTVCamera(1.7, { label: false }); cam.position.set(x, 0, z); cam.rotation.y = ry; g.add(cam); tvCams.push(cam);
    const op = makePerson({ shirt: 0x111827, shorts: 0x111827 }); op.position.set(x + (ry === 0 ? 0 : 0.0), 0, z + (ry === Math.PI ? 0.9 : ry === 0 ? -0.9 : 0)); op.position.x += ry === Math.PI / 2 ? -0.9 : 0; op.rotation.y = ry; g.add(op);
  }
  for (const sx of [-9, 9]) {
    const dug = new THREE.Mesh(new THREE.BoxGeometry(8, 2.4, 2), new THREE.MeshLambertMaterial({ color: 0x9fb4c8, transparent: true, opacity: 0.55 })); dug.position.set(sx, 1.2, 39.5); g.add(dug);
  }
  const coaches = [makePerson({ shirt: 0x0b0b0b, shorts: 0x0b0b0b }), makePerson({ shirt: 0x1e293b, shorts: 0x1e293b })];
  coaches[0].position.set(-6, 0, 36); coaches[1].position.set(6, 0, 36);
  coaches.forEach((c) => { c.rotation.y = Math.PI; g.add(c); });

  // spidercam
  const spider = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), lambert(0x222222)); g.add(spider);
  const cableGeo = new THREE.BufferGeometry().setFromPoints(new Array(8).fill(0).map(() => new THREE.Vector3()));
  const cables = new THREE.LineSegments(cableGeo, new THREE.LineBasicMaterial({ color: 0x555555 })); g.add(cables);
  const anchors = [[-70, 30, -50], [70, 30, -50], [-70, 30, 50], [70, 30, 50]].map((a) => new THREE.Vector3(...a));

  // giocatori
  const players = [];
  const mkTeam = (shirt, shorts, socks, side) => {
    for (let i = 0; i < 8; i++) {
      const p = makePerson({ shirt, shorts, socks });
      p.userData.cx = side * (12 + R() * 28); p.userData.cz = (R() - 0.5) * 40;
      p.userData.rx = 4 + R() * 8; p.userData.rz = 3 + R() * 6; p.userData.a = R() * 6; p.userData.sp = 0.25 + R() * 0.2;
      p.userData.mode = i < 2 ? 'pass' : i === 2 ? 'jump' : 'jog';
      p.userData.side = side; p.userData.target = new THREE.Vector3(); p.userData.home = new THREE.Vector3(side * (10 + R() * 35), 0, (R() - 0.5) * 50);
      g.add(p); players.push(p);
    }
  };
  mkTeam(0xffffff, 0xffffff, 0xffffff, -1);
  mkTeam(0xa50044, 0x004d98, 0x004d98, 1);
  // stripe blaugrana: aggiungo fascia blu ai giocatori del Barcellona
  players.filter((p) => p.userData.side > 0).forEach((p) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.585, 0.245), lambert(0x004d98)); band.position.set(0, 1.18, 0); p.add(band);
  });
  const ballM = lambert(0xffffff);
  const balls = [0, 1].map(() => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), ballM); g.add(b); return b; });
  const matchBall = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), ballM); matchBall.visible = false; g.add(matchBall);
  const ballTarget = new THREE.Vector3(), ballPos = new THREE.Vector3();
  let ballTimer = 0;

  let mode = 'warm', screenMinute = 88, sTimer = 0;
  let snd = null;

  const inst = {
    group: g,
    spawn: { x: 0, z: 37.6, yaw: 0 },
    background: 0x02040d,
    fog: new THREE.Fog(0x0a1228, 120, 600),
    studio: { distance: 2.3, scale: 1 },
    update(dt, t) {
      U.uTime.value = t;
      ledTex.offset.x = (t * 0.03) % 1;
      U.uOla.value = Math.sin(t * 0.07) > 0.6 ? 1 : 0;
      flags.forEach((f) => { f.rotation.z = Math.sin(t * 2.2 + f.userData.ph) * 0.35; });
      // spidercam
      spider.position.set(Math.sin(t * 0.13) * 40, 16 + Math.sin(t * 0.3) * 3, Math.sin(t * 0.21) * 20);
      const arr = cableGeo.attributes.position.array;
      anchors.forEach((a, i) => { arr.set([a.x, a.y, a.z, spider.position.x, spider.position.y + 0.25, spider.position.z], i * 6); });
      cableGeo.attributes.position.needsUpdate = true;
      tvCams.forEach((c, i) => { c.userData.yawG.rotation.y = Math.sin(t * 0.4 + i) * 0.5; });
      // allenatori
      coaches.forEach((c, i) => {
        const k = mode === 'warm' ? 0.2 : 1;
        c.userData.armR.rotation.x = -1.2 - Math.sin(t * 3 + i) * 0.6 * k;
        c.userData.armR.rotation.z = Math.sin(t * 2 + i) * 0.3 * k;
        c.position.x = (i ? 6 : -6) + Math.sin(t * 0.5 + i * 2) * 1.5 * k;
      });
      // giocatori
      if (mode === 'warm') {
        let pi = 0;
        players.forEach((p) => {
          const u = p.userData;
          if (u.mode === 'jog') {
            u.a += u.sp * dt;
            const x = u.cx + Math.cos(u.a) * u.rx, z = u.cz + Math.sin(u.a) * u.rz;
            const nx = u.cx + Math.cos(u.a + 0.05) * u.rx, nz = u.cz + Math.sin(u.a + 0.05) * u.rz;
            p.position.set(x, 0, z); p.rotation.y = Math.atan2(nx - x, nz - z);
            animatePerson(p, t * 9 + u.a * 10, 0.6);
          } else if (u.mode === 'jump') {
            p.position.set(u.cx, Math.max(0, Math.sin(t * 4)) * 0.35, u.cz);
            animatePerson(p, 0, 0, 0); u.armL.rotation.z = Math.sin(t * 8) > 0 ? -2.6 : -0.2; u.armR.rotation.z = -u.armL.rotation.z;
          } else {
            // coppie che si passano la palla
            const pair = players.filter((q) => q.userData.mode === 'pass' && q.userData.side === u.side);
            const idx = pair.indexOf(p);
            const base = new THREE.Vector3(u.side * 25, 0, u.side * 8);
            p.position.set(base.x + (idx ? 9 : -9), 0, base.z);
            p.rotation.y = idx ? -Math.PI / 2 : Math.PI / 2;
            if (idx === 0) {
              const b = balls[u.side > 0 ? 1 : 0];
              const cyc = (t * 0.6) % 2; const k = cyc % 1; const from = cyc < 1 ? -9 : 9;
              b.position.set(base.x + from + (cyc < 1 ? 18 : -18) * k, 0.11 + Math.sin(k * Math.PI) * 1.2, base.z);
            }
            animatePerson(p, t * 3, 0.15);
          }
          pi++;
        });
      } else {
        // partita negli ultimi minuti
        ballTimer -= dt;
        if (ballTimer <= 0) { ballTimer = 1.2 + Math.random() * 2; ballTarget.set((Math.random() - 0.5) * 90, 0.11, (Math.random() - 0.5) * 58); }
        ballPos.lerp(ballTarget, Math.min(1, dt * 1.6)); matchBall.position.copy(ballPos);
        players.forEach((p, i) => {
          const u = p.userData;
          u.target.copy(u.home).lerp(ballPos, i % 4 === 0 ? 0.85 : 0.35);
          const d = u.target.clone().sub(p.position); d.y = 0;
          const L = d.length(); const sp = Math.min(L, 6.5 * dt);
          if (L > 0.3) { d.normalize(); p.position.addScaledVector(d, sp); p.rotation.y = Math.atan2(d.x, d.z); animatePerson(p, t * 11 + i, 0.75); }
          else animatePerson(p, 0, 0);
          p.position.y = 0;
        });
        sTimer += dt;
        if (sTimer > 20 && screenMinute < 93) { sTimer = 0; screenMinute++; drawScreen('live', screenMinute); }
      }
      if (snd) snd.update(t);
    },
    onPhase(ph) {
      if (ph === 'countdown') { drawScreen('count'); U.uExcite.value = 1.0; }
      if (ph === 'live') {
        mode = 'match'; drawScreen('live', screenMinute); U.uExcite.value = 1.2;
        balls.forEach((b) => (b.visible = false)); matchBall.visible = true;
        ballPos.set(0, 0.11, 0);
        players.forEach((p) => { const u = p.userData; u.home.set(u.side * (8 + Math.random() * 38), 0, (Math.random() - 0.5) * 55); });
        if (snd) snd.roar();
      }
    },
    startAudio(s) {
      const dest = s.out;
      const roar = A.bed(s, dest, { kind: 'pink', f: 700, q: 0.5, level: 0.22, lfo: 0.07, depth: 0.5 });
      A.bed(s, dest, { kind: 'brown', type: 'lowpass', f: 350, q: 0.5, level: 0.25, lfo: 0.05, depth: 0.3 });
      const chantPan = s.panner(-75, 10, 0, { ref: 30, roll: 0.6 });
      A.chant(s, chantPan, { level: 0.1, base: 50 });
      const chant2 = s.panner(75, 10, 0, { ref: 30, roll: 0.6 });
      s.after(9000, () => A.chant(s, chant2, { level: 0.08, base: 53, bpm: 104 }));
      A.drums(s, s.panner(-70, 6, 15, { ref: 25, roll: 0.5 }), { bpm: 118, level: 0.6 });
      A.drums(s, s.panner(70, 6, -10, { ref: 25, roll: 0.5 }), { bpm: 128, level: 0.45 });
      const ap = A.applause(s, dest);
      s.every(7000, () => { if (Math.random() < 0.6) ap.burst(2 + Math.random() * 3, 0.18); });
      s.every(2600, () => { if (Math.random() < 0.55) A.whistle(s, s.panner((Math.random() - 0.5) * 120, 8, (Math.random() - 0.5) * 90, { ref: 15 }), s.t + Math.random(), 0.1); });
      const speaker = [
        'Signore e signori, benvenuti alla grande finale internazionale!',
        'Real Madrid contro Barcellona! Accogliamo le squadre con un grande applauso!',
        'Si invitano gli spettatori a raggiungere i propri posti. Il fischio d\'inizio è vicino.'
      ];
      let si = 0;
      s.after(5000, () => { s.say(speaker[si++ % 3], { rate: 0.95, volume: 0.9 }); });
      s.every(26000, () => { if (inst._phase !== 'live') s.say(speaker[si++ % 3], { rate: 0.95, volume: 0.85 }); });
      const tele = ['Palla al centro… attenzione… che occasione!', 'Lancio lungo, controlla, tira! Fuori di poco!', 'Pressing altissimo, la squadra non molla!'];
      let ti = 0;
      s.every(17000, () => { if (inst._phase !== 'live') s.say(tele[ti++ % 3], { rate: 1.25, volume: 0.35, pitch: 0.9 }); });
      snd = {
        update() {},
        roar() { const t = s.t; roar.gain.cancelScheduledValues(t); roar.gain.setValueAtTime(0.22, t); roar.gain.linearRampToValueAtTime(0.4, t + 1); roar.gain.linearRampToValueAtTime(0.25, t + 5); ap.burst(4, 0.25); }
      };
    }
  };
  return inst;
}
