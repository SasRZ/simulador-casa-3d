// Cocina. La memoria dice que se entrega SIN muebles: esto es la distribución que dibuja
// el plano de la promotora (frente norte con fregadero bajo la ventana, frente este con
// placa, frente sur con frigorífico y columnas). Se muestra u oculta desde el panel.
import * as THREE from 'three';
import { CFG } from './config.js';
import { box } from './helpers.js';

export function buildKitchen(ctx) {
  const { M, G } = ctx;
  const K = CFG.kitchen, g = G.kitchen;
  const top = K.baseH + K.counterT;
  const front = M.cabinet, body = M.cabinetBody;

  // Tramo de muebles bajos: rectángulo en planta + lado del frente
  const base = (x0, z0, x1, z1, frontSide) => {
    g.add(box(x0, 0.10, z0, x1, K.baseH, z1, front));
    g.add(box(x0, K.baseH, z0, x1, top, z1, M.worktop));
    // zócalo retranqueado
    const r = 0.06, s = frontSide;
    g.add(box(s === 'w' ? x0 + r : x0, 0, s === 'n' ? z0 + r : z0, s === 'e' ? x1 - r : x1, 0.10, s === 's' ? z1 - r : z1, M.cabinetDark));
    ctx.colliders.push({ x0, z0, x1, z1 });
  };
  const upper = (x0, z0, x1, z1) => g.add(box(x0, K.upperBottom, z0, x1, K.upperTop, z1, front));
  const tall = (x0, z0, x1, z1) => { g.add(box(x0, 0, z0, x1, K.tallH, z1, front)); ctx.colliders.push({ x0, z0, x1, z1 }); };
  const splash = (x0, z0, x1, z1) => g.add(box(x0, top, z0, x1, K.upperBottom, z1, M.tileKitchen));

  // ---- Frente norte (z 14,754..15,35): fregadero bajo la ventana (x 8,125..9,327)
  base(7.527, 14.754, 10.13, 15.35, 's');
  splash(7.527, 14.754, 10.726, 14.77);
  upper(7.527, 14.754, 8.10, 14.754 + K.upperDepth);
  upper(9.35, 14.754, 10.13, 14.754 + K.upperDepth);
  g.add(box(8.42, top - 0.17, 14.85, 9.02, top + 0.002, 15.25, M.inoxDark));   // seno
  g.add(box(8.70, top, 14.80, 8.74, top + 0.30, 14.84, M.chrome), box(8.70, top + 0.27, 14.80, 8.74, top + 0.30, 15.0, M.chrome));
  // lavavajillas (frente inox) junto al fregadero
  g.add(box(9.05, 0.12, 15.33, 9.65, K.baseH - 0.02, 15.36, M.inox));

  // ---- Frente este (x 10,13..10,726): placa y campana; ventana z 17,466..18,165
  base(10.13, 15.35, 10.726, 19.47, 'w');
  splash(10.71, 15.35, 10.726, 19.47);
  g.add(box(10.18, top, 16.60, 10.68, top + 0.006, 17.20, M.hob));             // placa de inducción
  g.add(box(10.30, 1.60, 16.55, 10.726, 1.75, 17.25, M.inox));                // campana
  g.add(box(10.45, 1.75, 16.80, 10.70, CFG.H.lowCeiling, 17.00, M.inox));
  upper(10.726 - K.upperDepth, 15.35, 10.726, 16.45);
  upper(10.726 - K.upperDepth, 18.25, 10.726, 19.47);
  g.add(box(10.20, 0.12, 16.62, 10.70, 0.80, 16.64, M.blackGlass));            // horno bajo la placa

  // ---- Frente sur (z 19,474..20,075): frigorífico y columna + bajos con altos
  tall(9.90, 19.474, 10.726, 20.075);                                          // columna frigorífico
  g.add(box(9.92, 0.05, 19.46, 10.70, K.tallH - 0.05, 19.475, M.inox));
  base(7.527, 19.474, 9.90, 20.075, 'n');
  splash(7.527, 20.06, 9.90, 20.075);
  upper(7.527, 20.075 - K.upperDepth, 9.90, 20.075);
}

// Isla opcional (propuesta): 0,90 × 1,80 m en el centro de la cocina, con 3 taburetes hacia el salón.
// Deja 0,83 m de paso hasta la placa (frente este) y 1,6 m al norte y al sur.
export function buildIsland(ctx) {
  const { M, G } = ctx;
  const K = CFG.kitchen, top = K.baseH + K.counterT;
  const g = new THREE.Group(); g.name = 'isla'; g.visible = false; G.structure.add(g); G.island = g;
  const x0 = 8.40, x1 = 9.30, z0 = 16.50, z1 = 18.30;
  g.add(box(x0 + 0.05, 0.10, z0 + 0.05, x1, K.baseH, z1 - 0.05, M.cabinet));      // cuerpo (frente hacia la cocina)
  g.add(box(x0 + 0.08, 0, z0 + 0.08, x1 - 0.06, 0.10, z1 - 0.08, M.cabinetDark)); // zócalo
  g.add(box(x0 - 0.25, K.baseH, z0, x1, top, z1, M.worktop));                     // encimera con vuelo de 25 cm para la barra
  // taburetes
  const seat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.6 });
  [16.90, 17.40, 17.90].forEach((z) => {
    const st = new THREE.Group(); st.position.set(8.02, 0, z); g.add(st);
    const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.05, 20), seat); s1.position.y = 0.66; st.add(s1);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.64, 8), M.window); l.position.set(a * 0.12, 0.32, b * 0.12); l.rotation.z = -a * 0.08; l.rotation.x = b * 0.08; st.add(l); });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.008, 6, 20), M.window); ring.rotation.x = Math.PI / 2; ring.position.y = 0.25; st.add(ring);
    st.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  });
  ctx.dynColliders.push({ box: { x0: 7.82, z0, x1, z1 }, fn: () => g.visible });
  ctx.setIsland = (on) => { g.visible = on; };
}
