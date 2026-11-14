'use strict';

/* NOVA SANTOS — mundo aberto 3D em Three.js (r128). Tudo procedural, sem assets externos. */
/* Mapa fixo: durante o carregamento do mundo o aleatório usa uma semente fixa (mesmo mapa sempre).
   Para gerar outro mapa, mude MAP_SEED. Depois que o mundo carrega, liveRandom() volta ao aleatório normal. */
const MAP_SEED = 20240613;
const mulberry32 = a => () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
let _rng = mulberry32(MAP_SEED);
const liveRandom = () => { _rng = Math.random };
const $ = i => document.getElementById(i), R2 = () => _rng(), PI = Math.PI, V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const cl = (v, a, b) => Math.max(a, Math.min(b, v)), rr = (a, b) => a + R2() * (b - a), pk = a => a[Math.floor(R2() * a.length)];
const ang = (a, b) => {
  let d = (b - a) % (2 * PI);
  if (d > PI)
    d -= 2 * PI;
  if (d < -PI)
    d += 2 * PI;
  return d
};
const B = 64, N = 12, H = B * N / 2;
  // B = distância entre ruas, N = quarteirões por lado
const Q = [{ p: .5, s: 0, f: 300 }, { p: .75, s: 0, f: 450 }, { p: 1, s: 1024, f: 650 }, { p: 1.25, s: 2048, f: 850 }, { p: 1.5, s: 4096, f: 1100 }];
let S = { q: 2, money: 500 };
try {
  Object.assign(S, JSON.parse(localStorage.getItem('ns')))
} catch (e) {}
const save = () => {
  try {
    localStorage.setItem('ns', JSON.stringify({ q: S.q, money: S.money }))
  } catch (e) {}

};

/* ===== Renderer, luzes e qualidade ===== */
const R = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true }), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(65, 1, .1, 1500);
scene.fog = new THREE.Fog(0x87b5e8, 60, 900);
R.shadowMap.type = THREE.PCFSoftShadowMap;
const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x555544, .6), sun = new THREE.DirectionalLight(0xfff2d8, 1);
scene.add(hemi, sun, sun.target);
Object.assign(sun.shadow.camera, {
  left: -120, right: 120, top: 120, bottom: -120, far: 600
});
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -.0005;
let scl = 1;
function setRes() {
  R.setPixelRatio(Math.min(devicePixelRatio * Q[S.q].p, 2) * scl);
  R.setSize(innerWidth, innerHeight)
}
function applyQ() {
  const q = Q[S.q];
  setRes();
  R.shadowMap.enabled = q.s > 0;
  sun.castShadow = q.s > 0;
  if (q.s) {
    sun.shadow.mapSize.set(q.s, q.s);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null
    }

  }
  scene.fog.far = q.f;
  scene.traverse(o => {
    if (o.material && !Array.isArray(o.material))
      o.material.needsUpdate = true
    })
}
addEventListener('resize', () => {
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
  setRes()
});

/* ===== Texturas procedurais e helpers ===== */
function tex(w, h, fn, rep) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (rep)
    t.repeat.set(rep, rep);
  return t
}
const gn = (g, w, h, n, a) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = R2() < .5 ? `rgba(0,0,0,${a})`: `rgba(255,255,255,${a})`;
    g.fillRect(R2() * w, R2() * h, 2, 2)
  }

};
const M = (c, r = .7, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
function bx(w, h, d, c, x, y, z, p) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), c.isMaterial ? c: M(c));
  m.position.set(x, y, z);
  m.castShadow = true;
  p.add(m);
  return m
}
const dm = new THREE.Object3D();
function inst(geo, mat, a, sh) {
  const m = new THREE.InstancedMesh(geo, mat, a.length);
  a.forEach((p, i) => {
    dm.position.set(p[0], p[1], p[2]);
    dm.scale.set(p[3] || 1, p[4] || 1, p[3] || 1);
    dm.updateMatrix();
    m.setMatrixAt(i, dm.matrix)
  });
  m.castShadow = !!sh;
  m.frustumCulled = false;
  scene.add(m);
  return m
}

/* ===== Mundo: chão, asfalto, mar, regiões ===== */
const roadT = tex(512, 512, (g, w, h) => {
  g.fillStyle = '#2c2e33';
  g.fillRect(0, 0, w, h);
  gn(g, w, h, 7000, .08);
  g.fillStyle = '#8f9296';
  g.fillRect(64, 64, 384, 384);
  gn(g, w, h, 1, 0);
  g.strokeStyle = '#c4c7cb';
  g.lineWidth = 5;
  g.strokeRect(64, 64, 384, 384);
  g.fillStyle = '#e8c22e';
  for (let i = 0; i < 512; i += 48) {
    g.fillRect(i, -2, 26, 4);
    g.fillRect(-2, i, 4, 26);
    g.fillRect(i, 510, 26, 4);
    g.fillRect(510, i, 4, 26)
  }
  g.fillStyle = '#ddd';
  for (let i = 84; i < 440; i += 24) {
    g.fillRect(i, 38, 12, 20);
    g.fillRect(i, 454, 12, 20);
    g.fillRect(38, i, 20, 12);
    g.fillRect(454, i, 20, 12)
  }

}, N);
const city = new THREE.Mesh(new THREE.PlaneGeometry(N * B, N * B), new THREE.MeshStandardMaterial({ map: roadT, roughness: .92 }));
city.rotation.x = -PI / 2;
city.receiveShadow = true;
scene.add(city);
const grass = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200), new THREE.MeshStandardMaterial({
  color: 0x5b7a43, roughness: 1, map: tex(128, 128, (g, w, h) => {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
    gn(g, w, h, 1800, .14)
  }, 300)
}));
grass.rotation.x = -PI / 2;
grass.position.y = -.1;
grass.receiveShadow = true;
scene.add(grass);
const flat = (w, h, c, x, y, z, g) => {
  const m = new THREE.Mesh(g || new THREE.PlaneGeometry(w, h), M(c, .95));
  m.rotation.x = -PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  scene.add(m);
  return m
};
flat(1800, 70, 0xe3d3a1, 0, -.05, 430);
flat(500, 700, 0xd9b66f, 680, -.04, -250);
const waveT = tex(128, 128, (g, w, h) => {
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = '#cfe8ff';
  g.lineWidth = 2;
  for (let i = 0; i < 30; i++) {
    g.beginPath();
    g.moveTo(R2() * w, R2() * h);
    g.quadraticCurveTo(R2() * w, R2() * h, R2() * w, R2() * h);
    g.stroke()
  }

}, 30);
const seaM = new THREE.MeshStandardMaterial({
  color: 0x2a86b8, roughness: .12, metalness: .35, map: waveT
});
const sea = new THREE.Mesh(new THREE.PlaneGeometry(3200, 1500), seaM);
sea.rotation.x = -PI / 2;
sea.position.set(0, -.2, 1205);
scene.add(sea);
const lake = new THREE.Mesh(new THREE.CircleGeometry(130, 32), seaM);
lake.rotation.x = -PI / 2;
lake.position.set(-650, -.03, -300);
scene.add(lake);
const mtM = Object.assign(M(0x6b7a6a, 1), { flatShading: true });
for (let i = 0; i < 30; i++) {
  const s = i % 2 ? 1: -1, h = rr(150, 380), r = rr(150, 300), m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), mtM);
  if (i % 3)
    m.position.set(rr(-1500, 1500), h / 2 - 5, -rr(900, 1500));
  else
    m.position.set(s * rr(1000, 1500), h / 2 - 5, rr(-900, 300));
  scene.add(m)
}

/* ===== Céu: sol, estrelas, nuvens ===== */
const sunM = new THREE.Mesh(new THREE.SphereGeometry(28, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfff0b0, fog: false }));
scene.add(sunM);
const sp_ = [];
for (let i = 0; i < 900; i++) {
  const a = R2() * PI * 2, b = Math.acos(R2()), r = 1300;
  sp_.push(r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a))
}
const sg = new THREE.BufferGeometry();
sg.setAttribute('position', new THREE.Float32BufferAttribute(sp_, 3));
const stars = new THREE.Points(sg, new THREE.PointsMaterial({
  size: 2, color: 0xffffff, transparent: true, fog: false, sizeAttenuation: false
}));
stars.frustumCulled = false;
scene.add(stars);
const cloudM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 }), clouds = [];
for (let i = 0; i < 26; i++) {
  const c = new THREE.Group();
  for (let j = 0; j < 5; j++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(rr(15, 28), 8, 6), cloudM);
    s.position.set(j * 22 - 44, rr(-4, 4), rr(-12, 12));
    s.scale.y = .45;
    c.add(s)
  }
  c.position.set(rr(-1000, 1000), rr(150, 230), rr(-1000, 800));
  scene.add(c);
  clouds.push(c)
}

