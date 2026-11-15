// Vegetación opcional en los muros de la parcela (propuesta, no viene en la memoria):
//  · seto de arbustos tipo aligustre/pitosporo pegado a la cara interior de las medianeras
//  · trepadora (hiedra, jazmín o bignonia) cubriendo la cara interior
// El seto se recorta donde estorbaría: piscina, aparcamiento, tarima del porche, jardinera
// y volúmenes de la casa. En el lado del aparcamiento se pone trepadora (el seto quitaría el
// sitio para abrir las puertas del coche).
import * as THREE from 'three';
import { PARCEL as P, POOL, DRIVE, WOODLOOK, PLANTER } from './plan.js';

const WALL_H = 1.98, HEDGE_D = 0.55, HEDGE_H = 1.85, STEP = 0.5;

// tramos de medianera: punto de inicio, dirección (u) y normal hacia dentro (n)
const SEGMENTS = [
  { a: [P.x0, P.z0], b: [P.x1, P.z0], n: [0, 1] },          // fondo
  { a: [P.x1, P.z0], b: [P.x1, P.z1], n: [-1, 0] },         // lado derecho
  { a: [P.x0, P.z0], b: [P.x0, 15.484], n: [1, 0] },        // lado izquierdo (3 tramos)
  { a: [P.x0, 18.384], b: [P.x0, 25.097], n: [1, 0] },
  { a: [P.x0, 29.396], b: [P.x0, P.z1], n: [1, 0] },
];

function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }

