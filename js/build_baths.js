// Baños 1 y 2 y aseo exterior: sanitarios en la posición del plano.
// Memoria: plato de ducha de resina blanco, inodoro blanco, lavabo de Krion blanco
// (doble seno con encimera de Krion en el baño 1), grifería cromada.
import * as THREE from 'three';
import { box } from './helpers.js';

const ROT = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };

// Grupo local: el "frente" mira a +z local; se gira según face ('s' = mira hacia +z del plano)
function place(G, x, z, face, build) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ROT[face]; build(g); G.add(g); return g;
}
const add = (g, ...ms) => ms.forEach((m) => g.add(m));

function toilet(M) {
  return (g) => {
    add(g,
      box(-0.18, 0.0, -0.33, 0.18, 0.40, 0.25, M.ceramic),          // taza (suspendida visualmente)
      box(-0.19, 0.40, -0.33, 0.19, 0.43, 0.27, M.ceramic),         // tapa
      box(-0.20, 0.40, -0.36, 0.20, 0.80, -0.20, M.ceramic),        // cisterna
      box(-0.05, 0.80, -0.30, 0.05, 0.81, -0.24, M.chrome));        // pulsador
  };
}
function bidet(M) {
  return (g) => add(g, box(-0.18, 0.0, -0.33, 0.18, 0.40, 0.22, M.ceramic), box(-0.02, 0.40, -0.30, 0.02, 0.52, -0.24, M.chrome));
}
function basin(M, w, d, double = false) {
  return (g) => {
    // mueble suspendido + encimera de Krion con seno(s)
    add(g, box(-w / 2, 0.30, -d / 2, w / 2, 0.82, d / 2, M.cabinet), box(-w / 2, 0.82, -d / 2, w / 2, 0.86, d / 2, M.ceramic));
    const n = double ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const cx = double ? (i ? w / 4 : -w / 4) : 0;
      add(g, box(cx - 0.2, 0.862, -0.12, cx + 0.2, 0.866, 0.15, M.inoxDark));
      add(g, box(cx - 0.015, 0.86, -d / 2 + 0.04, cx + 0.015, 1.06, -d / 2 + 0.07, M.chrome), box(cx - 0.015, 1.03, -d / 2 + 0.04, cx + 0.015, 1.06, -d / 2 + 0.2, M.chrome));
      // espejo
      add(g, box(cx - 0.35, 1.15, -d / 2 - 0.002, cx + 0.35, 1.95, -d / 2 + 0.01, M.mirror));
    }
  };
}

function shower(G, M, x0, z0, x1, z1, openSide) {
  // plato de resina blanco (3 cm) y mampara de vidrio en el lado abierto
  G.add(box(x0, 0, z0, x1, 0.03, z1, M.resin));
  const h = 2.0, t = 0.01;
  const glass = M.glass;
  const scr = { e: [x1 - t, z0, x1, z0 + (z1 - z0) * 0.65], w: [x0, z0, x0 + t, z0 + (z1 - z0) * 0.65], n: [x0, z0, x0 + (x1 - x0) * 0.6, z0 + t], s: [x0, z1 - t, x0 + (x1 - x0) * 0.6, z1] }[openSide];
  const pane = box(scr[0], 0.03, scr[1], scr[2], h, scr[3], glass); pane.castShadow = false; G.add(pane);
  // rociador
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const wallSide = { e: [x0 + 0.03, cz], w: [x1 - 0.03, cz], n: [cx, z1 - 0.03], s: [cx, z0 + 0.03] }[openSide];
  G.add(box(wallSide[0] - 0.012, 0.9, wallSide[1] - 0.012, wallSide[0] + 0.012, 1.95, wallSide[1] + 0.012, M.chrome));
}

export function buildBaths(ctx) {
  const { M, G } = ctx;
  M.resin = M.resin || new THREE.MeshStandardMaterial({ color: 0xf7f6f3, roughness: 0.7 });
  M.mirror = M.mirror || new THREE.MeshStandardMaterial({ color: 0xdfe6ea, roughness: 0.02, metalness: 1.0 });
  const B = G.baths;

  // ---- Baño 2 (x 2,175..5,226 · z 21,115..22,716): ducha al oeste, inodoro y bidé, lavabo al este
  shower(B, M, 2.175, 21.115, 2.98, 22.716, 'e');
  place(B, 3.41, 21.115 + 0.36, 's', toilet(M));
  place(B, 4.01, 21.115 + 0.33, 's', bidet(M));
  place(B, 4.83, 21.115 + 0.225, 's', basin(M, 0.78, 0.45));

  // ---- Baño 1 (en suite, x 2,175..5,226 · z 22,816..24,417): lavabo doble de Krion, ducha al este
  place(B, 3.63, 22.816 + 0.225, 's', basin(M, 1.40, 0.45, true));
  shower(B, M, 4.43, 22.816, 5.226, 24.417, 'w');
  place(B, 2.175 + 0.36, 23.55, 'e', toilet(M));

  // ---- Aseo exterior (x 0,056..1,905 · z 15,76..18,112): ducha al sur, lavabo al este
  shower(B, M, 0.29, 17.36, 1.905, 18.112, 'n');
  place(B, 1.905 - 0.225, 16.16, 'w', basin(M, 0.70, 0.45));
  place(B, 1.905 - 0.36, 16.95, 'w', toilet(M));

  // colisiones de los sanitarios
  [[2.175, 21.115, 2.98, 22.716], [3.2, 21.115, 5.226, 21.6], [2.93, 22.816, 4.33, 23.27], [4.43, 22.816, 5.226, 24.417], [2.175, 23.3, 2.75, 23.8],
    [0.29, 17.36, 1.905, 18.112], [1.45, 15.76, 1.905, 17.2]].forEach(([x0, z0, x1, z1]) => ctx.colliders.push({ x0, z0, x1, z1 }));
}
