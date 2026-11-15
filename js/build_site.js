// Parcela: suelos exteriores, porche, piscina, jardinera, cerramientos y puertas.
// Datos de la memoria de calidades; alturas y modelos estimados (ver config.js).
import * as THREE from 'three';
import { CFG } from './config.js';
import { PARCEL, POOL, PORCH, GRASS, DRIVE, WOODLOOK, PLANTER, GATES } from './plan.js';
import { box, rectXZ } from './helpers.js';
import { Openable, addPickable, worldBox } from './build_dwelling.js';

export function buildSite(ctx) {
  const { M, G } = ctx;
  const S = CFG.site2;
  const g = G.site, P = PARCEL;

  // ---------------- Suelos ----------------
  // base: gres gris (todo menos el hueco de la piscina más grande)
  const cop = POOL.coping, Lmax = Math.max(...POOL.sizes.map((q) => q.L));
  const pc = [POOL.x0 - cop, POOL.z0 - cop, POOL.x0 + Lmax + cop, POOL.z1 + cop];
  [[P.x0, pc[3], P.x1, P.z1], [pc[2], P.z0, P.x1, pc[3]], [P.x0, P.z0, pc[0], pc[3]]]
    .forEach(([x0, z0, x1, z1]) => g.add(rectXZ(x0, z0, x1, z1, -0.012, M.paving, { size: 1.2 })));
  GRASS.forEach(([x0, z0, x1, z1]) => g.add(rectXZ(Math.max(x0, z1 <= pc[3] + 0.01 ? pc[2] : x0), z0, x1, z1, -0.006, M.grass, { size: 2 })));
  g.add(rectXZ(DRIVE[0], DRIVE[1], DRIVE[2], DRIVE[3], -0.004, M.concrete, { size: 4 }));
  WOODLOOK.forEach(([x0, z0, x1, z1]) => g.add(rectXZ(x0, z0, x1, z1, -0.002, M.woodlook, { size: 1.2 })));

  // ---------------- Piscina: varias medidas (se elige en el panel) ----------------
  const d = S.poolDepth, wl = -0.10;
  ctx.copings = []; ctx.poolLights = []; ctx.pools = {};
  for (const size of POOL.sizes) {
    const pg = new THREE.Group(); pg.name = `piscina ${size.id}`; g.add(pg); ctx.pools[size.id] = pg;
    const x0 = POOL.x0, z0 = POOL.z0, x1 = POOL.x0 + size.L, z1 = POOL.z1;
    const q = [x0 - cop, z0 - cop, x1 + cop, z1 + cop];
    // césped que rellena el sitio que deja libre la piscina más pequeña
    if (q[2] < pc[2] - 0.01) pg.add(rectXZ(q[2], P.z0, pc[2], pc[3], -0.006, M.grass, { size: 2 }));
    [[q[0], q[1], q[2], z0], [q[0], z1, q[2], q[3]], [q[0], z0, x0, z1], [x1, z0, q[2], z1]]
      .forEach(([a0, b0, a1, b1]) => { const m = worldBox(a0, -0.02, b0, a1, 0.03, b1, M.coping); pg.add(m); ctx.copings.push(m); });
    // vaso: fondo y paredes de gresite
    pg.add(rectXZ(x0, z0, x1, z1, -d, M.poolTile, { size: 1.2 }));
    pg.add(worldBox(x0 - 0.2, -d, z0 - 0.2, x1 + 0.2, -0.02, z0, M.poolTile));
    pg.add(worldBox(x0 - 0.2, -d, z1, x1 + 0.2, -0.02, z1 + 0.2, M.poolTile));
    pg.add(worldBox(x0 - 0.2, -d, z0, x0, -0.02, z1, M.poolTile));
    pg.add(worldBox(x1, -d, z0, x1 + 0.2, -0.02, z1, M.poolTile));
    const water = rectXZ(x0, z0, x1, z1, wl, M.water); water.receiveShadow = false; pg.add(water);
    // focos de la piscina (memoria: iluminación interior)
    [x0 + size.L * 0.25, x0 + size.L * 0.75].forEach((x) => {
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), M.poolLight); lens.position.set(x, -0.5, z1 - 0.005); lens.rotation.y = Math.PI; pg.add(lens);
      const L = new THREE.PointLight(0x9fe8ff, 0, 6, 1.5); L.position.set(x, -0.6, z1 - 0.3); L.visible = false; pg.add(L); ctx.poolLights.push(L);
    });
    ctx.dynColliders.push({ box: { x0, z0, x1, z1 }, fn: () => pg.visible });
  }
  ctx.setCoping = (k) => ctx.copings.forEach((m) => { m.material = k === 'madera' ? M.woodlook : M.coping; });
  ctx.setPoolLights = (on) => { ctx.poolLights.forEach((L) => { L.visible = on; L.intensity = on ? 6 : 0; }); M.poolLight.emissiveIntensity = on ? 3 : 0; };
  ctx.setPoolSize = (id) => Object.entries(ctx.pools).forEach(([k, pg]) => { pg.visible = k === id; });
  ctx.setPoolSize(POOL.sizes[0].id);
  const pg = g;
  // tumbonas (plano de la promotora)
  [[11.2, 1.35], [11.2, 2.55]].forEach(([x, z]) => {
    pg.add(box(x - 0.95, 0.12, z - 0.33, x + 0.95, 0.30, z + 0.33, M.pergola));
    const back = box(-0.4, -0.05, -0.33, 0.4, 0.05, 0.33, M.pergola); back.position.set(x + 0.75, 0.48, z); back.rotation.z = 0.7; pg.add(back);
  });

  // ---------------- Porche: pilares y cubierta (lamas o losa) ----------------
  const ph = S.porchH;
  PORCH.pillars.forEach(([x0, x1]) => { g.add(box(x0, 0, PORCH.pz0, x1, ph, PORCH.pz1, M.pergola)); ctx.colliders.push({ x0, z0: PORCH.pz0, x1, z1: PORCH.pz1 }); });
  const beamH = 0.25;
  g.add(box(PORCH.x0, ph, PORCH.z0, PORCH.x1, ph + beamH, PORCH.pz1, M.pergola));            // viga frontal
  g.add(box(PORCH.x0, ph, PORCH.z0, PORCH.x0 + 0.25, ph + beamH, PORCH.z1 + 1.0, M.pergola)); // viga oeste (llega al aseo)
  g.add(box(PORCH.x1 - 0.25, ph, PORCH.z0, PORCH.x1, ph + beamH, PORCH.z1, M.pergola));      // viga este
  const slats = new THREE.Group(); slats.name = 'lamas';
  for (let x = PORCH.x0 + 0.35; x < PORCH.x1 - 0.3; x += 0.32) slats.add(box(x, ph + 0.03, PORCH.pz1, x + 0.06, ph + beamH - 0.02, PORCH.z1, M.pergola));
  const slab = new THREE.Group(); slab.name = 'losa';
  slab.add(box(PORCH.x0, ph, PORCH.pz1, PORCH.x1, ph + beamH, PORCH.z1, M.pergola));
  g.add(slats, slab);
  ctx.setPorch = (k) => { slats.visible = k !== 'losa'; slab.visible = k === 'losa'; };
  ctx.setPorch('lamas');
  G.porchRoof = [slats, slab];

  // ---------------- Cerramiento opcional del porche: cristalera corredera ----------------
  // Hojas de vidrio con perfil antracita fino que corren por un carril superior e inferior.
  // Frente: entre los pilares; laterales este y oeste hasta la fachada.          (propuesta)
  const encl = new THREE.Group(); encl.name = 'cristalera'; encl.visible = false; g.add(encl); G.porchGlass = encl;
  const zc = (PORCH.pz0 + PORCH.pz1) / 2;
  const P0 = PORCH.pillars;
  const spans = [
    ...P0.slice(0, -1).map((p, i) => ({ axis: 'x', a: p[1], b: P0[i + 1][0], c: zc })),           // frente
    { axis: 'z', a: PORCH.pz1, b: PORCH.z1, c: (P0[P0.length - 1][0] + P0[P0.length - 1][1]) / 2 }, // lado este
    { axis: 'z', a: PORCH.pz1, b: 15.484, c: (P0[0][0] + P0[0][1]) / 2 },                         // lado oeste (hasta el aseo)
  ];
  const gh = ph - 0.04, fr = 0.035;
  spans.forEach((s, si) => {
    const L = s.b - s.a, n = Math.max(2, Math.ceil(L / 0.85)), pw = L / n + 0.03;
    const root = new THREE.Group(); encl.add(root);
    if (s.axis === 'x') root.position.set(s.a, 0, s.c); else { root.position.set(s.c, 0, s.a); root.rotation.y = -Math.PI / 2; }
    // carriles
    root.add(box(0, 0, -0.05, L, 0.03, 0.05, M.window), box(0, gh, -0.05, L, ph, 0.05, M.window));
    const leaves = [];
    for (let i = 0; i < n; i++) {
      const lf = new THREE.Group(); lf.position.set(i * (L / n), 0.03, ((i % 3) - 1) * 0.025); root.add(lf);
      const ht = gh - 0.03;
      lf.add(box(0, 0, -0.008, pw, fr, 0.008, M.window), box(0, ht - fr, -0.008, pw, ht, 0.008, M.window));
      lf.add(box(0, 0, -0.008, 0.02, ht, 0.008, M.window), box(pw - 0.02, 0, -0.008, pw, ht, 0.008, M.window));
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.04, ht - 2 * fr), M.glass); pane.position.set(pw / 2, ht / 2, 0); lf.add(pane);
      leaves.push({ lf, x0: i * (L / n) });
    }
    // Abierta: todas las hojas se apilan en el extremo final del tramo
    const col = s.axis === 'x' ? { x0: s.a, z0: s.c - 0.06, x1: s.b, z1: s.c + 0.06 } : { x0: s.c - 0.06, z0: s.a, x1: s.c + 0.06, z1: s.b };
    const op = new Openable(`Cristalera del porche (${si < spans.length - 2 ? 'frente' : si === spans.length - 2 ? 'lado este' : 'lado oeste'})`, (e) => {
      leaves.forEach(({ lf, x0 }, i) => { const stack = L - pw - (n - 1 - i) * 0.02; lf.position.x = x0 + (stack - x0) * e; });
    }, col);
    op.speed = 0.8;
    addPickable(ctx, root, op); ctx.openables.push(op);
    ctx.dynColliders.push({ box: col, fn: () => encl.visible && op.blocking });
  });
  ctx.setPorchGlass = (on) => { encl.visible = on; };

  // ---------------- Jardinera del frente ----------------
  g.add(worldBox(PLANTER[0], 0, PLANTER[1], PLANTER[2], 0.45, PLANTER[1] + 0.12, M.fenceWall));
  g.add(worldBox(PLANTER[0], 0, PLANTER[3] - 0.12, PLANTER[2], 0.45, PLANTER[3], M.fenceWall));
  g.add(worldBox(PLANTER[0], 0, PLANTER[1], PLANTER[0] + 0.12, 0.45, PLANTER[3], M.fenceWall));
  g.add(worldBox(PLANTER[2] - 0.12, 0, PLANTER[1], PLANTER[2], 0.45, PLANTER[3], M.fenceWall));
  g.add(rectXZ(PLANTER[0] + 0.12, PLANTER[1] + 0.12, PLANTER[2] - 0.12, PLANTER[3] - 0.12, 0.38, M.soil));
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + (i % 3) * 0.08, 1), i % 4 === 1 ? M.flower : M.shrub);
    s.position.set(PLANTER[0] + 0.6 + i * 0.85, 0.55, (PLANTER[1] + PLANTER[3]) / 2 + ((i * 37) % 5 - 2) * 0.12); s.castShadow = true; g.add(s);
  }
  ctx.colliders.push({ x0: PLANTER[0], z0: PLANTER[1], x1: PLANTER[2], z1: PLANTER[3] });

  // ---------------- Cerramientos ----------------
  const t = 0.15;
  // medianeras de citara con pilastras (lados norte del plano y este)
  const medianera = (x0, z0, x1, z1) => {
    g.add(worldBox(x0, 0, z0, x1, S.medianeraH, z1, M.fenceWall));
    const horiz = x1 - x0 > z1 - z0, L = horiz ? x1 - x0 : z1 - z0, n = Math.max(1, Math.round(L / 3));
    for (let i = 0; i <= n; i++) {
      const a = (horiz ? x0 : z0) + (L * i) / n;
      g.add(horiz ? worldBox(a - 0.15, 0, z0 - 0.05, a + 0.15, S.medianeraH + 0.05, z1 + 0.05, M.fenceWall) : worldBox(x0 - 0.05, 0, a - 0.15, x1 + 0.05, S.medianeraH + 0.05, a + 0.15, M.fenceWall));
    }
    ctx.colliders.push({ x0, z0, x1, z1 });
  };
  medianera(P.x0, P.z0 - t, P.x1, P.z0);               // fondo (arriba del plano)
  medianera(P.x1, P.z0, P.x1 + t, P.z1);               // lado derecho del plano
  // lado izquierdo: medianera entre los volúmenes del aseo y del lavadero (que ya hacen de límite)
  medianera(P.x0 - t, P.z0, P.x0, 15.484);
  medianera(P.x0 - t, 18.384, P.x0, 25.097);
  medianera(P.x0 - t, 29.396, P.x0, P.z1);
  // frente (abajo del plano): murete de bloque enfoscado 0,90 + reja metálica
  const front = (x0, x1) => {
    if (x1 - x0 < 0.05) return;
    g.add(worldBox(x0, 0, P.z1, x1, S.fenceFrontBlock, P.z1 + t, M.fenceWall));
    g.add(box(x0, S.fenceFrontBlock, P.z1 + 0.05, x1, S.fenceFrontBlock + 0.04, P.z1 + 0.10, M.fenceMetal));
    g.add(box(x0, S.fenceH - 0.04, P.z1 + 0.05, x1, S.fenceH, P.z1 + 0.10, M.fenceMetal));
    for (let x = x0 + 0.06; x < x1 - 0.02; x += 0.12) g.add(box(x, S.fenceFrontBlock, P.z1 + 0.065, x + 0.02, S.fenceH, P.z1 + 0.085, M.fenceMetal));
    ctx.colliders.push({ x0, z0: P.z1, x1, z1: P.z1 + t });
  };
  front(P.x0, GATES.ped.x0); front(GATES.ped.x1, GATES.car.x0);

  // ---------------- Puertas de la parcela ----------------
  // peatonal abatible (abre hacia dentro)
  const pv = new THREE.Group(); pv.position.set(GATES.ped.x0 + 0.02, 0, P.z1 + 0.07); g.add(pv);
  const pw = GATES.ped.x1 - GATES.ped.x0 - 0.04;
  pv.add(box(0, 0.05, -0.025, pw, S.fenceH, 0.025, M.fenceMetal));
  const pcol = { x0: GATES.ped.x0, z0: P.z1, x1: GATES.ped.x1, z1: P.z1 + t };
  const pop = new Openable('Puerta peatonal de la parcela', (e) => { pv.rotation.y = e * THREE.MathUtils.degToRad(95); }, pcol);
  addPickable(ctx, pv, pop); ctx.openables.push(pop); ctx.dynColliders.push({ box: pcol, op: pop });
  // corredera de vehículos (motorizada, se recoge hacia la izquierda del plano)
  const cw = GATES.car.x1 - GATES.car.x0;
  const cg = new THREE.Group(); cg.position.set(GATES.car.x0, 0, P.z1 + 0.20); g.add(cg);
  cg.add(box(0, 0.05, -0.03, cw, S.fenceH, 0.03, M.fenceMetal));
  for (let x = 0.1; x < cw; x += 0.2) cg.add(box(x, 0.15, 0.03, x + 0.1, S.fenceH - 0.1, 0.04, M.fenceMetal));
  const ccol = { x0: GATES.car.x0, z0: P.z1, x1: GATES.car.x1, z1: P.z1 + 0.3 };
  const cop2 = new Openable('Puerta corredera de vehículos', (e) => { cg.position.x = GATES.car.x0 - e * (cw - 0.3); }, ccol);
  cop2.speed = 0.5;
  addPickable(ctx, cg, cop2); ctx.openables.push(cop2); ctx.dynColliders.push({ box: ccol, op: cop2 });
}