function vineTexture(flower) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d'), r = rng(flower ? flower.length * 97 : 7);
  g.clearRect(0, 0, 256, 512);
  // borde superior irregular: las hojas no llegan todas a la albardilla
  const top = (x) => 18 + 14 * Math.sin(x * 0.07) + 10 * Math.sin(x * 0.19 + 1);
  g.fillStyle = '#2f4f24';
  g.beginPath(); g.moveTo(0, 512); for (let x = 0; x <= 256; x += 4) g.lineTo(x, top(x) + 10); g.lineTo(256, 512); g.fill();
  const greens = ['#3d6a2c', '#4b7d34', '#5a8f3c', '#2f5a25', '#6a9c45'];
  for (let i = 0; i < 2600; i++) {
    const x = r() * 256, y = r() * 512; if (y < top(x)) continue;
    g.fillStyle = greens[(r() * greens.length) | 0];
    g.beginPath(); g.ellipse(x, y, 4 + r() * 5, 3 + r() * 3, r() * Math.PI, 0, Math.PI * 2); g.fill();
  }
  if (flower) for (let i = 0; i < 260; i++) {
    const x = r() * 256, y = r() * 512; if (y < top(x) + 6) continue;
    g.fillStyle = flower; g.beginPath(); g.arc(x, y, 2 + r() * 2.5, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildGreenery(ctx) {
  const root = new THREE.Group(); root.name = 'vegetación muros'; ctx.G.site.add(root);
  const cop = POOL.coping + 0.3, Lmax = Math.max(...POOL.sizes.map((q) => q.L));
  const avoid = [
    [POOL.x0 - cop, POOL.z0 - cop, POOL.x0 + Lmax + cop, POOL.z1 + cop],
    DRIVE, ...WOODLOOK, PLANTER,
  ].map(([x0, z0, x1, z1]) => ({ x0, z0, x1, z1 }));
  const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
  const free = (b) => !avoid.some((o) => overlap(b, o)) && !ctx.colliders.some((o) => overlap(b, o));

  // ---------- seto ----------
  const hedge = new THREE.Group(); hedge.visible = false; root.add(hedge);
  const blobs = [], cores = [], runs = [], r = rng(11);
  for (const s of SEGMENTS) {
    const [ax, az] = s.a, [bx, bz] = s.b, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    let run = null;
    for (let d = 0.05; d < L - 0.05; d += STEP) {
      const e = Math.min(L - 0.05, d + STEP);
      const p0 = [ax + ux * d, az + uz * d], p1 = [ax + ux * e + s.n[0] * HEDGE_D, az + uz * e + s.n[1] * HEDGE_D];
      const b = { x0: Math.min(p0[0], p1[0]) + 0.001, z0: Math.min(p0[1], p1[1]) + 0.001, x1: Math.max(p0[0], p1[0]) - 0.001, z1: Math.max(p0[1], p1[1]) - 0.001 };
      if (!free(b)) { run = null; continue; }
      if (run) { run.x0 = Math.min(run.x0, b.x0); run.z0 = Math.min(run.z0, b.z0); run.x1 = Math.max(run.x1, b.x1); run.z1 = Math.max(run.z1, b.z1); }
      else { run = { ...b }; runs.push(run); }
      // hojas: 2 filas de fondo × 5 alturas por tramo de 0,5 m, con algo de desorden
      for (let k = 0; k < 2; k++) for (let h = 0; h < 5; h++) for (let q = 0; q < 2; q++) {
        const t = d + (q + 0.5) * (e - d) / 2 + (r() - 0.5) * 0.15, off = 0.16 + k * 0.22 + (r() - 0.5) * 0.08;
        const y = 0.25 + h * 0.36 + (r() - 0.5) * 0.12;
        if (y > HEDGE_H - 0.1) continue;
        blobs.push([ax + ux * t + s.n[0] * off, y, az + uz * t + s.n[1] * off, 0.17 + r() * 0.09, r()]);
      }
    }
  }
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
  const inst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), leafMat, blobs.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), col = new THREE.Color();
  const tones = [0x3f6b2e, 0x4c7d36, 0x365e28, 0x5a8a3e];
  blobs.forEach(([x, y, z, s, k], i) => {
    q.setFromEuler(e3.set(k * 3, k * 5, k * 7));
    m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s * 1.15, s, s * 1.1)); inst.setMatrixAt(i, m4);
    inst.setColorAt(i, col.setHex(tones[(k * tones.length) | 0]));
  });
  inst.castShadow = true; inst.receiveShadow = true; hedge.add(inst);
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x2c4a20, roughness: 1 });
  for (const b of runs) {
    const pad = 0.08, m = new THREE.Mesh(new THREE.BoxGeometry(b.x1 - b.x0 - pad, HEDGE_H - 0.15, b.z1 - b.z0 - pad), coreMat);
    m.position.set((b.x0 + b.x1) / 2, (HEDGE_H - 0.15) / 2, (b.z0 + b.z1) / 2); m.receiveShadow = true; hedge.add(m);
    ctx.dynColliders.push({ box: b, fn: () => hedge.visible });
  }

  // ---------- trepadoras ----------
  const vines = {};
  const FLOWERS = { hiedra: null, jazmin: '#f6f3e8', bignonia: '#e0612a' };
  for (const [id, fl] of Object.entries(FLOWERS)) {
    const tex = vineTexture(fl), grp = new THREE.Group(); grp.visible = false; root.add(grp); vines[id] = grp;
    for (const s of SEGMENTS) {
      const [ax, az] = s.a, [bx, bz] = s.b, L = Math.hypot(bx - ax, bz - az);
      const t = tex.clone(); t.needsUpdate = true; t.repeat.set(L / 1.0, 1);
      const mat = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 0.95, side: THREE.DoubleSide });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(L, WALL_H), mat);
      m.position.set((ax + bx) / 2 + s.n[0] * 0.065, WALL_H / 2, (az + bz) / 2 + s.n[1] * 0.065);
      m.rotation.y = Math.atan2(s.n[0], s.n[1]);
      m.receiveShadow = true; grp.add(m);
      // relieve: algunas matas sueltas sobre el muro
      const n = Math.round(L * 3), mi = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), leafMat, n), rr = rng(L * 100 | 0);
      for (let i = 0; i < n; i++) {
        const tt = rr() * L, y = 0.2 + rr() * (WALL_H - 0.35), sc = 0.07 + rr() * 0.07;
        m4.compose(new THREE.Vector3(ax + (bx - ax) * tt / L + s.n[0] * 0.08, y, az + (bz - az) * tt / L + s.n[1] * 0.08), q.setFromEuler(e3.set(rr() * 3, rr() * 3, 0)), new THREE.Vector3(sc, sc, sc * 0.6));
        mi.setMatrixAt(i, m4); mi.setColorAt(i, col.setHex(fl && rr() < 0.25 ? parseInt(fl.slice(1), 16) : tones[(rr() * tones.length) | 0]));
      }
      grp.add(mi);
    }
  }

  // modo: '' | seto | hiedra | jazmin | bignonia | seto_jazmin
  ctx.setWallPlants = (mode) => {
    hedge.visible = mode === 'seto' || mode === 'seto_jazmin';
    const vine = mode === 'seto_jazmin' ? 'jazmin' : FLOWERS[mode] !== undefined ? mode : mode === 'seto' ? 'hiedra' : null;
    for (const [id, g] of Object.entries(vines)) g.visible = id === vine;
  };
  ctx.setWallPlants('');
}
