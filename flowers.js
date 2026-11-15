// malar — hero garden made from real flower photographs.
// Each flower is a freely licensed photo shot on black (see flowers/credits.json),
// cut out by brightness and mapped onto a gently domed plane in 3D space.
// They bloom in, float, tilt toward the pointer, wobble when brushed,
// spin when tapped, and drift apart as you scroll.
import * as THREE from 'three';

const canvas = document.getElementById('garden');
const hero = document.getElementById('hero');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0, 12);
const world = new THREE.Group();
scene.add(world);

// Flowers reach in from the corners and sides toward the name.
// Positions are in screen fractions (-1..1 across the hero), so the
// composition holds on any screen shape.
// file, stem end (ax, ay), where the bloom should land (tx, ty), depth z, bloom position along the photo (0..1)
const LAYOUT = [
  ['rose-burgundy',          -1.06, -1.22, -0.60, -0.40,  0.4, 0.82],
  ['rose-mauve',              1.06, -1.22,  0.62, -0.38,  0.4, 0.82],
  ['lily-white',             -1.10,  1.25, -0.66,  0.46, -1.2, 0.70],
  ['orchid-cymbidium-pink',   1.12,  0.12,  0.32,  0.90, -1.2, 0.94],
  ['lily-red',               -1.28,  0.02, -0.84,  0.00,  0.9, 0.70],
  ['daylily-orange',          1.28, -0.24,  0.85, -0.10,  0.9, 0.80],
  ['lily-stargazer',         -0.40,  1.40, -0.26,  0.66, -0.6, 0.75],
  ['poppy-white',            -0.50, -1.28, -0.36, -0.66,  1.8, 0.85],
  ['poppy-red',               0.52, -1.28,  0.38, -0.64,  1.8, 0.85],
];

const loader = new THREE.TextureLoader();
const base = new URL('flowers/', document.baseURI);

// A plane subdivided and pushed forward in the middle, so the photo reads as
// a rounded bloom (not a flat card) when it tilts. Pivot is the bottom edge (stem end).
function domedPlane(w, bulge) {
  const g = new THREE.PlaneGeometry(w, 1, 40, 40);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2), y = p.getY(i) / 0.5;
    const r2 = Math.min(1, x * x + y * y);
    p.setZ(i, bulge * Math.pow(1 - r2, 1.5));
  }
  g.translate(0, 0.5, 0);
  g.computeVertexNormals();
  return g;
}

let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const flowers = LAYOUT.map(([file, ax, ay, tx, ty, z, headAt], i) => {
  const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.renderOrder = Math.round(z * 10) + 100;
  const group = new THREE.Group();
  group.add(mesh);
  world.add(group);
  const f = {
    group, mesh, a: new THREE.Vector2(ax, ay), tgt: new THREE.Vector2(tx, ty), z, headAt,
    anchor: new THREE.Vector3(), out: new THREE.Vector2(), angle: 0, h: 1,
    phase: rand() * Math.PI * 2, wobble: 0, bloomStart: 0.2 + i * 0.12, loaded: false, aspect: 1,
  };
  loader.load(new URL(file + '.webp', base).href, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const a = tex.image.width / tex.image.height;
    f.aspect = a;
    mesh.geometry.dispose();
    mesh.geometry = domedPlane(a, Math.min(a, 1) * 0.25);
    mat.map = tex;
    mat.needsUpdate = true;
    f.loaded = true;
    f.loadedAt = clock.elapsedTime;
  });
  return f;
});

// ---------- sizing: turn screen fractions into world positions ----------
let aspect = 1;
function resize() {
  const w = hero.clientWidth, h = hero.clientHeight;
  renderer.setSize(w, h, false);
  aspect = w / h;
  camera.aspect = aspect;
  camera.position.z = 12;
  camera.updateProjectionMatrix();
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  for (const f of flowers) {
    const halfH = (camera.position.z - f.z) * tanHalf, halfW = halfH * aspect;
    // on tall screens keep the blooms off the name by pulling targets toward the corners
    const tall = aspect < 1 ? 1 : 0;
    const tx = f.tgt.x * (tall ? 0.95 : 1), ty = tall ? Math.sign(f.tgt.y) * Math.min(Math.abs(f.tgt.y) * 1.35, 0.92) : f.tgt.y;
    f.anchor.set(f.a.x * halfW, f.a.y * halfH, f.z);
    const dx = tx * halfW - f.anchor.x, dy = ty * halfH - f.anchor.y;
    const len = Math.hypot(dx, dy);
    f.angle = Math.atan2(-dx, dy); // rotate the upright photo to point at the target
    f.h = Math.min(len / f.headAt, halfH * (tall ? 0.9 : 1.6));
    f.out.set(-dx / len, -dy / len); // direction back toward its corner
  }
}
window.addEventListener('resize', resize);
resize();

// ---------- interaction ----------
const pointer = new THREE.Vector2(0, 0), pointerSmooth = new THREE.Vector2(0, 0);
const tmp = new THREE.Vector3();
function near(f, r) {
  // test against the bloom, not the stem end
  f.mesh.localToWorld(tmp.set(0, f.headAt, 0)).project(camera);
  const dx = (tmp.x - pointer.x) * aspect, dy = tmp.y - pointer.y;
  const rr = (Math.min(f.h * f.aspect, f.h * 0.4)) / 7.5 * r;
  return dx * dx + dy * dy < rr * rr;
}
window.addEventListener('pointermove', (e) => {
  const r = hero.getBoundingClientRect();
  pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  for (const f of flowers) if (near(f, 0.9)) f.wobble = Math.min(1, f.wobble + 0.2);
});
hero.addEventListener('click', () => { for (const f of flowers) if (near(f, 1.1)) f.wobble = 1; });

let scrollP = 0;
window.addEventListener('scroll', () => { scrollP = Math.min(1, Math.max(0, window.scrollY / hero.clientHeight)); }, { passive: true });
let visible = true;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

// ---------- animation ----------
const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
const clock = new THREE.Clock();

function frame() {
  const t = clock.getElapsedTime();
  const motion = reduceMotion ? 0 : 1;
  pointerSmooth.lerp(pointer, 0.05);
  world.rotation.y = pointerSmooth.x * 0.05 * motion;
  world.rotation.x = -pointerSmooth.y * 0.035 * motion;

  for (const f of flowers) {
    if (!f.loaded) continue;
    // reach in: each stem grows out of its corner toward the name
    const k = reduceMotion ? 1 : ease((t - Math.max(f.bloomStart, f.loadedAt)) / 1.8);
    f.mesh.material.opacity = Math.min(1, k * 1.5);
    const reach = 0.35 + 0.65 * k;
    f.group.scale.setScalar(f.h * reach);

    // scrolling pulls each flower back toward its corner
    const back = scrollP * f.h * 0.6;
    f.group.position.set(
      f.anchor.x + f.out.x * back,
      f.anchor.y + f.out.y * back + Math.sin(t * 0.6 + f.phase) * 0.06 * motion,
      f.anchor.z,
    );
    f.wobble *= 0.95;
    const sway = Math.sin(t * 0.7 + f.phase) * 0.03 * motion + Math.sin(t * 10 + f.phase) * f.wobble * 0.06;
    // tilt the face toward the pointer so the domed photo catches some depth
    const toX = (pointerSmooth.x - f.anchor.x / 7) * 0.25 * motion;
    const toY = (pointerSmooth.y - f.anchor.y / 4) * 0.2 * motion;
    f.group.rotation.set(-toY, toX, f.angle + sway);
  }
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(() => { if (visible) frame(); });
document.documentElement.classList.add('garden-ready');