/* ===== Cidade procedural ===== */
const wallT = tex(512, 512, g => {
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 512, 512);
  gn(g, 512, 512, 4000, .06);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      g.fillStyle = '#27384a';
    g.fillRect(i * 128 + 22, j * 128 + 18, 84, 92);
    g.fillStyle = '#5f7f9e';
    g.fillRect(i * 128 + 22, j * 128 + 18, 84, 28)
  }

});
const litT = tex(512, 512, g => {
  g.fillStyle = '#000';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      if (R2() < .45) {
        g.fillStyle = R2() < .8 ? '#ffd98a': '#bfe3ff';
    g.fillRect(i * 128 + 22, j * 128 + 18, 84, 92)
  }

});
const bm = new THREE.MeshStandardMaterial({
  vertexColors: true, map: wallT, emissive: 0xffffff, emissiveMap: litT, emissiveIntensity: 0, roughness: .65, metalness: .15
});
const BL = [], park = [], tTr = [], tCr = [];
function building(x, z, w, d, h, col) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, ox = Math.floor(rr(0, 4)) / 4, oy = Math.floor(rr(0, 4)) / 4;
  for (let i = 0; i < 24; i++) {
    const f = i >> 2;
    if (f == 2 || f == 3)
      uv.setXY(i, .03, .03);
    else
      uv.setXY(i, uv.getX(i) * ((f < 2 ? d: w) / 16) + ox, uv.getY(i) * (h / 16) + oy)
    }
  const c = new THREE.Color(col), a = [];
  for (let i = 0; i < 24; i++)
    a.push(c.r, c.g, c.b);
  g.setAttribute('color', new THREE.Float32BufferAttribute(a, 3));
  const m = new THREE.Mesh(g, bm);
  m.position.set(x, h / 2, z);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  BL.push({
    x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h, m, w, d
  })
}
const tree = (x, z) => {
  tTr.push([x, 1.25, z, 1, 1]);
  const s = rr(.8, 1.3);
  tCr.push([x, 4.4, z, s, s])
};
const GL = [0x8fb4d4, 0x6f8fb0, 0xa7bdd0, 0x9aa5ad, 0x7d9bb5], PS_ = [0xe3d3b4, 0xd9a38f, 0xc9d6c0, 0xbfc4cf, 0xeadfc8, 0xb98f7a];
for (let i = 0; i < N; i++) {
  park[i] = [];
  for (let j = 0; j < N; j++) {
    const cx = (i - N / 2 + .5) * B, cz = (j - N / 2 + .5) * B, dc = Math.hypot(cx, cz) / H;
    if (dc > .3 && R2() < .12) {
      park[i][j] = 1;
      const g = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), M(0x4c8a3c, 1));
      g.rotation.x = -PI / 2;
      g.position.set(cx, .03, cz);
      g.receiveShadow = true;
      scene.add(g);
      for (let k = 0; k < 9; k++)
        tree(cx + rr(-20, 20), cz + rr(-20, 20));
      continue
    }
    park[i][j] = 0;
    const n = dc < .35 ? 1: R2() < .5 ? 2: 4, h0 = dc < .35 ? rr(60, 150): dc < .65 ? rr(18, 50): rr(7, 16), pal = dc < .5 ? GL: PS_;
    const parts = n == 1 ? [[0, 0, 40, 40]]: n == 2 ? [[-10, 0, 18, 40], [10, 0, 18, 40]]: [[-10, -10, 18, 18], [10, -10, 18, 18], [-10, 10, 18, 18], [10, 10, 18, 18]];
    for (const[p, q, w, d] of parts)
      building(cx + p, cz + q, w, d, h0 * rr(.7, 1.1), pk(pal));
    for (let k = 0; k < 3; k++) {
      tree(cx + pk([-22, 22]), cz + rr(-20, 20));
      tree(cx + rr(-20, 20), cz + pk([-22, 22]))
    }

  }

}
for (let i = 0; i < 230; i++) {
  const x = rr(-850, -430), z = rr(-800, 300);
  if (Math.hypot(x + 650, z + 300) > 140)
    tree(x, z)
  }
inst(new THREE.CylinderGeometry(.25, .3, 2.5, 6), M(0x5b3a22), tTr, true);
inst(new THREE.ConeGeometry(1.8, 4.5, 7), M(0x2f6b34, .9), tCr, true);
inst(new THREE.CylinderGeometry(.3, .3, 2.2, 6), M(0x3f7a3a), Array.from({ length: 40 }, () => [rr(450, 880), 1.1, rr(-580, 80)]), true);
  // cactos
  // postes de luz e semáforos
const poles = [], bulbs = [], sigP = [], sX = [], sZ = [];
for (let i = 0; i <= N; i++)
  for (let j = 0; j <= N; j++) {
    const x = (i - N / 2) * B, z = (j - N / 2) * B;
  poles.push([x + 9, 3.5, z + 9]);
  bulbs.push([x + 9, 7.1, z + 9]);
  sigP.push([x - 9, 2.5, z - 9]);
  sX.push([x - 8.4, 5.2, z - 9]);
  sZ.push([x - 9, 5.2, z - 8.4])
}
const lampM = new THREE.MeshBasicMaterial({ color: 0x1a1a1a }), mSX = new THREE.MeshBasicMaterial({ color: 0x22ff55 }), mSZ = new THREE.MeshBasicMaterial({ color: 0xff2222 });
inst(new THREE.CylinderGeometry(.12, .15, 7, 6), M(0x44474c), poles);
inst(new THREE.SphereGeometry(.45, 8, 6), lampM, bulbs);
inst(new THREE.CylinderGeometry(.1, .12, 5, 6), M(0x44474c), sigP);
inst(new THREE.SphereGeometry(.38, 8, 6), mSX, sX);
inst(new THREE.SphereGeometry(.38, 8, 6), mSZ, sZ);
const inB = (x, y, z) => {
  for (const b of BL)
    if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y < b.h)
      return 1;
  return 0
};
function hitB(x, z, r, y) {
  for (const b of BL) {
    if (y > b.h + .5)
      continue;
    if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) {
      const dx = x - cl(x, b.x0, b.x1), dz = z - cl(z, b.z0, b.z1), d = Math.hypot(dx, dz);
      if (d < r) {
        if (d > 1e-4)
          return [dx / d * (r - d), dz / d * (r - d)];
        const l = x - b.x0, rt = b.x1 - x, t = z - b.z0, bt = b.z1 - z, m = Math.min(l, rt, t, bt);
        return m == l ? [- (l + r), 0]: m == rt ? [rt + r, 0]: m == t ? [0, - (t + r)]: [0, bt + r]
      }

    }

  }
  return null
}

/* ===== Partículas ===== */
const sprT = tex(64, 64, g => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64)
});
const PS = [];
for (let i = 0; i < 220; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprT, transparent: true, depthWrite: false }));
  s.visible = false;
  s.l = 0;
  s.v = V3();
  scene.add(s);
  PS.push(s)
}
let pi = 0;
function emit(p, v, col, sz, life, gr, gv) {
  const s = PS[pi++ % PS.length];
  s.position.copy(p);
  s.v.copy(v);
  s.material.color.setHex(col);
  s.visible = true;
  s.l = s.L = life;
  s.sz = sz;
  s.gr = gr;
  s.gv = gv;
  s.scale.setScalar(sz)
}

/* ===== Áudio (Web Audio) ===== */
let AC, eng, engG, sir, sirG, mute = false;
function initA() {
  if (AC)
    return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext) ();
    const mk = t => {
      const o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter();
      o.type = t;
      f.frequency.value = 900;
      g.gain.value = 0;
      o.connect(f);
      f.connect(g);
      g.connect(AC.destination);
      o.start();
      return [o, g]
    };
    [eng, engG] = mk('sawtooth');
    [sir, sirG] = mk('square')
  } catch (e) {
    AC = null
  }

}
function nz(d, v, f) {
  if (!AC || mute)
    return;
  const n = Math.floor(AC.sampleRate * d), b = AC.createBuffer(1, n, AC.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < n; i++)
    a[i] = (R2() * 2 - 1) * (1 - i / n);
  const s = AC.createBufferSource(), g = AC.createGain(), fl = AC.createBiquadFilter();
  s.buffer = b;
  fl.frequency.value = f;
  g.gain.value = v;
  s.connect(fl);
  fl.connect(g);
  g.connect(AC.destination);
  s.start()
}
function bp(f, d) {
  if (!AC || mute)
    return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.frequency.value = f;
  g.gain.value = .08;
  g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + d);
  o.connect(g);
  g.connect(AC.destination);
  o.start();
  o.stop(AC.currentTime + d)
}

