// Placas solares opcionales sobre la cubierta plana (propuesta, no viene en la memoria).
// Paneles de 1,72 × 1,13 m (≈ 450 W) en vertical, inclinados 30º y mirando al sur
// (en este plano el sur es la derecha, +x). Filas separadas para no darse sombra.
import * as THREE from 'three';
import { CFG } from './config.js';

const PW = 1.72, PD = 1.13, TILT = THREE.MathUtils.degToRad(30);

function cellsTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 384;
  const g = c.getContext('2d');
  g.fillStyle = '#16233a'; g.fillRect(0, 0, 256, 384);
  g.strokeStyle = 'rgba(170,185,205,0.55)'; g.lineWidth = 2;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo((i * 256) / 6, 0); g.lineTo((i * 256) / 6, 384); g.stroke(); }
  for (let j = 1; j < 10; j++) { g.beginPath(); g.moveTo(0, (j * 384) / 10); g.lineTo(256, (j * 384) / 10); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildSolar(ctx) {
  const { G } = ctx;
  const top = CFG.H.ceiling + CFG.H.slab + 0.05;
  const cell = new THREE.MeshStandardMaterial({ map: cellsTex(), roughness: 0.25, metalness: 0.3 });
  const frame = new THREE.MeshStandardMaterial({ color: 0xb9bcc0, roughness: 0.4, metalness: 0.7 });
  const H = PW * Math.sin(TILT), X = PW * Math.cos(TILT);

  const panel = (x, z) => {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.BoxGeometry(PW, 0.035, PD), [frame, frame, cell, frame, frame, frame]);
    p.position.set(x + X / 2, top + 0.12 + H / 2, z); p.rotation.z = -TILT; p.castShadow = p.receiveShadow = true; g.add(p);
    // soportes (trasero alto al norte del plano = izquierda, delantero bajo)
    for (const dz of [-PD / 2 + 0.1, PD / 2 - 0.1]) {
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.04, H + 0.12, 0.04), frame); back.position.set(x + 0.05, top + (H + 0.12) / 2, z + dz); g.add(back);
      const front = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), frame); front.position.set(x + X - 0.05, top + 0.06, z + dz); g.add(front);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(X, 0.04, 0.04), frame); rail.position.set(x + X / 2, top + 0.02, z + dz); g.add(rail);
    }
    return g;
  };

  // filas a lo largo de z (este-oeste real), con 2,7 m entre filas
  const layout = (rows, perRow) => {
    const grp = new THREE.Group();
    const z0 = 22.4 - (perRow * (PD + 0.02)) / 2 + PD / 2;
    rows.forEach((x) => { for (let i = 0; i < perRow; i++) grp.add(panel(x, z0 + i * (PD + 0.02))); });
    grp.visible = false; G.upper.add(grp); return grp;
  };
  const sets = {
    p10: layout([5.0, 7.7], 5),        // 10 placas ≈ 4,5 kWp
    p20: layout([2.6, 5.3, 8.0], 7),   // 21 placas ≈ 9,5 kWp
  };
  ctx.setSolar = (k) => Object.entries(sets).forEach(([id, g]) => { g.visible = id === k; });
}
