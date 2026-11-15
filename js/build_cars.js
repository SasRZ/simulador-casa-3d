// Dos turismos aparcados en fila en la zona de aparcamiento, como los dibuja el plano
// de la promotora (morro hacia la casa). Modelo sencillo de unos 4,60 × 1,80 × 1,45 m.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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

export function buildCars(ctx) {
  const cars = CARS.map((c) => {
    const g = makeCar(c.color); g.position.set(c.x, 0, c.z); ctx.G.site.add(g);
    ctx.dynColliders.push({ box: { x0: c.x - W / 2, z0: c.z - L / 2, x1: c.x + W / 2, z1: c.z + L / 2 }, fn: () => g.visible });
    return g;
  });
  ctx.setCars = (n) => cars.forEach((g, i) => { g.visible = i < n; });
  ctx.setCars(2);
}