/* ===== Personagem (humanoide articulado) ===== */
const OUT = [[0xc0392b, 0x2c3e50], [0x2980b9, 0x1b1b1b], [0xf1c40f, 0x6d4c41], [0x27ae60, 0x34495e], [0xecf0f1, 0x1c1c1c]], SH = [0xc0392b, 0x2980b9, 0xf1c40f, 0x27ae60, 0x8e44ad, 0xecf0f1, 0xe67e22], PA = [0x2c3e50, 0x1b1b1b, 0x6d4c41, 0x34495e, 0x555555];
function person(sh, pa) {
  const g = new THREE.Group(), t = new THREE.Group(), sm = M(sh), pm = M(pa), sk = M(0xd9a77f);
  t.position.y = .9;
  g.add(t);
  bx(.5, .62, .3, sm, 0, .33, 0, t);
  bx(.24, .26, .24, sk, 0, .8, 0, t);
  bx(.26, .1, .26, M(0x222222), 0, .95, 0, t);
  const lim = (x, y, m, len, w, p) => {
    const o = new THREE.Group();
    o.position.set(x, y, 0);
    bx(w, len, w, m, 0, -len / 2, 0, o);
    p.add(o);
    return o
  };
  return {
    g,
    t,
    sm,
    pm,
    aL: lim(-.33, .6, sm, .58, .15, t),
    aR: lim(.33, .6, sm, .58, .15, t),
    lL: lim(-.13, .9, pm, .9, .2, g),
    lR: lim(.13, .9, pm, .9, .2, g),
    ph: 0
  }
}
function anim(p, sp, dt, o) {
  p.ph += sp * dt * 1.7;
  const s = Math.sin(p.ph) * Math.min(sp / 3.5, 1.2) * .75;
  p.lL.rotation.x = s;
  p.lR.rotation.x = -s;
  p.aL.rotation.x = -s;
  p.aR.rotation.x = o.aim ? -1.5 - (o.kick || 0) * .4: s;
  if (o.air) {
    p.lL.rotation.x = -.7;
    p.lR.rotation.x = .3
  }
  if (o.crouch) {
    p.lL.rotation.x = -1;
    p.lR.rotation.x = -.4;
    p.t.position.y = .55;
    p.t.rotation.x = .25
  } else {
    p.t.position.y = .9;
    p.t.rotation.x = 0
  }
  if (p.gun)
    p.gun.visible = !!o.gun
  }
const pl = {
  pos: V3(-3, 0, 12),
  vx: 0,
  vz: 0,
  vy: 0,
  hp: 100,
  ar: 0,
  st: 100,
  ry: 0,
  w: 1,
  car: null,
  mg: [0,
  12,
  30],
  am: [0,
  60,
  150],
  o: 0,
  rel: 0,
  cd: 0,
  kick: 0,
  sh: 0,
  dead: false,
  g: true,
  fp: false,
  hc: 0,
  cc: 0,
  cdist: 5
};
const P = person(OUT[0][0], OUT[0][1]);
scene.add(P.g);
P.gun = bx(.08, .14, .45, 0x111111, 0, -.58, .18, P.aR);

