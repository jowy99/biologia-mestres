// Prototip «La cèl·lula en 3D»: cèl·lula animal i vegetal fetes amb geometria (sense models externs).
// Es pot girar, tallar amb un pla i tocar cada orgànul; les fitxes surten de tema-08/dades.js.
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

const D = window.DADES;
const stage = document.getElementById('stage'), canvas = document.getElementById('c3d');
const info = document.getElementById('info'), chipsBox = document.getElementById('parts'), hint = document.getElementById('hint');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
catch (e) { stage.classList.add('no-gl'); stage.innerHTML = '<p class="muted">Aquest navegador no pot mostrar gràfics 3D (WebGL).</p>'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.localClippingEnabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
const HOME = new THREE.Vector3(6.5, 3.2, 7.5).normalize();
// Col·loca la càmera a la distància justa perquè la cèl·lula ompli el visor (també en vertical)
function fit() {
  const v = THREE.MathUtils.degToRad(camera.fov), h = 2 * Math.atan(Math.tan(v / 2) * camera.aspect);
  camera.position.copy(HOME).multiplyScalar((kind === 'vegetal' ? 3.7 : 2.95) / Math.sin(Math.min(v, h) / 2));
}
camera.position.copy(HOME).multiplyScalar(10);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: true, dampingFactor: .08, minDistance: 3, maxDistance: 18, enablePan: false, autoRotate: !still, autoRotateSpeed: .7 });

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7fa8, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(5, 8, 6); scene.add(sun);
const rim = new THREE.DirectionalLight(0xc9d4ff, 1.2); rim.position.set(-6, -2, -5); scene.add(rim);

// Pla de tall: es conserva el que queda a x ≤ constant
const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10);
// Colors inspirats en la tinció hematoxilina-eosina: nucli violeta, membrana rosada
const COLORS = {
  membrana: '#e58aa8', nucli: '#6b5bd6', nucleol: '#3b2f8f', rer: '#4fb3bf', rel: '#8fd3c7', golgi: '#f2b84b',
  mitocondri: '#f07a4a', lisosoma: '#b04fa8', vacuol: '#9cc9f0', ribosomes: '#4a4e69', citoesquelet: '#9aa0b8',
  cloroplast: '#3f9a4a', grana: '#1f5f2a', vacuolc: '#b8d8f5', paretv: '#a8c46a', plasmodesmes: '#6d8a2c'
};
const OPAC = { membrana: .18, paretv: .26, nucli: .6, vacuolc: .32, vacuol: .5, citoesquelet: .55, cloroplast: .85 };
const SHELLS = new Set(['membrana', 'paretv']);

let cell = new THREE.Group(); scene.add(cell);
let parts = {}, cache = {}, sel = null, intro = 1, kind = 'animal';
const goal = new THREE.Vector3();

// Nombres aleatoris amb llavor: la cèl·lula surt sempre igual
const seeded = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
let R = seeded(3);
const between = (a, b) => a + (b - a) * R();
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function M(key) {
  if (cache[key]) return cache[key];
  const o = OPAC[key] ?? 1;
  const m = new THREE.MeshPhysicalMaterial({
    color: COLORS[key], roughness: .42, clearcoat: .5, clearcoatRoughness: .35, sheen: .4, sheenColor: new THREE.Color(0xffffff),
    transparent: true, opacity: o, depthWrite: o > .9, side: o < .9 ? THREE.DoubleSide : THREE.FrontSide, clippingPlanes: [clip]
  });
  m.userData.base = o;
  return (cache[key] = m);
}
function add(key, mesh, parent = cell) {
  mesh.userData.part = key;
  parent.add(mesh);
  const p = parts[key] ||= { meshes: [], mats: new Set() };
  p.meshes.push(mesh); p.mats.add(mesh.material);
  return mesh;
}
const spin = m => { m.rotation.set(R() * 6.28, R() * 6.28, R() * 6.28); return m; };
function inside(test) {
  for (let i = 0; i < 500; i++) { const v = V(between(-3.4, 3.4), between(-2.2, 2.2), between(-2.2, 2.2)); if (test(v)) return v; }
  return V(0, 0, 0);
}

