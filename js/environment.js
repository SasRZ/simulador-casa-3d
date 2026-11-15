import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { CFG } from './config.js';
import { enuVecToWorld } from './build_exterior.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export function createEnvironment(app) {
  const { scene, renderer } = app;
  const R = 90000;

  const sky = new Sky(); sky.scale.setScalar(R); scene.add(sky);
  const envScene = new THREE.Scene(); const envSky = new Sky(); envSky.scale.setScalar(R); envScene.add(envSky);
  for (const s of [sky, envSky]) {
    const u = s.material.uniforms; u.turbidity.value = 2.0; u.rayleigh.value = 2.0; u.mieCoefficient.value = 0.003; u.mieDirectionalG.value = 0.8;
  }
  // De día el cielo físico sale casi blanco con esta exposición: se mezcla con un degradado azul (horizonte claro, cenit más intenso).
  const skyDay = { value: 0 };
  sky.material.onBeforeCompile = (sh) => {
    sh.uniforms.uDay = skyDay;
    sh.fragmentShader = 'uniform float uDay;\n' + sh.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );',
      `vec3 skyDir = normalize( vWorldPosition - cameraPosition );
       float sk = pow( clamp( skyDir.y, 0.0, 1.0 ), 0.45 );
       vec3 dayBlue = mix( vec3( 0.42, 0.62, 0.86 ), vec3( 0.07, 0.26, 0.78 ), sk );
       vec3 glow = vec3( 1.0, 0.95, 0.82 ) * pow( max( dot( skyDir, vSunDirection ), 0.0 ), 90.0 ) * 0.6;
       gl_FragColor = vec4( mix( retColor * 0.5, dayBlue + glow, uDay ), 1.0 );`);
  };
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null, lastEnvKey = '';

  // Luces
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  const sc = sun.shadow.camera; const EXT = 40;
  sc.left = -EXT; sc.right = EXT; sc.top = EXT; sc.bottom = -EXT; sc.near = 20; sc.far = 700;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025; sun.shadow.radius = 2;
  sun.shadow.mapSize.set(4096, 4096);
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x8d826e, 0.6); scene.add(hemi);

  // Estrellas
  const N = 1800, sp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    sp.set([s * Math.cos(th) * 60000, Math.abs(u) * 60000 + 2000, s * Math.sin(th) * 60000], i * 3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 120, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  scene.add(stars);

  scene.fog = new THREE.FogExp2(0xb9c9d8, 0.00028);

  const center = new THREE.Vector3(8, 1.5, 17);
  const api = {
    fill: 0,
    sun, hemi, sky, stars,
    update({ az, alt }, { force = false } = {}) {
      const altDeg = alt * 180 / Math.PI;
      const dir = enuVecToWorld(Math.sin(az) * Math.cos(alt), Math.cos(az) * Math.cos(alt), Math.sin(alt)).normalize();
      sky.material.uniforms.sunPosition.value.copy(dir);
      envSky.material.uniforms.sunPosition.value.copy(dir);

      const day = smooth(-7, 9, altDeg), high = smooth(-1, 16, altDeg), warm = 1 - smooth(2, 28, altDeg);
      skyDay.value = smooth(4, 22, altDeg);
      sun.position.copy(center).addScaledVector(dir, 260);
      sun.target.position.copy(center);
      sun.color.setRGB(1, lerp(0.97, 0.66, warm), lerp(0.94, 0.42, warm));
      sun.intensity = 4.2 * high;
      sun.visible = altDeg > -1.5;
      hemi.intensity = lerp(0.06, 1.45, day) + api.fill * (1 - day * 0.85);
      hemi.color.setRGB(lerp(0.12, 1.0, day), lerp(0.16, 0.97, day), lerp(0.28, 0.92, day));
      hemi.groundColor.setRGB(lerp(0.05, 0.86, day), lerp(0.05, 0.80, day), lerp(0.06, 0.70, day));
      renderer.toneMappingExposure = lerp(1.0, 1.25, day);
      scene.environmentIntensity = lerp(0.03, 0.10, day);
      stars.material.opacity = 1 - smooth(-14, -4, altDeg);
      const fogDay = new THREE.Color(0xb9c9d8), fogNight = new THREE.Color(0x070a12);
      scene.fog.color.copy(fogNight).lerp(fogDay, day);
      if (altDeg < 3) scene.fog.color.lerp(new THREE.Color(0xd9a77f), (1 - smooth(-5, 3, altDeg)) * smooth(-9, -3, altDeg) * 0.5);

      const key = `${Math.round(altDeg * 2)}|${Math.round(az * 40)}`;
      if (force || key !== lastEnvKey) {
        lastEnvKey = key;
        const rt = pmrem.fromScene(envScene, 0, 1, 200000);
        if (envRT) envRT.dispose(); envRT = rt; scene.environment = rt.texture;
      }
      return { altDeg, day };
    },
    setShadows(on, hq) {
      renderer.shadowMap.enabled = on; sun.castShadow = on;
      const s = hq ? 4096 : 2048;
      if (sun.shadow.mapSize.x !== s) { sun.shadow.mapSize.set(s, s); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
      scene.traverse((o) => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { m.needsUpdate = true; }); } });
    },
  };
  return api;
}