/* ===== Veículos ===== */
const CT = {
  sport: {
    L: 4.3,
    W: 1.9,
    H: .55,
    C: .45,
    col: 0xd32f2f,
    ac: 26,
    mx: 46,
    gr: 5,
    br: 40,
    hp: 100
  },
  sedan: {
    L: 4.6,
    W: 1.8,
    H: .7,
    C: .6,
    col: 0x2f6fb5,
    ac: 16,
    mx: 32,
    gr: 7,
    br: 30,
    hp: 120
  },
  suv: {
    L: 4.8,
    W: 2,
    H: .95,
    C: .7,
    col: 0x3a3d40,
    ac: 15,
    mx: 30,
    gr: 7,
    br: 28,
    hp: 160
  },
  pickup: {
    L: 5.2,
    W: 2,
    H: .95,
    C: .55,
    col: 0xc9a227,
    ac: 14,
    mx: 28,
    gr: 6,
    br: 26,
    hp: 150
  },
  truck: {
    L: 7.5,
    W: 2.5,
    H: 2.8,
    C: 0,
    cab: 1,
    col: 0xe0e0e0,
    ac: 8,
    mx: 20,
    gr: 5,
    br: 20,
    hp: 300
  },
  bus: {
    L: 10,
    W: 2.6,
    H: 2.9,
    C: 0,
    band: 1,
    col: 0x2e9f6b,
    ac: 7,
    mx: 18,
    gr: 5,
    br: 18,
    hp: 300
  },
  bike: {
    L: 2.1,
    W: .6,
    H: .5,
    C: 0,
    two: 1,
    col: 0x111111,
    ac: 28,
    mx: 40,
    gr: 9,
    br: 34,
    hp: 50
  }
};
CT.police = Object.assign({}, CT.sedan, {
  col: 0x15151a, hp: 140, mx: 38, ac: 21
});
const gl = M(0x111a22, .1, .9), hlm = new THREE.MeshBasicMaterial({ color: 0xfff2b0 }), tlm = new THREE.MeshBasicMaterial({ color: 0xff2020 }), wm = M(0x151515, .9), DK = new THREE.Color(0x111111);
let cars = [];
/* medidas da cabine (vidros) de cada modelo; props.js usa o mesmo cálculo p/ posicionar o interior */
function cabSpec(T, t) {
  const v = t == 'van' || t == 'ambulance', S = ({
    sport: [.26, .24], porsche: [.26, .24], fusca: [.15, .3], sedan: [.22, .2], police: [.22, .2], taxi: [.22, .2],
    suv: [.1, .04], pickup: [.2, 0], saveiro: [.2, 0], van: [.1, .02], ambulance: [.06, 0]
  })[t] || [.18, .15];
  return { cw: T.W * .88, cL: T.L * (v ? .7 : .52), cz: -T.L * (v ? .1 : .04), sf: S[0], sr: S[1] }
}
function mkCar(t, x, z, yaw, o = {}) {
  const T = CT[t], wr = T.H > 1.6?.55: .38, g = new THREE.Group(), bd = new THREE.Group(), c = {
    T,
    t,
    hp: T.hp,
    mhp: T.hp,
    vel: V3(),
    yaw,
    st: 0,
    pv: 0,
    rad: T.W * .5 + T.L * .1,
    ws: [],
    fw: [],
    wr,
    g,
    bd,
    stk: 0,
    rv: 0,
    ... o
  };
  c.cm = M(o.col || T.col, .3, .6);
  c.base = new THREE.Color(c.cm.color);
  g.add(bd);
  c.pos = g.position;
  c.pos.set(x, 0, z);
  const ly = T.H > 1.6 ? wr + .55 : wr + T.H * .55, hx = T.W / 2;
  if (T.cab) {
    // caminhão: baú atrás, chassi escuro e cabine na frente (sem uma atravessar a outra)
    const cabL = 2.2, bauL = T.L - cabL - .2;
    bx(T.W, T.H, bauL, c.cm, 0, wr + T.H / 2, -T.L / 2 + bauL / 2, bd);
    bx(T.W * .8, .3, T.L * .98, 0x1c1c1f, 0, wr - .1, 0, bd);
    bx(T.W * .9, 1.5, .3, 0x1c1c1f, 0, wr + .8, T.L / 2 - cabL - .1, bd);
    bx(T.W * .95, 1.9, cabL, M(0xb03a2e), 0, wr + .95, T.L / 2 - cabL / 2, bd)
  } else
    bx(T.W, T.H, T.L, c.cm, 0, wr + T.H / 2, 0, bd);
  if (T.C) {
    // cabine em forma de trapézio: para-brisa e vidro traseiro inclinados, teto e coluna na cor do carro
    const S = cabSpec(T, t), g_ = new THREE.BoxGeometry(S.cw, T.C, S.cL), p_ = g_.attributes.position;
    for (let i = 0; i < p_.count; i++)
      if (p_.getY(i) > 0) {
        p_.setX(i, p_.getX(i) * .84);
        p_.setZ(i, p_.getZ(i) > 0 ? p_.getZ(i) - S.cL * S.sf: p_.getZ(i) + S.cL * S.sr)
      }
    g_.computeVertexNormals();
    const cab_ = new THREE.Mesh(g_, gl);
    cab_.position.set(0, wr + T.H + T.C / 2, S.cz);
    cab_.castShadow = true;
    bd.add(cab_);
    const rl = S.cL * (1 - S.sf - S.sr), roof = bx(S.cw * .84 + .05, .06, rl + .06, c.cm, 0, wr + T.H + T.C + .01, S.cz + S.cL * (S.sr - S.sf) / 2, bd);
    roof.userData.paint = 1;
    const ang_ = Math.atan2(S.cw / 2 * .16, T.C);
    for (const s of [-1, 1]) {
      const pil = bx(.07, T.C + .02, .1, c.cm, s * (S.cw / 2 * .92 + .015), wr + T.H + T.C / 2, S.cz, bd);
      pil.rotation.z = s * ang_;
      pil.userData.paint = 1
    }
  }
  if (!T.two && !T.cab)
    bx(T.W * .88, .22, T.L * .94, 0x141416, 0, wr - .1, 0, bd);
  if (T.band) {
    bx(T.W + .04, .9, T.L * .92, gl, 0, wr + T.H * .62, 0, bd);
    bx(T.W * .86, .9, .05, gl, 0, wr + T.H * .62, T.L / 2 + .005, bd);
    bx(T.W * .86, .9, .05, gl, 0, wr + T.H * .62, -T.L / 2 - .005, bd)
  }
  for (const s of [-1, 1]) {
    bx(T.W * .2, .14, .06, hlm, s * T.W * .32, ly, T.L / 2, bd);
    bx(T.W * .2, .14, .06, tlm, s * T.W * .32, ly, -T.L / 2, bd)
  }
  for (const[sx, sz] of T.two ? [[0, 1], [0, -1]]: [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const pv = new THREE.Group();
    pv.position.set(sx * (hx - .11), wr, sz * T.L * .32);   // roda recuada: a face externa fica rente à lataria, não pendurada pra fora
    const m = new THREE.Mesh(new THREE.CylinderGeometry(wr, wr, T.two?.2: .3, 12).rotateZ(PI / 2), wm);
    m.castShadow = true;
    pv.add(m);
    g.add(pv);
    c.ws.push(m);
    if (sz > 0)
      c.fw.push(pv)
    }
  if (o.cop)
    c.lb = [0, 1].map(i => bx(.5, .16, .3, new THREE.MeshBasicMaterial({ color: i ? 0x0044ff: 0xff0000 }), i?.4: -.4, wr + T.H + T.C + .08, 0, bd));
  g.rotation.y = yaw;
  scene.add(g);
  cars.push(c);
  return c
}
function dmg(c, a) {
  if (c.dead)
    return;
  c.hp -= a;
  c.cm.color.copy(c.base).lerp(DK, 1 - Math.max(c.hp, 0) / c.mhp);
  if (c.hp <= 0)
    boom(c)
  }
function boom(c) {
  c.dead = true;
  c.ai = null;
  explosion(c.pos);
  c.cm.color.setHex(0x1a1a1a);
  if (pl.car === c) {
    exitCar();
    hurt(35)
  }

}
function explosion(p) {
  for (let i = 0; i < 26; i++)
    emit(p.clone().add(V3(rr(-1, 1), rr(.5, 2), rr(-1, 1))), V3(rr(-6, 6), rr(2, 9), rr(-6, 6)), pk([0xff7a1a, 0xffc23a, 0xff4a0a]), rr(3, 6), rr(.5, 1), 6, -4);
  for (let i = 0; i < 18; i++)
    emit(p.clone().add(V3(0, 2, 0)), V3(rr(-3, 3), rr(3, 8), rr(-3, 3)), 0x222222, rr(3, 5), rr(1.5, 3), 5, 0);
  nz(1, .7, 500);
  shake = 1;
  for (const q of peds)
    if (!q.dead && q.pos.distanceTo(p) < 10)
      killPed(q, false);
  for (const c of cars)
    if (!c.dead && c.pos.distanceTo(p) < 9)
      dmg(c, 45);
  const d = pl.pos.distanceTo(p);
  if (d < 12 && !pl.dead)
    hurt((12 - d) * 4)
  }
function drive(c, thr, sT, hb, dt) {
  const T = c.T, fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
  let v = c.vel.x * fx + c.vel.z * fz;
  if (c.dead) {
    thr = 0;
    sT = 0;
    hb = true
  }
  if (thr > 0)
    v += (v < -.5 ? T.br: T.ac * (1 - cl(v / T.mx, 0, 1))) * dt * thr;
  else if (thr < 0) {
    if (v > .5)
      v -= T.br * dt;
    else
      v -= T.ac * .5 * dt * (1 - cl(-v / (T.mx * .3), 0, 1))
    } else
    v *= 1 - .5 * dt;
  if (hb)
    v *= 1 - 1.6 * dt;
  v = cl(v, -T.mx * .12, T.mx);
  c.st += (sT - c.st) * Math.min(1, dt * 7);
  c.yaw += c.st * dt * 2 * cl(v / 4, -1, 1) * (1 - .65 * cl(Math.abs(v) / (T.mx * .45), 0, 1));
  const k = Math.min(1, (hb ? 1.3: T.gr) * dt), nx = Math.sin(c.yaw), nz_ = Math.cos(c.yaw);
  c.vel.x += (nx * v - c.vel.x) * k;
  c.vel.z += (nz_ * v - c.vel.z) * k;
  c.pos.x += c.vel.x * dt;
  c.pos.z += c.vel.z * dt;
  if (Math.abs(c.vel.x * nz_ - c.vel.z * nx) > 3.5 && c.vel.length() > 6 && R2() < .6)
    emit(c.pos.clone().add(V3(rr(-1, 1), .3, rr(-1, 1))), V3(0, .6, 0), 0xcccccc, 1.2, .8, 2, .3)
  }
function updCar(c, dt) {
  const T = c.T, mine = pl.car === c;
  if (c.ai) {
    const a = c.ai, [dx, dz] = a.dir;
    let tv = a.tv;
    if ((dx ? phase != 0: phase == 0) && a.pd < -7 && a.pd > -18)
      tv = 0;
    const chk = (x, z, L) => {
      const rx = x - c.pos.x, rz = z - c.pos.z, ah = rx * dx + rz * dz;
      if (ah > 0 && ah < T.L / 2 + L + 6 && Math.abs(rx * dz - rz * dx) < 2.4)
        tv = Math.min(tv, ah < T.L / 2 + L + 2.5 ? 0: 3)
      };
    for (const o of cars)
      if (o !== c)
        chk(o.pos.x, o.pos.z, o.T.L / 2);
    if (!pl.car && !pl.dead)
      chk(pl.pos.x, pl.pos.z, .5);
    nav(a, 3.2, dt, tv);
    c.vel.set(a.dir[0] * a.sp, 0, a.dir[1] * a.sp);
    c.yaw += ang(c.yaw, Math.atan2(a.dir[0], a.dir[1])) * Math.min(1, dt * 5)
  } else {
    let thr = 0, sT = 0, hb = false;
    if (mine) {
      thr = (K.KeyW ? 1: 0) - (K.KeyS ? 1: 0);
      sT = (K.KeyA ? 1: 0) - (K.KeyD ? 1: 0);
      hb = !!K.Space
    } else if (c.drv) {
      const r = c.drv(c, dt);
      thr = r[0];
      sT = r[1];
      hb = r[2]
    } else if (c.cop && !c.dead) {
      if (wanted) {
  c.rm = 0;
  const ds = Math.hypot(pl.pos.x - c.pos.x, pl.pos.z - c.pos.z, pl.pos.y);
  if (ds < 20 && !pl.car && !pl.dead)
    hurt(4 * dt);
    c.drv2 = c.drv2 || window.SY.drvTo(() => pl.pos, 1, { stop: () => pl.car ? 0 : 8 });
  const r = c.drv2(c, dt);
  thr = r[0]; sT = r[1]; hb = r[2];
} else {
        c.rm = (c.rm || 0) + dt;
        if (c.rm > 8)
          c.del = true
        }

    }
    drive(c, thr, sT, hb, dt);
    for (const s of [1, -1]) {
      const o = T.L / 2 - T.W / 2, h = hitB(c.pos.x + Math.sin(c.yaw) * o * s, c.pos.z + Math.cos(c.yaw) * o * s, T.W / 2 + .1);
      if (h) {
        c.pos.x += h[0];
        c.pos.z += h[1];
        const m = Math.hypot(h[0], h[1]) || 1, nx = h[0] / m, nz_ = h[1] / m, vn = c.vel.x * nx + c.vel.z * nz_;
        if (vn < 0) {
          c.vel.x -= nx * vn * 1.4;
          c.vel.z -= nz_ * vn * 1.4;
          if (vn < -3) {
            dmg(c, -vn * 2.2);
            for (let i = 0; i < 5; i++)
              emit(c.pos.clone().add(V3(0, .6, 0)), V3(rr(-4, 4), rr(1, 4), rr(-4, 4)), 0xffd27a, .3, .4, 0, -9);
            if (mine) {
              nz(.2, .4, 700);
              shake = Math.max(shake, .3)
            }

          }

        }

      }

    }
    c.pos.x = cl(c.pos.x, -900, 900);
    c.pos.z = cl(c.pos.z, -900, 440)
  }
  const sp = c.vel.length();
  if (sp > 3 && (mine || c.cop))
    for (const q of peds)
      if (!q.dead && q.pos.distanceTo(c.pos) < T.L * .35 + .6)
        killPed(q, mine);
  c.g.rotation.y = c.yaw;
  const vf = c.vel.x * Math.sin(c.yaw) + c.vel.z * Math.cos(c.yaw), acc = (vf - c.pv) / Math.max(dt, .001);
  c.pv = vf;
  c.bd.rotation.x += (cl(-acc * .0035, -.08, .08) - c.bd.rotation.x) * Math.min(1, dt * 6);
  c.bd.rotation.z += (c.st * cl(vf / 30, -1, 1) * .07 - c.bd.rotation.z) * Math.min(1, dt * 6);
  for (const w of c.ws)
    w.rotation.x += vf * dt / c.wr;
  for (const w of c.fw)
    w.rotation.y = c.st * .45;
  if ((c.dead && R2() < .4) || (c.hp < c.mhp * .4 && R2() < .25))
    emit(c.pos.clone().add(V3(0, 1.2, 0)), V3(rr(-.5, .5), 2, rr(-.5, .5)), c.dead ? 0x333333: 0xdddddd, 1.5, 1.4, 3, 1);
  if (c.lb) {
    const f = Math.floor(clock * 6) % 2;
    c.lb[0].material.color.setHex(f ? 0xff0000: 0x330000);
    c.lb[1].material.color.setHex(f ? 0x000033: 0x0055ff)
  }
  if (mine) {
    pl.pos.copy(c.pos);
    pl.ry = c.yaw;
    if (T.two) {
      P.g.visible = true;
      P.g.position.set(c.pos.x, .25, c.pos.z);
      P.g.rotation.y = c.yaw;
      anim(P, 0, dt, { crouch: 1 })
    }
    if (eng) {
      eng.frequency.value = 38 + sp * 4.5;
      engG.gain.value = mute ? 0: .05
    }

  }
  c.g.visible = c.pos.distanceToSquared(cam.position) < 62500
}
function pairs() {
  for (let i = 0; i < cars.length; i++)
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
    if (a.ai && b.ai)
      continue;
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, s = a.rad + b.rad;
    if (Math.abs(dx) > s || Math.abs(dz) > s)
      continue;
    const d = Math.hypot(dx, dz);
    if (d < s && d > .01) {
      const nx = dx / d, nz_ = dz / d, ov = (s - d) / 2;
      a.pos.x -= nx * ov;
      a.pos.z -= nz_ * ov;
      b.pos.x += nx * ov;
      b.pos.z += nz_ * ov;
      const vn = (b.vel.x - a.vel.x) * nx + (b.vel.z - a.vel.z) * nz_;
      if (vn < 0) {
        a.vel.x += nx * vn * .6;
        a.vel.z += nz_ * vn * .6;
        b.vel.x -= nx * vn * .6;
        b.vel.z -= nz_ * vn * .6;
        const imp = -vn;
        if (imp > 3) {
          dmg(a, imp * 2);
          dmg(b, imp * 2);
          emit(a.pos.clone().add(V3(nx * a.rad, .7, nz_ * a.rad)), V3(rr(-3, 3), 2, rr(-3, 3)), 0xffd27a, .5, .4, 0, -9);
          if (imp > 5) {
            a.ai = null;
            b.ai = null
          }
          if (pl.car === a || pl.car === b) {
            nz(.2, .4, 700);
            shake = Math.max(shake, .3);
            if ((a.cop || b.cop) && imp > 6 && pl.cc <= 0) {
              crime(1);
              pl.cc = 3
            }

          }

        }

      }

    }

  }

}