// Esfera deformada (formes orgàniques)
function blob(r, amp, seed) {
  const g = new THREE.SphereGeometry(r, 72, 54), a = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < a.count; i++) {
    v.fromBufferAttribute(a, i);
    const n = v.clone().normalize();
    const k = 1 + amp * (Math.sin(n.x * 3.1 + seed) * Math.sin(n.y * 2.7 + seed * 1.7) + .6 * Math.sin(n.z * 4.3 + seed * .6));
    a.setXYZ(i, v.x * k, v.y * k, v.z * k);
  }
  g.computeVertexNormals();
  return g;
}
// Capsa arrodonida (superel·lipsoide): paret i membrana de la cèl·lula vegetal
function roundBox(w, h, d, p = .28) {
  const g = new THREE.SphereGeometry(1, 96, 64), a = g.attributes.position;
  const f = t => Math.sign(t) * Math.abs(t) ** p;
  for (let i = 0; i < a.count; i++) a.setXYZ(i, f(a.getX(i)) * w / 2, f(a.getY(i)) * h / 2, f(a.getZ(i)) * d / 2);
  g.computeVertexNormals();
  return g;
}
function dots(key, pts, r, matKey = key) {
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 8, 6), M(matKey), pts.length);
  const m4 = new THREE.Matrix4();
  pts.forEach((p, i) => im.setMatrixAt(i, m4.makeTranslation(p.x, p.y, p.z)));
  im.computeBoundingSphere();
  return add(key, im);
}
// Reticle rugós: làmines corbades al voltant del nucli, plenes de ribosomes
function reticle(center, r0, n) {
  const ribo = [], p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const r = r0 + i * .15, arc = between(2, 2.8);
    const t = add('rer', new THREE.Mesh(new THREE.TorusGeometry(r, .05, 8, 72, arc), M('rer')));
    t.position.copy(center); t.rotation.set(between(-.5, .5), between(-.5, .5), between(0, 6.28)); t.updateMatrix();
    for (let k = 0; k < 26; k++) { const a = between(0, arc), rr = r + between(-.07, .07); ribo.push(p.set(rr * Math.cos(a), rr * Math.sin(a), between(-.06, .06)).applyMatrix4(t.matrix).clone()); }
  }
  dots('rer', ribo, .028, 'ribosomes');
}
function rel(center, n, spread) {
  for (let i = 0; i < n; i++) {
    const pts = Array.from({ length: 5 }, () => center.clone().add(V(between(-spread, spread), between(-spread, spread), between(-spread, spread))));
    add('rel', new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, .055, 8), M('rel')));
  }
}
function golgi(pos, s = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const t = add('golgi', new THREE.Mesh(new THREE.TorusGeometry((.62 - i * .05) * s, .06 * s, 10, 48, 2.4), M('golgi')), g);
    t.position.z = i * .14 * s; t.rotation.z = -1.2;
  }
  for (let i = 0; i < 5; i++) {
    const a = -1.2 + (i % 2 ? 2.55 : -.15), r = (.62 + between(.05, .2)) * s;
    add('golgi', new THREE.Mesh(new THREE.SphereGeometry(.075 * s, 16, 12), M('golgi')), g).position.set(r * Math.cos(a), r * Math.sin(a), between(0, .55) * s);
  }
  g.position.copy(pos); g.rotation.set(between(0, 6.28), between(0, 6.28), 0);
  cell.add(g);
}
function fibers(n, from, test) {
  for (let i = 0; i < n; i++) {
    const d = V(between(-1, 1), between(-1, 1), between(-1, 1)).normalize();
    const pts = [];
    for (let k = 0; k < 6; k++) { const p = from.clone().add(d.clone().multiplyScalar(1.1 + k * .4)).add(V(between(-.15, .15), between(-.15, .15), between(-.15, .15))); if (test(p)) pts.push(p); }
    if (pts.length >= 3) add('citoesquelet', new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, .014, 5), M('citoesquelet')));
  }
}
const sphere = (key, r, pos) => { const m = add(key, new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), M(key))); m.position.copy(pos); return m; };

