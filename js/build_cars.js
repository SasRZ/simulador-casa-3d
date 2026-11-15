// Dos turismos aparcados en fila en la zona de aparcamiento, como los dibuja el plano
// de la promotora (morro hacia la casa). Modelo sencillo de unos 4,60 × 1,80 × 1,45 m.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PARCEL, POOL, PLANTER } from './plan.js';

const CARS = [
  { x: 14.85, z: 25.10, color: 0xb8bcc2 },   // gris plata (junto a la casa)
  { x: 14.85, z: 31.10, color: 0xf2f2ef },   // blanco (junto a la puerta)
];
const L = 4.60, W = 1.80, R = 0.33;

function makeCar(color) {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.32 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1b232b, metalness: 0.3, roughness: 0.12 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
  const rim = new THREE.MeshStandardMaterial({ color: 0x9a9da2, metalness: 0.8, roughness: 0.35 });
  const head = new THREE.MeshStandardMaterial({ color: 0xf4f4ee, emissive: 0x222222, roughness: 0.2 });
  const tail = new THREE.MeshStandardMaterial({ color: 0xa3141b, emissive: 0x2a0000, roughness: 0.3 });
  const rb = (w, h, d, r, mat, x, y, z) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m;
  };
  // carrocería: parte baja, capó (delante, z−) y maletero (detrás, z+)
  rb(W, 0.56, L, 0.14, paint, 0, 0.58, 0);
  rb(W - 0.04, 0.12, 1.20, 0.05, paint, 0, 0.88, -1.62).rotation.x = -0.06;
  // cabina acristalada y techo
  const cab = rb(W - 0.16, 0.56, 2.45, 0.12, glass, 0, 1.12, 0.25);
  cab.scale.set(1, 1, 1);
  rb(W - 0.20, 0.07, 2.05, 0.03, paint, 0, 1.415, 0.32);
  rb(0.06, 0.48, 0.10, 0.02, paint, W / 2 - 0.09, 1.12, 0.05);      // pilares B
  rb(0.06, 0.48, 0.10, 0.02, paint, -W / 2 + 0.09, 1.12, 0.05);
  // faros, pilotos, parachoques y retrovisores
  [-1, 1].forEach((s) => {
    rb(0.42, 0.10, 0.04, 0.02, head, s * 0.58, 0.74, -L / 2 + 0.005);
    rb(0.40, 0.10, 0.04, 0.02, tail, s * 0.60, 0.80, L / 2 - 0.005);
    rb(0.14, 0.09, 0.08, 0.02, paint, s * (W / 2 + 0.05), 1.00, -0.85);
  });
  rb(W - 0.10, 0.14, 0.06, 0.03, black, 0, 0.40, -L / 2 + 0.01);
  rb(W - 0.10, 0.14, 0.06, 0.03, black, 0, 0.42, L / 2 - 0.01);
  rb(0.70, 0.14, 0.03, 0.02, black, 0, 0.58, -L / 2 + 0.005);       // calandra
  // ruedas
  const tyre = new THREE.CylinderGeometry(R, R, 0.22, 24), hub = new THREE.CylinderGeometry(0.2, 0.2, 0.225, 16);
  [[-1, -1.42], [1, -1.42], [-1, 1.40], [1, 1.40]].forEach(([s, z]) => {
    const t = new THREE.Mesh(tyre, black); t.rotation.z = Math.PI / 2; t.position.set(s * (W / 2 - 0.12), R, z); t.castShadow = true; g.add(t);
    const h = new THREE.Mesh(hub, rim); h.rotation.z = Math.PI / 2; h.position.copy(t.position); h.position.x += s * 0.005; g.add(h);
  });
  return g;
}

// Posiciones rápidas: [x, z, giro] de cada coche (giro 0 = morro hacia la casa, 1 = 90º)
export const CAR_PRESETS = {
  plano: [[14.85, 25.10, 0], [14.85, 31.10, 0]],
  puerta: [[14.85, 29.00, 0], [14.85, 23.00, 0]],
  calle: [[14.85, 25.10, 0], [13.30, 37.60, 1]],
  dos_calle: [[9.80, 37.60, 1], [15.20, 37.60, 1]],
};

export function buildCars(ctx) {
  const state = CARS.map((c) => ({ x: c.x, z: c.z, rot: 0 }));
  const cop = POOL.coping, Lmax = Math.max(...POOL.sizes.map((q) => q.L));
  const fixed = [
    { x0: POOL.x0 - cop, z0: POOL.z0 - cop, x1: POOL.x0 + Lmax + cop, z1: POOL.z1 + cop },
    { x0: PLANTER[0], z0: PLANTER[1], x1: PLANTER[2], z1: PLANTER[3] },
  ];
  const boxOf = (st, out = {}) => {
    const hx = (st.rot % 2 ? L : W) / 2, hz = (st.rot % 2 ? W : L) / 2;
    return Object.assign(out, { x0: st.x - hx, z0: st.z - hz, x1: st.x + hx, z1: st.z + hz });
  };
  const cols = [];
  const cars = CARS.map((c, i) => {
    const g = makeCar(c.color); g.position.set(c.x, 0, c.z); g.userData.carIndex = i;
    g.traverse((o) => { o.userData.carIndex = i; });
    ctx.G.site.add(g);
    const col = { box: boxOf(state[i]), fn: () => g.visible, car: i };
    cols.push(col); ctx.dynColliders.push(col);
    return g;
  });
  const place = (i) => {
    const st = state[i], g = cars[i];
    g.position.set(st.x, 0, st.z); g.rotation.y = -st.rot * Math.PI / 2;
    boxOf(st, cols[i].box);
  };
  const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
  const fits = (i, st) => {
    const b = boxOf(st);
    const inside = b.x0 >= PARCEL.x0 && b.x1 <= PARCEL.x1 && b.z0 >= PARCEL.z0 && b.z1 <= PARCEL.z1;
    const street = b.z0 >= PARCEL.z1 + 0.3 && b.z1 <= PARCEL.z1 + 7 && b.x0 >= PARCEL.x0 - 2 && b.x1 <= PARCEL.x1 + 2;
    if (!inside && !street) return false;
    if (fixed.some((f) => overlap(b, f))) return false;
    if (ctx.colliders.some((c) => overlap(b, c))) return false;
    if (ctx.dynColliders.some((d) => d.car !== i && d.box && overlap(b, d.box) && (d.op ? d.op.blocking : d.fn ? d.fn() : true))) return false;
    return true;
  };
  ctx.cars = {
    state, last: 0,
    index: (o) => { while (o) { if (o.userData?.carIndex !== undefined && cars[o.userData.carIndex].visible) return o.userData.carIndex; o = o.parent; } return -1; },
    // mueve con deslizamiento: si no cabe, prueba solo en x o solo en z
    move(i, x, z) {
      const st = state[i]; this.last = i;
      for (const c of [{ x, z }, { x, z: st.z }, { x: st.x, z }]) if (fits(i, { ...st, ...c })) { Object.assign(st, c); break; }
      place(i);
    },
    rotate(i = this.last) {
      const st = state[i], n = { ...st, rot: (st.rot + 1) % 2 };
      if (!fits(i, n)) return false;
      Object.assign(st, n); place(i); return true;
    },
    preset(k) { const p = CAR_PRESETS[k]; if (!p) return; p.forEach(([x, z, rot], i) => { Object.assign(state[i], { x, z, rot }); place(i); }); },
  };
  ctx.setCars = (n) => cars.forEach((g, i) => { g.visible = i < n; });
  ctx.setCars(2);
}