/* ===== Tráfego, semáforos e pedestres (navegação em grade) ===== */
let phase = 0, clock = 0, TD = 9;
function lane(off) {
  const ax = R2() < .5, k = Math.floor(rr(-N / 2, N / 2 + 1)) * B, a = rr(-H + 14, H - 14), s = R2() < .5 ? 1: -1;
  return ax ? {
    x: a,
    z: k + s * off,
    d: [s,
    0]
  }: {
    x: k - s * off,
    z: a,
    d: [0,
    s]
  }
}
function pd0(e) {
  const a = e.dir[0] ? e.pos.x: e.pos.z, m = Math.round(a / B);
  e.pd = (a - m * B) * (e.dir[0] || e.dir[1])
}
function nav(e, off, dt, tv) {
  const[dx, dz] = e.dir, p = e.pos;
  e.sp += (tv - e.sp) * Math.min(1, dt * 3);
  p.x += dx * e.sp * dt;
  p.z += dz * e.sp * dt;
  const k = Math.min(1, dt * 4);
  if (dx)
    p.z += (Math.round(p.z / B) * B + dx * off - p.z) * k;
  else
    p.x += (Math.round(p.x / B) * B - dz * off - p.x) * k;
  const a = dx ? p.x: p.z, m = Math.round(a / B), d = (a - m * B) * (dx || dz);
  if (e.pd < 0 && d >= 0 && Math.abs(m) <= N / 2) {
    const ix = Math.round(p.x / B), iz = Math.round(p.z / B), o = [[dx, dz], [dz, -dx], [-dz, dx]].filter(v => Math.abs(ix + v[0]) <= N / 2 && Math.abs(iz + v[1]) <= N / 2);
    e.dir = (o.some(v => v[0] == dx && v[1] == dz) && R2() < .6) ? [dx, dz]: o.length ? pk(o): [-dx, -dz];
    e.pd = 1;
    return
  }
  e.pd = d
}
const TT = ['sedan', 'sedan', 'suv', 'sport', 'pickup', 'bus', 'truck', 'bike', 'sedan'], CC = [0x2f6fb5, 0x7a7a7a, 0xeeeeee, 0x222222, 0xb22222, 0x2e8b57, 0xe0a82e, 0x6a4c93];
function traffic() {
  const l = lane(3.2);
  if (Math.hypot(l.x - pl.pos.x, l.z - pl.pos.z) < 30)
    return;
  const t = pk(TT), c = mkCar(t, l.x, l.z, Math.atan2(l.d[0], l.d[1]), { col: pk(CC) });
  c.ai = {
    pos: c.pos,
    dir: l.d,
    sp: 0,
    tv: CT[t].mx * rr(.22, .3),
    pd: 0
  };
  pd0(c.ai)
}
function parked() {
  const l = lane(7);
  mkCar(pk(['sedan', 'suv', 'sport', 'pickup', 'sedan']), l.x, l.z, Math.atan2(l.d[0], l.d[1]), { col: pk(CC) })
}
const peds = [];
function mkPed() {
  const pp = person(pk(SH), pk(PA)), l = lane(9.5), q = {
    pp,
    g: pp.g,
    pos: pp.g.position,
    dir: l.d,
    sp: 1.4,
    pd: 0,
    hp: 60,
    dead: false,
    pan: 0,
    rt: 0
  };
  q.pos.set(l.x, 0, l.z);
  pd0(q);
  scene.add(q.g);
  peds.push(q)
}
function hurtPed(q, d, by) {
  if (q.dead)
    return;
  q.hp -= d;
  q.pan = 8;
  for (let i = 0; i < 5; i++)
    emit(V3(q.pos.x, 1.2, q.pos.z), V3(rr(-2, 2), rr(0, 3), rr(-2, 2)), 0xaa0000, .3, .5, 0, -8);
  if (q.hp <= 0)
    killPed(q, by)
  }
function killPed(q, by) {
  if (q.dead)
    return;
  q.dead = true;
  q.rt = 14;
  q.g.rotation.x = -1.5;
  q.g.position.y = .2;
  if (by) {
    crime(1);
    const m = Math.floor(rr(15, 90));
    S.money += m;
    msg('+R$' + m)
  }

}

