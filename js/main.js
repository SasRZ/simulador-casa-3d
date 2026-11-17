import * as THREE from 'three';
import { CFG } from './config.js';
import { makeMaterials, setAnisotropy, setMaxTexture } from './materials.js';
import { buildDwelling, buildHallSlider } from './build_dwelling.js';
import { buildKitchen, buildIsland } from './build_kitchen.js';
import { buildBaths } from './build_baths.js';
import { buildSite } from './build_site.js';
import { buildSolar } from './build_solar.js';
import { buildCarport } from './build_carport.js';
import { buildCars } from './build_cars.js';
import { buildGreenery } from './build_greenery.js';
import { buildFurniture } from './build_furniture.js';
import { buildExterior } from './build_exterior.js';
import { createEnvironment } from './environment.js';
import { Navigation } from './navigation.js';
import { UI } from './ui.js';
import { Notes } from './notes.js';

const msg = (t) => { const e = document.getElementById('loading-msg'); if (e) e.textContent = t; };
const nextFrame = () => new Promise((r) => setTimeout(r, 16));

// Crea el renderizador probando opciones cada vez más ligeras: algunos móviles y tabletas
// rechazan 'high-performance' o el antialias, sobre todo tras un fallo previo de la GPU.
function createRenderer(canvas, touch) {
  const tries = [
    { antialias: !touch, powerPreference: 'high-performance' },
    { antialias: false, powerPreference: 'default' },
    { antialias: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false, precision: 'mediump' },
  ];
  let last;
  for (let i = 0; i < tries.length; i++) {
    try { return { renderer: new THREE.WebGLRenderer({ canvas, ...tries[i] }), lite: i > 0 }; }
    catch (e) { last = e; console.warn('WebGL no disponible con', tries[i], e); }
  }
  const err = new Error(last && last.message || 'WebGL no disponible'); err.webgl = true; throw err;
}

function showGLProblem(why, offerUltra) {
  let el = document.getElementById('loading');
  if (!el) { el = document.createElement('div'); el.id = 'loading'; document.body.appendChild(el); }
  el.classList.remove('done');
  el.innerHTML = `<div class="glfail"><b>No se puede mostrar el 3D</b>
    <span>${why}</span>
    <span>Suele arreglarse así:</span>
    <ol>
      <li>Cierra <b>todas</b> las pestañas y sal de Chrome por completo (en Android: botón de apps recientes y desliza Chrome fuera).</li>
      <li>Vuelve a abrir Chrome y entra otra vez en la página.</li>
      <li>Si sigue igual, reinicia el dispositivo o prueba en otro navegador.</li>
    </ol>
    ${offerUltra ? '<button onclick="location.href=location.pathname+\'?ligero=2\'">Recargar en modo muy ligero</button>' : '<button onclick="location.reload()">Reintentar</button>'}</div>`;
}

async function boot() {
  const canvas = document.getElementById('c');
  const touch = document.body.classList.contains('touch');
  const made = createRenderer(canvas, touch);
  const renderer = made.renderer;
  // Modo ligero: automático en móviles/tabletas o si la GPU rechazó el modo normal.
  // Se fuerza con ?ligero=1 o se desactiva con ?ligero=0 en la dirección.
  // Niveles: 0 normal · 1 ligero (auto en táctiles) · 2 muy ligero (auto si la GPU ya falló en este dispositivo).
  const qp = new URLSearchParams(location.search).get('ligero');
  let saved = null; try { saved = localStorage.getItem('villa04-ligero'); } catch (e) {}
  if (qp === '0' || qp === '1') { try { localStorage.removeItem('villa04-ligero'); } catch (e) {} saved = null; }
  const level = qp === '0' ? 0 : qp === '2' || saved === '2' ? 2 : qp === '1' || touch || made.lite ? 1 : 0;
  const lite = level > 0, ultra = level === 2;
  if (lite) document.body.classList.add('lite');
  renderer.setPixelRatio(ultra ? 0.75 : lite ? 1 : Math.min(devicePixelRatio, 2));
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    // La GPU de este dispositivo no aguanta: la próxima vez arrancamos en modo muy ligero.
    try { localStorage.setItem('villa04-ligero', '2'); } catch (err) {}
    showGLProblem('La tarjeta gráfica se ha quedado sin memoria y el navegador ha detenido el 3D.', !ultra);
  });
  canvas.addEventListener('webglcontextrestored', () => { const l = document.getElementById('loading'); if (l) l.remove(); });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.6;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  setAnisotropy(Math.min(lite ? 2 : 8, renderer.capabilities.getMaxAnisotropy()));
  if (lite) setMaxTexture(ultra ? 256 : 512);

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
  buildSite(ctx); buildCarport(ctx); buildCars(ctx); buildGreenery(ctx);

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
  app.notes = new Notes(app);
  // En modo ligero las sombras empiezan apagadas (doblan el trabajo de la GPU); se pueden activar en el menú.
  app.env.setShadows(!lite, !lite);
  if (lite) { document.getElementById('opt-hq').checked = false; document.getElementById('opt-shadows').checked = false; }
  if (touch) { app.ui.togglePanel(true); }
  app.ui.applyTime();
  window.__app = app;   // útil para depurar desde la consola

  // Animaciones de puertas/ventanas + bucle
  const clock = new THREE.Clock();
  let hoverT = 0;
  const hint = document.getElementById('hint');
  // Render bajo demanda: sólo se dibuja cuando algo cambia (cámara, puertas, animación del sol,
  // o justo después de tocar/teclear/cambiar algo). Así la GPU descansa cuando la vista está quieta.
  let lastInput = performance.now(), lastDraw = 0;
  const poke = () => { lastInput = performance.now(); };
  ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown', 'keyup', 'input', 'change', 'click', 'touchstart', 'touchmove'].forEach((ev) => addEventListener(ev, poke, { passive: true, capture: true }));
  addEventListener('resize', poke);
  app.invalidate = poke;
  const lastCam = new Float32Array(16);
  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.05, clock.getDelta());
    let busy = false;
    ctx.openables.forEach((o) => { if (o.t !== o.target) busy = true; o.update(dt); });
    app.nav.update(dt);
    app.ui.tick(dt);
    app.ui.updateLabels();
    app.notes.update(dt);
    hoverT += dt;
    if (hoverT > 0.12) {
      hoverT = 0;
      const h = app.nav.hover();
      hint.hidden = !h;
      if (h) hint.textContent = `${h.t > 0.5 ? 'Cerrar' : 'Abrir'}: ${h.name}  ${touch ? '(toca)' : '(clic o E)'}`;
    }
    const cam = app.nav.camera; cam.updateMatrixWorld();
    const m = cam.matrixWorld.elements; let moved = false;
    for (let i = 0; i < 16; i++) if (Math.abs(m[i] - lastCam[i]) > 1e-6) { moved = true; lastCam[i] = m[i]; }
    const now = performance.now();
    if (moved || busy || app.ui.playing || now - lastInput < 800 || now - lastDraw > 2000) {
      renderer.render(scene, cam); lastDraw = now;
    }
  });
  const loading = document.getElementById('loading');
  loading.classList.add('done'); setTimeout(() => loading.remove(), 700);
}

boot().catch((e) => {
  console.error(e);
  if (e.webgl || /WebGL/i.test(e.message)) showGLProblem('El navegador no deja crear el contexto 3D (WebGL). Pasa cuando la tarjeta gráfica ha fallado antes en esta sesión y Chrome lo bloquea temporalmente.');
  else document.getElementById('loading-msg').textContent = 'Error: ' + e.message;
});
