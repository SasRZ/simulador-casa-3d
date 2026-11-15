import * as THREE from 'three';
import { CFG } from './config.js';
import { PARCEL, ROOFS } from './plan.js';
import { box, prism } from './helpers.js';

// ENU (este, norte) en metros respecto a las coordenadas GPS → plano (x, z)
export function enuToPlan(e, n) {
  const b = THREE.MathUtils.degToRad(CFG.site.planUpBearingDeg);
  const ex = [Math.sin(b + Math.PI / 2), Math.cos(b + Math.PI / 2)];   // dirección "derecha del plano"
  const up = [Math.sin(b), Math.cos(b)];                                 // dirección "arriba del plano"
  return [CFG.site.anchorPlan.x + e * ex[0] + n * ex[1], CFG.site.anchorPlan.z - (e * up[0] + n * up[1])];
}
// Vector del mundo (este, norte, arriba) → vector three (x plano, y arriba, z plano)
export function enuVecToWorld(e, n, u) {
  const b = THREE.MathUtils.degToRad(CFG.site.planUpBearingDeg);
  const ex = [Math.sin(b + Math.PI / 2), Math.cos(b + Math.PI / 2)], up = [Math.sin(b), Math.cos(b)];
  return new THREE.Vector3(e * ex[0] + n * ex[1], u, -(e * up[0] + n * up[1]));
}

// Casa vecina simplificada (misma vivienda: volúmenes, peto y porche), desplazada o en espejo
function neighbor(M, dx, mirror) {
  const g = new THREE.Group();
  const H = CFG.H, top = H.ceiling + H.slab;
  const tx = (x) => (mirror ? 2 * PARCEL.x0 - x : x) + dx;
  for (const r of ROOFS) {
    const pts = r.pts.map(([x, z]) => [tx(x), z]);
    if (mirror) pts.reverse();
    g.add(prism(pts, 0, top + H.parapet, [M.neighbor, M.neighbor]));
  }
  // porche
  const x0 = Math.min(tx(-0.09), tx(10.996)), x1 = Math.max(tx(-0.09), tx(10.996));
  g.add(box(x0, CFG.site2.porchH, 11.53, x1, CFG.site2.porchH + 0.25, 14.48, M.neighbor));
  // cerramiento de su parcela (frente)
  const p0 = Math.min(tx(PARCEL.x0), tx(PARCEL.x1)), p1 = Math.max(tx(PARCEL.x0), tx(PARCEL.x1));
  g.add(box(p0, 0, PARCEL.z1, p1, 1.6, PARCEL.z1 + 0.15, M.fenceWall));
  // jardín
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(p1 - p0, 21.5), M.grass); grass.rotation.x = -Math.PI / 2; grass.position.set((p0 + p1) / 2, -0.01, 10.8); grass.receiveShadow = true; g.add(grass);
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(p1 - p0, 12.7), M.paving); pave.rotation.x = -Math.PI / 2; pave.position.set((p0 + p1) / 2, -0.012, 27.8); pave.receiveShadow = true; g.add(pave);
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  return g;
}

export function buildExterior(ctx, osm) {
  const { M, G } = ctx;
  const g = G.exterior;
  const cg = new THREE.Group(); cg.name = 'entorno'; g.add(cg); G.envContext = cg;

  // ---------------- Terreno con hueco para la parcela ----------------
  const R = 3000, P = PARCEL;
  const sh = new THREE.Shape([new THREE.Vector2(-R, -R), new THREE.Vector2(R, -R), new THREE.Vector2(R, R), new THREE.Vector2(-R, R)]);
  sh.holes.push(new THREE.Path([new THREE.Vector2(P.x0, -P.z0), new THREE.Vector2(P.x0, -P.z1), new THREE.Vector2(P.x1, -P.z1), new THREE.Vector2(P.x1, -P.z0)]));
  const gg = new THREE.ShapeGeometry(sh); gg.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(gg, M.ground); ground.position.y = -0.03; ground.receiveShadow = true; g.add(ground);

  // ---------------- Casas vecinas (parcelas 03 y 05, estimadas) ----------------
  if (CFG.env.neighbors) {
    const w = P.x1 - P.x0;
    const n03 = neighbor(M, 0, true); n03.name = 'Parcela 03 (estimada)'; cg.add(n03);
    const n05 = neighbor(M, w, false); n05.name = 'Parcela 05 (estimada)'; cg.add(n05);
  }

  // ---------------- Calles (OpenStreetMap) ----------------
  const roadGroup = new THREE.Group(); cg.add(roadGroup);
  const treeSpots = [];
  for (const r of osm.roads) {
    const pts = r.pts.map(([e, n]) => enuToPlan(e, n));
    if (pts.length < 2) continue;
    const mat = r.type === 'cycleway' || r.type === 'pedestrian' ? M.sidewalk : M.asphalt;
    roadGroup.add(ribbon(pts, r.w, mat === M.asphalt ? -0.02 : -0.018, mat));
    if (mat === M.asphalt) roadGroup.add(ribbon(pts, r.w + 5, -0.025, M.sidewalk));
    if (r.type === 'secondary' || r.type === 'residential') {
      let acc = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
        const len = Math.hypot(bx - ax, bz - az); const dx = (bx - ax) / (len || 1), dz = (bz - az) / (len || 1);
        for (let s = (14 - acc); s < len; s += 14) {
          for (const side of [-1, 1]) {
            const tx = ax + dx * s - dz * side * (r.w / 2 + 1.5), tz = az + dz * s + dx * side * (r.w / 2 + 1.5);
            if (tx > P.x0 - 33 && tx < P.x1 + 33 && tz > P.z0 - 2 && tz < P.z1 + 2) continue;   // no dentro de las parcelas
            treeSpots.push([tx, tz]);
          }
        }
        acc = (acc + len) % 14;
      }
    }
  }
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.22, 2.6, 6), crownGeo = new THREE.IcosahedronGeometry(2.0, 1);
  const trunks = new THREE.InstancedMesh(trunkGeo, M.trunk, treeSpots.length), crowns = new THREE.InstancedMesh(crownGeo, M.tree, treeSpots.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3();
  treeSpots.forEach(([x, z], i) => {
    const sc = 0.8 + ((i * 37) % 10) / 25;
    s3.set(sc, sc, sc);
    m4.compose(new THREE.Vector3(x, 1.3, z), q, s3); trunks.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x, 3.8 * sc, z), q, s3); crowns.setMatrixAt(i, m4);
  });
  trunks.castShadow = crowns.castShadow = true; cg.add(trunks, crowns);

  // edificios de OSM (aquí aún no hay: urbanización nueva)
  for (const b of osm.buildings) {
    const pts = b.pts.map(([e, n]) => enuToPlan(e, n));
    const h = b.h || 7;
    const s = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
    const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, M.neighbor); m.castShadow = m.receiveShadow = true; cg.add(m);
  }
  return g;
}

function ribbon(pts, w, y, mat) {
  const pos = [], idx = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    pos.push(pts[i][0] - dz * w / 2, y, pts[i][1] + dx * w / 2, pts[i][0] + dz * w / 2, y, pts[i][1] - dx * w / 2);
    if (i < n - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true;
  m.material = mat.clone(); m.material.side = THREE.DoubleSide; return m;
}