/* ===== Combate, polícia e jogador ===== */
const WP = [{ n: 'Punhos', rate: .45, mag: 0 }, {
  n: 'Pistola',
  dmg: 34,
  rate: .28,
  mag: 12,
  sp: .008
}, {
  n: 'SMG',
  dmg: 16,
  rate: .09,
  mag: 30,
  sp: .03
}];
const dv = V3(), tr = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffe9a0 }));
tr.frustumCulled = false;
tr.visible = false;
scene.add(tr);
let wanted = 0, cool = 0, spT = 0, trT = 0, shake = 0, msgT = 0;
function msg(t) {
  $('msg').textContent = t;
  msgT = 3
}
function crime(n) {
  wanted = Math.min(5, wanted + n);
  cool = 0;
  msg('Procurado!')
}
function hurt(a) {
  if (pl.dead)
    return;
  if (pl.ar > 0) {
    const x = Math.min(pl.ar, a);
    pl.ar -= x;
    a -= x
  }
  pl.hp -= a;
  shake = Math.max(shake, .15);
  if (pl.hp <= 0)
    die()
  }
function die() {
  pl.dead = true;
  if (pl.car)
    exitCar();
  $('dead').style.opacity = 1;
  setTimeout(respawn, 3500)
}
function respawn() {
  pl.hp = 100;
  pl.ar = 0;
  pl.dead = false;
  pl.pos.set(4, 0, -12);
  pl.vx = pl.vz = 0;
  wanted = 0;
  S.money = Math.max(0, S.money - 300);
  for (const c of cars)
    if (c.cop)
      c.del = true;
  $('dead').style.opacity = 0;
  save()
}
function reload() {
  const p = pl;
  if (p.w && p.rel <= 0 && p.mg[p.w] < WP[p.w].mag && p.am[p.w] > 0)
    p.rel = 1.4
  }
function shoot() {
  const p = pl, W = WP[p.w];
  if (p.cd > 0 || p.rel > 0 || p.dead || p.car)
    return;
  p.cd = W.rate;
  p.sh = .9;
  if (!p.w) {
    p.kick = 1;
    for (const q of peds)
      if (!q.dead && Math.hypot(q.pos.x - p.pos.x - Math.sin(p.ry) * 1.1, q.pos.z - p.pos.z - Math.cos(p.ry) * 1.1) < 1.2)
        hurtPed(q, 25, true);
    return
  }
  if (!p.mg[p.w]) {
    reload();
    return
  }
  p.mg[p.w]--;
  p.kick = 1;
  nz(.14, .35, 2400);
  cam.getWorldDirection(dv);
  dv.x += rr(-1, 1) * W.sp;
  dv.y += rr(-1, 1) * W.sp;
  dv.z += rr(-1, 1) * W.sp;
  dv.normalize();
  const q = V3();
  let end = null;
  for (let t = p.cdist + .8; t < 130; t += .5) {
    q.copy(cam.position).addScaledVector(dv, t);
    if (q.y <= 0 || inB(q.x, q.y, q.z)) {
      end = q.clone();
      for (let i = 0; i < 4; i++)
        emit(q, V3(rr(-3, 3), rr(1, 5), rr(-3, 3)), 0xffd27a, .25, .4, 0, -9);
      break
    }
    let h = 0;
    for (const e of peds)
      if (!e.dead && Math.abs(e.pos.x - q.x) < .45 && Math.abs(e.pos.z - q.z) < .45 && q.y < 1.9) {
        hurtPed(e, W.dmg, true);
      h = 1;
      break
    }
    if (!h)
      for (const c of cars) {
        const dx = q.x - c.pos.x, dz = q.z - c.pos.z;
      if (Math.abs(dx) > 6 || Math.abs(dz) > 6)
        continue;
      const al = dx * Math.sin(c.yaw) + dz * Math.cos(c.yaw), sd = dx * Math.cos(c.yaw) - dz * Math.sin(c.yaw);
      if (Math.abs(al) < c.T.L / 2 && Math.abs(sd) < c.T.W / 2 && q.y < c.wr + c.T.H + c.T.C + .3) {
        dmg(c, W.dmg * .7);
        if (c.cop)
          crime(2);
        for (let i = 0; i < 4; i++)
          emit(q, V3(rr(-3, 3), rr(1, 5), rr(-3, 3)), 0xffd27a, .25, .4, 0, -9);
        h = 1;
        break
      }

    }
    if (h) {
      end = q.clone();
      break
    }

  }
  const m = p.pos.clone();
  m.y += 1.3;
  m.addScaledVector(dv, .7);
  emit(m, V3(), 0xffe08a, 1.3, .06, 0, 0);
  tr.geometry.setFromPoints([m, end || cam.position.clone().addScaledVector(dv, 130)]);
  tr.visible = true;
  trT = .05;
  for (const e of peds)
    if (e.pos.distanceTo(p.pos) < 30)
      e.pan = 8
    }
function enterCar() {
  let b = null, bd = 5;
  for (const c of cars)
    if (!c.dead && !c.cop) {
      const d = Math.hypot(c.pos.x - pl.pos.x, c.pos.z - pl.pos.z);
    if (d < bd) {
      bd = d;
      b = c
    }

  }
  if (b) {
    pl.car = b;
    b.ai = null;
    P.g.visible = !!b.T.two
  }

}
function exitCar() {
  const c = pl.car;
  if (!c)
    return;
  pl.pos.copy(c.pos);
  const o = c.T.W / 2 + 1;
  for (const s of [1, -1]) {
    const x = c.pos.x + Math.cos(c.yaw) * o * s, z = c.pos.z - Math.sin(c.yaw) * o * s;
    if (!hitB(x, z, .5)) {
      pl.pos.set(x, 0, z);
      break
    }

  }
  pl.car = null;
  P.g.visible = !pl.fp;
  pl.vx = pl.vz = 0;
  if (engG)
    engG.gain.value = 0
  }
function updPlayer(dt) {
  const p = pl;
  p.cd -= dt;
  p.sh -= dt;
  p.kick *= .85;
  p.hc -= dt;
  p.cc -= dt;
  if (p.rel > 0) {
    p.rel -= dt;
    if (p.rel <= 0) {
      const w = WP[p.w], n = Math.min(w.mag - p.mg[p.w], p.am[p.w]);
      p.mg[p.w] += n;
      p.am[p.w] -= n
    }

  }
  if (p.dead || p.car)
    return;
  const sy = Math.sin(cy), co = Math.cos(cy), fw = (K.KeyW ? 1: 0) - (K.KeyS ? 1: 0), rt = (K.KeyD ? 1: 0) - (K.KeyA ? 1: 0), aim = MB.r && p.w > 0, mv = fw || rt;
  const spr = K.ShiftLeft && fw > 0 && p.st > 2 && !aim && !K.KeyC;
  let sp = spr ? 8.5: K.KeyC ? 2: aim ? 2.6: 4.2;
  let tx = sy * fw - co * rt, tz = co * fw + sy * rt;
  const l = Math.hypot(tx, tz) || 1;
  tx = mv ? tx / l * sp: 0;
  tz = mv ? tz / l * sp: 0;
  const k = Math.min(1, dt * 10);
  p.vx += (tx - p.vx) * k;
  p.vz += (tz - p.vz) * k;
  p.st = cl(p.st + (spr ? -18: 12) * dt, 0, 100);
  if (K.Space && p.g) {
    p.vy = 8.5;
    p.g = false;
    p.st = Math.max(0, p.st - 6)
  }
  p.vy -= 26 * dt;
  const fy = p.fyf ? p.fyf(p.pos.x, p.pos.z, p.pos.y): 0;
  p.pos.y += p.vy * dt;
  if (p.pos.y <= fy) {
    p.pos.y = fy;
    p.vy = 0;
    p.g = true
  }
  p.pos.x += p.vx * dt;
  p.pos.z += p.vz * dt;
  for (let i = 0; i < 2; i++) {
    const h = hitB(p.pos.x, p.pos.z, .4, p.pos.y);
    if (h) {
      p.pos.x += h[0];
      p.pos.z += h[1]
    }

  }
  for (const c of cars) {
    if (c.pos.distanceToSquared(p.pos) > 100)
      continue;
    const o = c.T.L / 2 - c.T.W / 2;
    for (const s of [1, -1]) {
      const dx = p.pos.x - (c.pos.x + Math.sin(c.yaw) * o * s), dz = p.pos.z - (c.pos.z + Math.cos(c.yaw) * o * s), d = Math.hypot(dx, dz), r = c.T.W / 2 + .4;
      if (d < r && d > .01) {
        p.pos.x += dx / d * (r - d);
        p.pos.z += dz / d * (r - d);
        const v = c.vel.length();
        if (v > 4 && p.hc <= 0) {
          hurt(v * 2);
          p.hc = .5
        }

      }

    }

  }
  p.pos.x = cl(p.pos.x, -900, 900);
  p.pos.z = cl(p.pos.z, -900, 440);
  const spd = Math.hypot(p.vx, p.vz), st = aim || p.sh > 0, tg = (st || p.fp) ? cy: spd > .3 ? Math.atan2(p.vx, p.vz): p.ry;
  p.ry += ang(p.ry, tg) * Math.min(1, dt * 12);
  P.g.position.copy(p.pos);
  P.g.rotation.y = p.ry;
  P.g.visible = !p.fp;
  anim(P, spd, dt, {
    aim: st && p.w > 0, kick: p.kick, crouch: K.KeyC, air: !p.g, gun: p.w > 0
  });
  if (MB.l)
    shoot();
  if (engG)
    engG.gain.value = 0
  }
