import * as THREE from 'three';
import { CFG } from './config.js';
import { makeMaterials, setAnisotropy } from './materials.js';
import { buildDwelling, buildHallSlider } from './build_dwelling.js';
import { buildKitchen, buildIsland } from './build_kitchen.js';
import { buildBaths } from './build_baths.js';
import { buildSite } from './build_site.js';
import { buildSolar } from './build_solar.js';
import { buildCarport } from './build_carport.js';
import { buildFurniture } from './build_furniture.js';
import { buildExterior } from './build_exterior.js';
import { createEnvironment } from './environment.js';
import { Navigation } from './navigation.js';
import { UI } from './ui.js';

const msg = (t) => { const e = document.getElementById('loading-msg'); if (e) e.textContent = t; };
const nextFrame = () => new Promise((r) => setTimeout(r, 16));

async function boot() {
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const touch = document.body.classList.contains('touch');
  renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.6;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  setAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fb6cc);

  const M = makeMaterials();
  const G = {};
  const ctx = { scene, M, G, colliders: [], dynColliders: [], openables: [], pickables: [], spots: [], doors: {} };
  ['structure', 'upper', 'kitchen', 'baths', 'site', 'exterior'].forEach((k) => { G[k] = new THREE.Group(); G[k].name = k; scene.add(G[k]); });

  msg('muros, suelos y carpinterías'); await nextFrame();
  buildDwelling(ctx); buildHallSlider(ctx); buildSolar(ctx);
  msg('cocina y baños'); await nextFrame();
  buildKitchen(ctx); buildIsland(ctx); buildBaths(ctx);
  msg('parcela, porche y piscina'); await nextFrame();
  buildSite(ctx); buildCarport(ctx);

  msg('mobiliario'); await nextFrame();
  buildFurniture(ctx);

  msg('entorno (OpenStreetMap)'); await nextFrame();
  let osm = { roads: [], buildings: [] };
  try { osm = await (await fetch('osm_context.json')).json(); } catch (e) { console.warn('Sin entorno OSM', e); }
  buildExterior(ctx, osm);

  const app = { renderer, scene, ctx };
  app.env = createEnvironment(app);
  app.nav = new Navigation(app);
  app.ui = new UI(app);
  app.env.setShadows(true, !touch);
  if (touch) { document.getElementById('opt-hq').checked = false; app.ui.togglePanel(true); }
  app.ui.applyTime();
  window.__app = app;   // útil para depurar desde la consola

  // Animaciones de puertas/ventanas + bucle
  const clock = new THREE.Clock();
  let hoverT = 0;
  const hint = document.getElementById('hint');
  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.05, clock.getDelta());
    ctx.openables.forEach((o) => o.update(dt));
    app.nav.update(dt);
    app.ui.tick(dt);
    app.ui.updateLabels();
    hoverT += dt;
    if (hoverT > 0.12) {
      hoverT = 0;
      const h = app.nav.hover();
      hint.hidden = !h;
      if (h) hint.textContent = `${h.t > 0.5 ? 'Cerrar' : 'Abrir'}: ${h.name}  ${touch ? '(toca)' : '(clic o E)'}`;
    }
    renderer.render(scene, app.nav.camera);
  });
  const loading = document.getElementById('loading');
  loading.classList.add('done'); setTimeout(() => loading.remove(), 700);
}

boot().catch((e) => { console.error(e); document.getElementById('loading-msg').textContent = 'Error: ' + e.message; });
