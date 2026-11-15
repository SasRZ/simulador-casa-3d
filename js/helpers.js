import * as THREE from 'three';

// Mapeo plano → mundo: x_mundo = x_plano, z_mundo = z_plano, y = altura.

export function box(x0, y0, z0, x1, y1, z1, mat, opts = {}) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  const m = new THREE.Mesh(g, mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.receive !== false;
  return m;
}

// Plano horizontal con UV en metros (tile = size m). up=true mira hacia arriba.
export function rectXZ(x0, z0, x1, z1, y, mat, { up = true, size = 1.2, ox = 0, oz = 0 } = {}) {
  const w = x1 - x0, d = z1 - z0;
  const g = new THREE.PlaneGeometry(w, d);
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    const wx = x0 + (pos.getX(i) + w / 2), wz = z0 + (d / 2 - pos.getY(i));
    uv.setXY(i, (wx + ox) / size, (wz + oz) / size);
  }
  g.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  m.receiveShadow = true;
  return m;
}

// Panel vertical. axis 'x': plano x=fixed, se extiende en z (a0..a1); 'z': plano z=fixed, extendido en x.
// facing = +1 / -1 : hacia dónde mira la cara visible (sentido del eje normal).
export function panel(axis, fixed, a0, a1, y0, y1, facing, mat, size = 1.2) {
  const w = a1 - a0, h = y1 - y0;
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    const a = a0 + pos.getX(i) + w / 2, y = y0 + pos.getY(i) + h / 2;
    uv.setXY(i, (facing > 0 ? a : -a) / size, y / size);
  }
  const m = new THREE.Mesh(g, mat);
  if (axis === 'x') { m.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2; m.position.set(fixed, (y0 + y1) / 2, (a0 + a1) / 2); }
  else { m.rotation.y = facing > 0 ? 0 : Math.PI; m.position.set((a0 + a1) / 2, (y0 + y1) / 2, fixed); }
  m.receiveShadow = true;
  return m;
}

// Forma extruida en vertical: puntos [x,z] del plano, desde y0 hasta y1
export function prism(points, y0, y1, mats, curveSegs = 8) {
  const s = new THREE.Shape();
  points.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false, curveSegments: curveSegs });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  const m = new THREE.Mesh(g, mats);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// Cuadrante de círculo → lista de puntos
export function arcPts(cx, cz, r, a0, a1, n = 8) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); out.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); }
  return out;
}

// Trocea un muro en cajas dejando los huecos. Devuelve [{x0,z0,x1,z1,y0,y1,floor}]
export function wallPieces(w, H, openings) {
  const horiz = (w.x1 - w.x0) >= (w.z1 - w.z0);
  const A0 = horiz ? w.x0 : w.z0, A1 = horiz ? w.x1 : w.z1;
  const B0 = horiz ? w.z0 : w.x0, B1 = horiz ? w.z1 : w.x1;
  const ops = [...(openings || [])].sort((a, b) => a[0] - b[0]);
  const out = [];
  const push = (a0, a1, y0, y1) => {
    if (a1 - a0 < 1e-4 || y1 - y0 < 1e-4) return;
    out.push(horiz ? { x0: a0, x1: a1, z0: B0, z1: B1, y0, y1 } : { x0: B0, x1: B1, z0: a0, z1: a1, y0, y1 });
  };
  let cur = A0;
  for (const [a, b, y0, y1] of ops) {
    push(cur, a, 0, H);
    if (y0 > 0) push(a, b, 0, y0);
    push(a, b, y1, H);
    cur = b;
  }
  push(cur, A1, 0, H);
  return out;
}

export function addAll(group, ...meshes) { meshes.flat().forEach((m) => m && group.add(m)); return group; }

export const shortAngleDelta = (from, to) => {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d;
};
export const angleOf = (dx, dz) => Math.atan2(-dz, dx);   // rotation.y que lleva +x local a (dx,dz)