function copTick(dt) {
  const cs = cars.filter(c => c.cop && !c.dead);
  if (wanted) {
    spT -= dt;
    if (spT <= 0 && cs.length < wanted + 1) {
      spT = 3;
      const ix = cl(Math.round(pl.pos.x / B) + Math.floor(rr(-1, 2)), -N / 2, N / 2), z = cl(pl.pos.z + (R2() < .5 ? 1: -1) * rr(110, 170), -H + 10, H - 10), x = ix * B + 3.5;
      if (Math.hypot(x - pl.pos.x, z - pl.pos.z) > 90)
        mkCar('police', x, z, Math.atan2(pl.pos.x - x, pl.pos.z - z), { cop: 1 })
      }
    cool = cs.some(c => c.pos.distanceTo(pl.pos) < 80) ? 0: cool + dt;
    if (cool > 12) {
      wanted--;
      cool = 0;
      msg(wanted ? 'Fugindo da polícia…': 'Você despistou a polícia')
    }

  } else
    cool = 0;
  if (sirG) {
    const near = wanted && cs.some(c => c.pos.distanceTo(pl.pos) < 120);
    sirG.gain.value = near && !mute?.025: 0;
    sir.frequency.value = 700 + 260 * Math.sin(clock * 7)
  }

}

/* ===== Itens coletáveis ===== */
const pks = [];
function placePick(k) {
  const l = lane(9.5);
  k.m.position.set(l.x, 1, l.z);
  k.m.visible = true;
  k.rt = 0
}
function mkPick(t) {
  const col = t == 'h' ? 0x2ecc71: t == 'a' ? 0x3498db: 0xf1c40f, m = new THREE.Mesh(new THREE.BoxGeometry(.55, .55, .55), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .6 }));
  scene.add(m);
  const k = { t, m, rt: 0 };
  placePick(k);
  pks.push(k)
}
function updPicks(dt) {
  for (const k of pks) {
    if (k.rt > 0) {
      k.rt -= dt;
      if (k.rt <= 0)
        placePick(k);
      continue
    }
    k.m.rotation.y += dt * 2;
    k.m.position.y = 1 + Math.sin(clock * 3) * .12;
    if (Math.hypot(k.m.position.x - pl.pos.x, k.m.position.z - pl.pos.z) < 1.8 && !pl.dead) {
      if (k.t == 'h') {
        if (pl.hp >= 100)
          continue;
        pl.hp = Math.min(100, pl.hp + 40)
      } else if (k.t == 'a') {
        if (pl.ar >= 100)
          continue;
        pl.ar = Math.min(100, pl.ar + 50)
      } else {
        const m = Math.floor(rr(80, 400));
        S.money += m;
        msg('+R$' + m)
      }
      k.m.visible = false;
      k.rt = 60;
      bp(880, .15)
    }

  }

}

/* ===== Entrada, câmera e HUD ===== */
const K = {}, MB = {}, cv = $('c');
let run = false, drag = false, lastMouse = 0, cy = 0, cp = .2, zoom = 5;
addEventListener('keydown', e => {
  if (e.code == 'Space' || e.code == 'Tab')
    e.preventDefault();
  if (!run)
    return;
  K[e.code] = true;
  if (e.repeat)
    return;
  const c = e.code;
  if (c == 'KeyF' && !pl.dead)
    pl.car ? exitCar(): enterCar();
  if (c == 'KeyR')
    reload();
  if (c == 'KeyV') {
    pl.o = (pl.o + 1) % OUT.length;
    P.sm.color.setHex(OUT[pl.o][0]);
    P.pm.color.setHex(OUT[pl.o][1])
  }
  if (c == 'KeyP' && !pl.car)
    pl.fp = !pl.fp;
  if (c == 'KeyM') {
    mute = !mute;
    msg(mute ? 'Som desligado': 'Som ligado')
  }

});
addEventListener('keyup', e => {
  K[e.code] = false
});
addEventListener('mousedown', e => {
  if (!run)
    return;
  if (e.button == 0)
    MB.l = 1;
  if (e.button == 2)
    MB.r = 1;
  drag = true
});
addEventListener('mouseup', e => {
  if (e.button == 0)
    MB.l = 0;
  if (e.button == 2)
    MB.r = 0;
  drag = false
});
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('wheel', e => {
  zoom = cl(zoom + e.deltaY * .004, 2.2, 10)
});
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === cv || (drag && run)) {
    cy -= e.movementX * .0023;
    cp = cl(cp + e.movementY * .0023, -.6, 1.25);
    lastMouse = performance.now()
  }

});
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === cv) {
    run = true;
    $('menu').style.display = 'none'
  } else {
    run = false;
    $('menu').style.display = 'grid';
    for (const k in K)
      K[k] = false;
    MB.l = MB.r = 0;
    save()
  }

});
$('q').value = S.q;
$('q').onchange = e => {
  S.q = +e.target.value;
  applyQ();
  save()
};
$('go').onclick = () => {
  initA();
  cv.requestPointerLock();
  setTimeout(() => {
    if (!document.pointerLockElement) {
      run = true;
      $('menu').style.display = 'none'
    }

  }, 400)
};
function updCam(dt) {
  const c = pl.car, aim = MB.r && !c && pl.w > 0 && !pl.dead, fp = pl.fp && !c;
  if (c && performance.now() - lastMouse > 1200) {
    cy += ang(cy, c.yaw) * Math.min(1, dt * 2.5);
    cp += (.22 - cp) * Math.min(1, dt * 2)
  }
  const sy = Math.sin(cy), co = Math.cos(cy), cpp = Math.cos(cp), f = V3(sy * cpp, -Math.sin(cp), co * cpp), r = V3(-co, 0, sy), cs = c ? c.vel.length(): 0;
  const dist = c ? c.T.L * .5 + 5.5 + Math.min(cs * .06, 3): aim ? 2.3: zoom, tg = (c ? c.pos: pl.pos).clone();
  tg.y += c ? c.T.H + 1.4: 1.55;
  if (aim)
    tg.addScaledVector(r, .75);
  const fov = c ? 66 + Math.min(cs, 50) * .4: aim ? 50: 65;
  cam.fov += (fov - cam.fov) * Math.min(1, dt * 6);
  cam.updateProjectionMatrix();
  if (fp) {
    cam.position.set(pl.pos.x, pl.pos.y + 1.65, pl.pos.z);
    pl.cdist = 0
  } else {
    let d = dist;
    const q = V3();
    for (; d > .6; d -= .3) {
      q.copy(tg).addScaledVector(f, -d);
      if (q.y > .4 && !inB(q.x, q.y, q.z))
        break
      }
    q.copy(tg).addScaledVector(f, -d);
    q.y = Math.max(q.y, .4);
    cam.position.lerp(q, 1 - Math.exp(-dt * 18));
    pl.cdist = cam.position.distanceTo(tg)
  }
  if (shake > 0) {
    cam.position.x += rr(-1, 1) * shake * .3;
    cam.position.y += rr(-1, 1) * shake * .3;
    shake = Math.max(0, shake - dt * 2)
  }
  cam.lookAt(cam.position.x + f.x, cam.position.y + f.y, cam.position.z + f.z)
}
const mm = $('mm').getContext('2d');
function mini() {
  const W = 170, h = 85, s = .42, px = pl.pos.x, pz = pl.pos.z, sy = Math.sin(cy), co = Math.cos(cy);
  const pt = (x, z) => {
    const dx = x - px, dz = z - pz;
    return [h + (-dx * co + dz * sy) * s, h - (dx * sy + dz * co) * s]
  };
  mm.fillStyle = '#2b2d31';
  mm.fillRect(0, 0, W, W);
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const cx = (i - N / 2 + .5) * B, cz = (j - N / 2 + .5) * B;
    if (Math.abs(cx - px) > 260 || Math.abs(cz - pz) > 260)
      continue;
    mm.fillStyle = park[i][j] ? '#3f7a3a': '#6d7075';
    mm.beginPath();
    [[-24, -24], [24, -24], [24, 24], [-24, 24]].forEach(([a, b], n) => {
      const q = pt(cx + a, cz + b);
      n ? mm.lineTo(q[0], q[1]): mm.moveTo(q[0], q[1])
    });
    mm.fill()
  }
  for (const c of cars) {
    if (c === pl.car)
      continue;
    const q = pt(c.pos.x, c.pos.z);
    if (q[0] < 0 || q[0] > W || q[1] < 0 || q[1] > W)
      continue;
    mm.fillStyle = c.cop ? (Math.floor(clock * 4) % 2 ? '#f33': '#39f'): '#cfd2d6';
    mm.fillRect(q[0] - 2, q[1] - 2, 4, 4)
  }
  mm.save();
  mm.translate(h, h);
  mm.rotate(cy - pl.ry);
  mm.fillStyle = '#fff';
  mm.beginPath();
  mm.moveTo(0, -7);
  mm.lineTo(5, 6);
  mm.lineTo(-5, 6);
  mm.fill();
  mm.restore()
}
function hud() {
  const p = pl;
  $('bh').style.width = cl(p.hp, 0, 100) + '%';
  $('ba').style.width = cl(p.ar, 0, 100) + '%';
  $('bs').style.width = p.st + '%';
  $('money').textContent = 'R$' + Math.floor(S.money);
  $('stars').textContent = '★'.repeat(wanted) + '☆'.repeat(5 - wanted);
  $('wp').textContent = p.car ? '': WP[p.w].n + (p.w ? '  ' + p.mg[p.w] + ' / ' + p.am[p.w] + (p.rel > 0 ? '  (recarregando)': ''): '');
  $('spd').textContent = p.car ? Math.round(p.car.vel.length() * 3.6) + ' km/h': '';
  $('clk').textContent = String(Math.floor(TD)).padStart(2, '0') + ':' + String(Math.floor(TD % 1 * 60)).padStart(2, '0');
  let pr = '';
  if (p.car)
    pr = 'F — sair do veículo';
  else if (cars.some(c => !c.dead && !c.cop && Math.hypot(c.pos.x - p.pos.x, c.pos.z - p.pos.z) < 5))
    pr = 'F — entrar no veículo';
  $('pr').textContent = pr;
  $('ch').style.display = (MB.r && !p.car && p.w > 0) || (p.fp && !p.car) ? 'block': 'none';
  if (msgT > 0) {
    msgT -= 1 / 60;
    if (msgT <= 0)
      $('msg').textContent = ''
    }

}

