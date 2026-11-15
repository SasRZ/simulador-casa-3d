// Pérgola con toldo opcional sobre la zona de aparcamiento (propuesta: no viene en la memoria).
// Estructura de aluminio antracita a juego con las carpinterías; lona tensada con ligera
// pendiente hacia la medianera este, o lamas fijas de aluminio.
import * as THREE from 'three';
import { DRIVE } from './plan.js';
import { box } from './helpers.js';

const X0 = DRIVE[0] + 0.08, X1 = DRIVE[2] - 0.12;        // postes junto al paso y junto a la medianera
const Z_END = 33.80;                                       // deja libre la corredera de vehículos (z 34,18)
const LENGTHS = { uno: 5.6, dos: 12.0 };
const H_IN = 2.45, H_OUT = 2.30, POST = 0.12;               // altura libre lado casa / lado medianera

function canvasTex(color) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 4) { g.fillStyle = `rgba(0,0,0,${0.025 + (i % 16 === 0 ? 0.03 : 0)})`; g.fillRect(i, 0, 1, 256); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 6); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildCarport(ctx) {
  const { M, G } = ctx;
  const fabrics = {
    arena: new THREE.MeshStandardMaterial({ map: canvasTex('#d9c9a8'), roughness: 0.95, side: THREE.DoubleSide }),
    gris: new THREE.MeshStandardMaterial({ map: canvasTex('#6c6e70'), roughness: 0.95, side: THREE.DoubleSide }),
    blanco: new THREE.MeshStandardMaterial({ map: canvasTex('#f1efea'), roughness: 0.95, side: THREE.DoubleSide }),
  };
  const sets = {};
  for (const [len, L] of Object.entries(LENGTHS)) {
    const z0 = Z_END - L, z1 = Z_END;
    const grp = new THREE.Group(); grp.visible = false; G.site.add(grp);
    const fr = M.window;   // aluminio antracita
    // postes cada ~3 m a ambos lados
    const n = Math.max(2, Math.round(L / 3) + 1), posts = [];
    for (let i = 0; i < n; i++) {
      const z = z0 + (i * (L - POST)) / (n - 1);
      posts.push([X0, z, H_IN], [X1 - POST, z, H_OUT]);
    }
    posts.forEach(([x, z, h]) => grp.add(box(x, 0, z, x + POST, h, z + POST, fr)));
    // vigas longitudinales y travesaños
    grp.add(box(X0, H_IN, z0, X0 + POST, H_IN + 0.16, z1, fr));
    grp.add(box(X1 - POST, H_OUT, z0, X1, H_OUT + 0.16, z1, fr));
    const W = X1 - X0, slope = Math.atan2(H_IN - H_OUT, W);
    const cross = (z, t = 0.08) => {
      const b = box(-W / 2, -0.06, z - t / 2, W / 2, 0.06, z + t / 2, fr);
      b.position.x += (X0 + X1) / 2; b.position.y += (H_IN + H_OUT) / 2 + 0.16; b.rotation.z = -slope; return b;
    };
    for (let i = 0; i < n; i++) grp.add(cross(z0 + 0.06 + (i * (L - 0.12)) / (n - 1)));
    // cubierta: lona (3 colores) o lamas
    const covers = {};
    const roofY = (H_IN + H_OUT) / 2 + 0.24, span = Math.hypot(W, H_IN - H_OUT);
    for (const [k, mat] of Object.entries(fabrics)) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(span, L), mat);
      m.rotation.order = 'ZXY'; m.rotation.x = -Math.PI / 2; m.rotation.z = -slope;
      m.position.set((X0 + X1) / 2, roofY, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; m.visible = false;
      grp.add(m); covers[k] = m;
    }
    const slats = new THREE.Group(); slats.visible = false; grp.add(slats);
    for (let z = z0 + 0.15; z < z1 - 0.1; z += 0.22) slats.add(cross(z, 0.10));
    covers.lamas = slats;
    // colisiones de los postes
    posts.forEach(([x, z]) => ctx.dynColliders.push({ box: { x0: x, z0: z, x1: x + POST, z1: z + POST }, fn: () => grp.visible }));
    sets[len] = { grp, covers };
  }
  let cur = { cover: '', len: 'dos' };
  const apply = () => {
    for (const [len, s] of Object.entries(sets)) {
      s.grp.visible = !!cur.cover && len === cur.len;
      for (const [k, m] of Object.entries(s.covers)) m.visible = k === cur.cover;
    }
  };
  ctx.setCarport = (cover, len) => { if (cover !== undefined) cur.cover = cover; if (len) cur.len = len; apply(); };
}