function buildAnimal() {
  const N = V(-.45, .15, 0);
  const shell = v => (v.x / 2.55) ** 2 + (v.y / 2.15) ** 2 + (v.z / 2.45) ** 2 < 1;
  const free = (v, d = 1.45) => shell(v) && v.distanceTo(N) > d;
  add('membrana', new THREE.Mesh(blob(3, .035, 1.3), M('membrana'))).scale.set(1, .86, .96);
  add('nucli', new THREE.Mesh(blob(.95, .03, 2), M('nucli'))).position.copy(N);
  sphere('nucleol', .34, N.clone().add(V(.22, .18, .12)));
  reticle(N, 1.2, 5);
  rel(V(1.1, -.9, -.7), 5, .7);
  golgi(V(1.35, .7, .55));
  for (let i = 0; i < 8; i++) spin(add('mitocondri', new THREE.Mesh(new THREE.CapsuleGeometry(.17, .5, 8, 16), M('mitocondri')))).position.copy(inside(v => free(v, 1.75)));
  for (let i = 0; i < 6; i++) sphere('lisosoma', .13, inside(v => free(v, 1.6)));
  for (let i = 0; i < 4; i++) sphere('vacuol', .2, inside(v => free(v, 1.6)));
  dots('ribosomes', Array.from({ length: 260 }, () => inside(v => free(v, 1.25))), .03);
  fibers(16, N, shell);
}
function buildVegetal() {
  const N = V(-2.35, .85, .85), C = V(.45, -.1, 0);
  const box = v => Math.abs(v.x) < 3.1 && Math.abs(v.y) < 1.85 && Math.abs(v.z) < 1.85;
  const vac = v => ((v.x - C.x) / 2.55) ** 2 + ((v.y - C.y) / 1.55) ** 2 + ((v.z - C.z) / 1.55) ** 2 < 1;
  const free = (v, d = 1) => box(v) && !vac(v) && v.distanceTo(N) > d;
  add('paretv', new THREE.Mesh(roundBox(7.4, 4.8, 4.8), M('paretv')));
  add('membrana', new THREE.Mesh(roundBox(7, 4.4, 4.4), M('membrana')));
  for (let i = 0; i < 6; i++) {
    const m = add('plasmodesmes', new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .6, 12), M('plasmodesmes')));
    m.rotation.z = Math.PI / 2; m.position.set(i % 2 ? 3.6 : -3.6, between(-1.5, 1.5), between(-1.5, 1.5));
  }
  const vc = add('vacuolc', new THREE.Mesh(blob(1, .04, 3), M('vacuolc'))); vc.position.copy(C); vc.scale.set(2.5, 1.5, 1.5);
  add('nucli', new THREE.Mesh(blob(.65, .03, 2), M('nucli'))).position.copy(N);
  sphere('nucleol', .23, N.clone().add(V(.15, .12, .08)));
  reticle(N, .82, 3);
  golgi(V(-1.9, -1.15, -1), .8);
  for (let i = 0; i < 12; i++) {
    const c = spin(add('cloroplast', new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), M('cloroplast'))));
    c.scale.set(.46, .19, .29); c.position.copy(inside(v => free(v, 1.1)));
    for (let j = -1; j <= 1; j++) add('cloroplast', new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .9, 16), M('grana')), c).position.x = j * .5;
  }
  for (let i = 0; i < 5; i++) spin(add('mitocondri', new THREE.Mesh(new THREE.CapsuleGeometry(.15, .45, 8, 16), M('mitocondri')))).position.copy(inside(v => free(v, 1.1)));
  dots('ribosomes', Array.from({ length: 160 }, () => inside(v => free(v, .9))), .03);
  fibers(8, N, box);
}

function dispose() {
  cell.traverse(o => o.geometry?.dispose());
  Object.values(cache).forEach(m => m.dispose());
}
function build(type) {
  dispose(); scene.remove(cell);
  cell = new THREE.Group(); scene.add(cell);
  parts = {}; cache = {}; R = seeded(type === 'animal' ? 3 : 11); kind = type; fit();
  (type === 'animal' ? buildAnimal : buildVegetal)();
  intro = still ? 1 : 0;
  renderChips(); select(null);
}