/* ===== Ciclo dia/noite ===== */
const cN = new THREE.Color(0x03050c), cD = new THREE.Color(0x87b5e8), cS = new THREE.Color(0xff8f5a), col = new THREE.Color(), sd = V3(), ld = V3(), hl = new THREE.SpotLight(0xfff2cc, 0, 70, .5, .5);
scene.background = col;
scene.add(hl, hl.target);
function sky() {
  const a = (TD - 6) / 12 * PI, e = Math.sin(a), d = cl(e * 4 + .35, 0, 1), du = cl(1 - Math.abs(e) * 5, 0, 1);
  sd.set(Math.cos(a) * .85, e, .45).normalize();
  ld.set(sd.x, Math.max(Math.abs(sd.y), .25), sd.z).normalize();
  col.copy(cN).lerp(cD, d).lerp(cS, du * .55);
  scene.fog.color.copy(col);
  sun.position.copy(pl.pos).addScaledVector(ld, 300);
  sun.target.position.copy(pl.pos);
  sun.intensity = e > 0 ? cl(e * 3, .15, 1.1): .18;
  sun.color.setHex(e < 0 ? 0x8fa8ff: du > .3 ? 0xffa868: 0xfff2d8);
  hemi.intensity = .14 + .55 * d;
  bm.emissiveIntensity = 1 - d;
  lampM.color.setHex(d < .55 ? 0xffe29a: 0x1a1a1a);
  stars.material.opacity = 1 - d;
  stars.position.copy(cam.position);
  sunM.position.copy(cam.position).addScaledVector(sd, 1000);
  sunM.visible = e > -.05;
  cloudM.color.setScalar(.12 + .88 * d);
  const c = pl.car;
  if (c) {
    const f = V3(Math.sin(c.yaw), 0, Math.cos(c.yaw));
    hl.position.copy(c.pos).addScaledVector(f, c.T.L / 2).add(V3(0, .9, 0));
    hl.target.position.copy(hl.position).addScaledVector(f, 20);
    hl.intensity = (1 - d) * 2.5
  } else
    hl.intensity = 0
  }

/* ===== Laço principal ===== */
function update(dt) {
  clock += dt;
  TD = (TD + dt / 45) % 24;
  phase = Math.floor(clock / 10) % 2;
  mSX.color.setHex(phase == 0 ? 0x22ff55: 0xff2222);
  mSZ.color.setHex(phase == 0 ? 0xff2222: 0x22ff55);
  sky();
  updPlayer(dt);
  for (const c of cars)
    updCar(c, dt);
  pairs();
  cars = cars.filter(c => {
    if (c.del) {
      scene.remove(c.g);
      return false
    }
    return true
  });
  copTick(dt);
  for (const q of peds) {
    const d2 = q.pos.distanceToSquared(pl.pos);
    if (q.dead) {
      q.rt -= dt;
      if (q.rt <= 0) {
        const l = lane(9.5);
        q.pos.set(l.x, 0, l.z);
        q.dir = l.d;
        pd0(q);
        q.hp = 60;
        q.dead = false;
        q.g.rotation.set(0, 0, 0)
      }
      continue
    }
    q.pan = Math.max(0, q.pan - dt);
    nav(q, 9.5, dt, q.pan > 0 ? 5.5: 1.4);
    q.g.rotation.y = Math.atan2(q.dir[0], q.dir[1]);
    q.g.visible = d2 < 28900;
    if (q.g.visible)
      anim(q.pp, q.sp, dt, {})
    }
  updPicks(dt);
  for (const s of PS)
    if (s.l > 0) {
      s.l -= dt;
    if (s.l <= 0) {
      s.visible = false;
      continue
    }
    s.position.addScaledVector(s.v, dt);
    s.v.y += s.gv * dt;
    const u = 1 - s.l / s.L;
    s.scale.setScalar(s.sz + s.gr * u);
    s.material.opacity = (1 - u) * .9
  }
  if (trT > 0) {
    trT -= dt;
    if (trT <= 0)
      tr.visible = false
    }
  for (const c of clouds) {
    c.position.x += dt * 3;
    if (c.position.x > 1100)
      c.position.x = -1100
    }
  waveT.offset.x += dt * .01;
  waveT.offset.y += dt * .006;
  updCam(dt);
  hud();
  mini()
}
let last = performance.now(), acc = 0, fr = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const raw = (now - last) / 1000;
  last = now;
  const dt = Math.min(raw, .05);
  if (run) {
    try { update(dt); } catch (e) { console.error(e); if (!window._E) { window._E = 1; msg('ERRO: ' + e.message); } }
    acc += raw;
    fr++;
    if (acc > 2) {
      const f = fr / acc;
      if (f < 32 && scl > .5) {
        scl = Math.max(.5, scl - .1);
        setRes()
      } else if (f > 58 && scl < 1) {
        scl = Math.min(1, scl + .05);
        setRes()
      }
      acc = fr = 0
    }

  }
  R.render(scene, cam)
}

/* ===== População inicial ===== */
mkCar('sport', -6, 18, 0, { col: 0xd32f2f });
  // carro inicial, perto do jogador
for (let i = 0; i < 36; i++)
  traffic();
for (let i = 0; i < 22; i++)
  parked();
for (let i = 0; i < 40; i++)
  mkPed();
for (const t of ['h', 'h', 'h', 'h', 'h', 'a', 'a', 'a', 'a', '$', '$', '$', '$', '$', '$'])
  mkPick(t);
setInterval(save, 5000);
applyQ();
cam.aspect = innerWidth / innerHeight;
cam.updateProjectionMatrix();
sky();
updCam(1);
loop(performance.now());