// Selecció: l'orgànul triat brilla i la resta es tornen translúcids
function select(key) {
  sel = key;
  for (const [k, p] of Object.entries(parts)) for (const m of p.mats) {
    const base = m.userData.base, dim = key && k !== key && !SHELLS.has(k);
    m.opacity = dim ? Math.min(base, .14) : base;
    m.depthWrite = !dim && base > .9;
    m.emissive.set(k === key ? m.color : 0x000000);
    m.emissiveIntensity = k === key ? .35 : 0;
  }
  goal.set(0, 0, 0);
  if (key) { const b = new THREE.Box3(); parts[key].meshes.forEach(m => b.expandByObject(m)); b.getCenter(goal); }
  chipsBox.querySelectorAll('[data-part]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.part === key)));
  if (!key) { info.innerHTML = '<p class="muted">Toca un orgànul de la cèl·lula o tria\'l a la llista.</p>'; return; }
  const p = D.parts[key], [ch, sec] = p.s.split('.');
  info.innerHTML = `<button class="icon-btn tanca" type="button" aria-label="Tanca la fitxa">×</button><h2>${p.nom}</h2><p class="on">${p.on}</p><p>${p.txt}</p><p><a href="../tema-08/#teoria/${ch}/s${ch}-${sec}">Veure a la teoria §${p.s} →</a></p>`;
  info.querySelector('.tanca').addEventListener('click', () => select(null));
}
function renderChips() {
  chipsBox.innerHTML = Object.keys(D.parts).filter(k => parts[k]).map(k => `<button class="chip" type="button" data-part="${k}" aria-pressed="false"><i style="background:${COLORS[k]}"></i>${D.parts[k].nom}</button>`).join('');
}
chipsBox.addEventListener('click', e => { const b = e.target.closest('[data-part]'); if (b) select(sel === b.dataset.part ? null : b.dataset.part); });

// Tocar la cèl·lula (sense arrossegar) tria l'orgànul que hi ha sota el dit, ignorant el que queda tallat
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
const hideHint = () => hint.classList.add('off');
canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; hideHint(); });
canvas.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  const r = canvas.getBoundingClientRect();
  ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObject(cell, true).filter(h => h.object.userData.part && clip.distanceToPoint(h.point) >= 0);
  const pick = hits.find(h => !SHELLS.has(h.object.userData.part)) || hits[0];
  const key = pick ? pick.object.userData.part : null;
  select(key === sel ? null : key);
});

const gira = document.getElementById('gira');
const setSpin = on => { controls.autoRotate = on; gira.setAttribute('aria-pressed', String(on)); };
setSpin(!still);
controls.addEventListener('start', () => { setSpin(false); hideHint(); });
gira.addEventListener('click', () => setSpin(!controls.autoRotate));
document.getElementById('centra').addEventListener('click', () => { fit(); select(null); });
document.getElementById('tall').addEventListener('input', e => { clip.constant = 4.2 * (1 - e.target.value / 100); });
document.getElementById('tipus').addEventListener('click', e => {
  const b = e.target.closest('[data-type]'); if (!b) return;
  document.querySelectorAll('#tipus [data-type]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  build(b.dataset.type);
});

new ResizeObserver(() => {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = camera.aspect < 1 ? 50 : 38; camera.updateProjectionMatrix(); fit();
}).observe(stage);

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), .05);
  if (intro < 1) { intro = Math.min(1, intro + dt * 1.6); const s = 1 - (1 - intro) ** 3; cell.scale.setScalar(.55 + .45 * s); cell.rotation.y = (1 - s) * -1.2; }
  controls.target.lerp(goal, .08);
  controls.update(dt);
  renderer.render(scene, camera);
}
document.addEventListener('visibilitychange', () => renderer.setAnimationLoop(document.hidden ? null : frame));
build('animal');
renderer.setAnimationLoop(frame);
