// ============================================================================
//  GEOMETRÍA DEL PLANO · Villas del Sur · Vivienda 04
//  Medida sobre el PDF vectorial "UA19_VILLAS DEL SUR_4D PLUS_V04.pdf" (escala 1:125,
//  22,677 pt por metro). Coordenadas: x → derecha del plano, z → abajo del plano.
//  Cada muro: {x0,z0,x1,z1}; open = huecos [desde, hasta, yInf, ySup] medidos a lo largo
//  del eje largo del muro. Las caras exteriores se detectan solas (ver INTERIOR).
// ============================================================================

const W = (id, x0, z0, x1, z1, open) => ({ id, x0, z0, x1, z1, open });
const T = { dorm: 'dorm', bath: 'bath', kitchen: 'kitchen' };
// alto de los huecos de puerta (para que wallPieces deje el dintel)
const DP = 2.03, DE = 2.20, DS = 2.20;

// Ventanas: eje del muro ('x' = muro horizontal en el plano), tramo [a,b], grosor [t0,t1],
// tipo (config.win.types) y normal hacia el interior (in: [nx,nz]).
export const WINDOWS = [
  { id: 'v-cocina-n', room: 'cocina', axis: 'x', a: 8.125, b: 9.327, t0: 14.484, t1: 14.754, type: T.kitchen, in: [0, 1] },
  { id: 'v-cocina-e', room: 'cocina', axis: 'z', a: 17.466, b: 18.165, t0: 10.726, t1: 10.996, type: T.kitchen, in: [-1, 0] },
  { id: 'v-d4', room: 'dorm4', axis: 'z', a: 22.417, b: 23.615, t0: 10.726, t1: 10.996, type: T.dorm, in: [-1, 0] },
  { id: 'v-d3', room: 'dorm3', axis: 'z', a: 25.666, b: 26.867, t0: 10.726, t1: 10.996, type: T.dorm, in: [-1, 0] },
  { id: 'v-d1', room: 'dorm1', axis: 'x', a: 3.127, b: 4.326, t0: 30.418, t1: 30.687, type: T.dorm, in: [0, -1] },
  { id: 'v-d2', room: 'dorm2', axis: 'x', a: 8.125, b: 9.327, t0: 30.418, t1: 30.687, type: T.dorm, in: [0, -1] },
  { id: 'v-b2', room: 'bano2', axis: 'z', a: 21.816, b: 22.417, t0: 1.905, t1: 2.175, type: T.bath, in: [1, 0] },
  { id: 'v-b1', room: 'bano1', axis: 'z', a: 23.515, b: 24.115, t0: 1.905, t1: 2.175, type: T.bath, in: [1, 0] },
  { id: 'v-aseo', room: 'aseo', axis: 'x', a: 0.257, b: 0.857, t0: 18.112, t1: 18.384, type: T.bath, in: [0, -1] },
];
// Corredera del salón al porche (2,50 m)
export const SLIDER = { axis: 'x', a: 4.225, b: 6.726, t0: 14.484, t1: 14.754 };

const winOpen = (id) => { const w = WINDOWS.find((q) => q.id === id); return [w.a, w.b, 'WIN', w.type]; };

export const WALLS = [
  // ---------------- fachadas de la casa ----------------
  W('n', 1.905, 14.484, 10.996, 14.754, [[SLIDER.a, SLIDER.b, 0, DS], winOpen('v-cocina-n')]),
  W('e-a', 10.726, 14.754, 10.996, 20.345, [winOpen('v-cocina-e')]),
  W('e-b', 10.726, 21.546, 10.996, 27.785, [winOpen('v-d4'), winOpen('v-d3')]),
  W('e-step', 10.126, 27.515, 10.726, 27.785),
  W('e-d2', 10.126, 27.785, 10.396, 30.687),
  W('s', 1.905, 30.418, 10.126, 30.687, [winOpen('v-d1'), winOpen('v-d2')]),
  W('w', 1.905, 14.754, 2.175, 30.418, [[19.816, 20.715, 0, DE], winOpen('v-b2'), winOpen('v-b1')]),
  // ---------------- nicho de entrada (fachada este) ----------------
  W('ent-n', 10.298, 20.075, 10.726, 20.345),
  W('ent-s', 10.298, 21.546, 10.726, 21.816),
  W('ent-w', 9.946, 20.075, 10.298, 21.816, [[20.517, 21.416, 0, DE]]),
  // ---------------- engrosados y esquinas ----------------
  W('p-nw', 2.175, 14.754, 2.326, 14.905), W('p-n', 7.125, 14.754, 7.527, 14.905), W('p-ne', 10.575, 14.754, 10.726, 14.905),
  W('p-k', 10.575, 19.115, 10.726, 20.345), W('p-k2', 10.298, 20.075, 10.575, 20.345),
  W('p-w1', 2.175, 19.115, 2.326, 19.517), W('p-w2', 2.175, 24.515, 2.326, 24.867),
  W('p-sw', 2.175, 30.267, 2.326, 30.418), W('p-s1', 6.326, 30.267, 6.726, 30.418), W('p-s2', 9.978, 30.267, 10.126, 30.418),
  // ---------------- cocina ----------------
  W('k-s', 7.527, 20.075, 9.946, 20.176),
  W('k-pier', 7.125, 19.115, 7.527, 20.176),
  // ---------------- baños y dormitorio 1 ----------------
  W('salon-b2', 2.175, 21.017, 5.326, 21.115),
  W('b2-b1', 2.175, 22.716, 5.226, 22.816),
  W('b1-d1', 2.175, 24.417, 5.226, 24.515, [[3.352, 4.051, 0, DP]]),
  W('dist-w', 5.226, 21.115, 5.326, 30.418, [[21.916, 22.615, 0, DP], [26.467, 27.266, 0, DP]]),
  W('d1-pier', 4.927, 27.367, 5.226, 27.766),
  // ---------------- distribuidor y dormitorios 2-4 ----------------
  W('dist-e', 6.326, 21.715, 6.427, 27.616, [[23.591, 24.390, 0, DP], [24.941, 25.740, 0, DP]]),
  W('d4-n', 6.427, 21.715, 9.946, 21.816),
  W('p-d4', 10.298, 21.546, 10.726, 21.816),
  W('d43-pier', 6.427, 24.467, 6.726, 24.867),
  W('d4-d3', 6.726, 24.615, 10.726, 24.716),
  W('d43-pier-e', 10.575, 24.467, 10.726, 24.867),
  W('d3-d2', 5.326, 27.515, 10.126, 27.616, [[5.427, 6.226, 0, DP]]),
  W('d32-pier-e', 10.575, 27.367, 10.726, 27.515),
  // ---------------- aseo exterior (junto al porche) ----------------
  W('as-w', -0.09, 15.484, 0.056, 18.384),
  W('as-n', 0.056, 15.484, 1.905, 15.760, [[0.230, 1.032, 0, DP]]),
  W('as-s', 0.056, 18.112, 1.905, 18.384, [winOpen('v-aseo')]),
  // ---------------- lavadero y trastero (patio) ----------------
  W('lv-w', -0.09, 25.097, 0.056, 29.396),
  W('lv-n', 0.056, 25.097, 1.905, 25.245, [[1.005, 1.807, 0, DP]]),
  W('lv-m', 0.056, 27.195, 1.905, 27.295, [[1.005, 1.807, 0, DP]]),
  W('lv-s', 0.056, 29.245, 1.905, 29.396, [[1.005, 1.807, 0, DP]]),
];

// Rectángulos interiores (para saber qué caras de muro son exteriores y dónde va techo)
export const INTERIOR = [
  [2.175, 14.754, 10.726, 30.418],
  [9.946, 20.075, 10.298, 21.816],   // jamba de la puerta de entrada
  [0.056, 15.760, 1.905, 18.112],    // aseo
  [0.056, 25.245, 1.905, 29.245],    // lavadero + trastero
];
// Huella de las cubiertas (planta de cada volumen)
export const ROOFS = [
  { id: 'casa', pts: [[1.905, 14.484], [10.996, 14.484], [10.996, 27.785], [10.396, 27.785], [10.396, 30.687], [1.905, 30.687]] },
  { id: 'aseo', pts: [[-0.09, 15.484], [1.905, 15.484], [1.905, 18.384], [-0.09, 18.384]] },
  { id: 'lavadero', pts: [[-0.09, 25.097], [1.905, 25.097], [1.905, 29.396], [-0.09, 29.396]] },
];
// Zona de fachada con aplacado vertical gris (render de la promotora: alrededor de la entrada)
export const CLADDING = [{ x0: 9.9, x1: 11.1, z0: 18.3, z1: 21.9 }];

// ---------------------------------------------------------------------------
//  Puertas abatibles. hinge = eje; closed/open = vectores unitarios de la hoja
// ---------------------------------------------------------------------------
export const DOORS = [
  { id: 'd-entrada', name: 'Puerta de entrada', hinge: [9.946, 21.40], closed: [0, -1], open: [-1, 0], L: 0.86, h: DE, frame: [9.946, 20.517, 10.298, 21.416], entry: true },
  { id: 'd-patio', name: 'Puerta del salón al patio', hinge: [2.175, 20.69], closed: [0, -1], open: [1, 0], L: 0.85, h: DE, frame: [1.905, 19.816, 2.175, 20.715], glass: true },
  { id: 'd-bano2', name: 'Puerta baño 2', hinge: [5.226, 22.595], closed: [0, -1], open: [-1, 0], L: 0.66, h: DP, frame: [5.226, 21.916, 5.326, 22.615] },
  { id: 'd-dorm1', name: 'Puerta dormitorio 1', hinge: [5.226, 26.487], closed: [0, 1], open: [-1, 0], L: 0.76, h: DP, frame: [5.226, 26.467, 5.326, 27.266] },
  { id: 'd-bano1', name: 'Puerta baño 1 (en suite)', hinge: [3.372, 24.417], closed: [1, 0], open: [0, -1], L: 0.66, h: DP, frame: [3.352, 24.417, 4.051, 24.515] },
  { id: 'd-dorm4', name: 'Puerta dormitorio 4', hinge: [6.427, 23.611], closed: [0, 1], open: [1, 0], L: 0.76, h: DP, frame: [6.326, 23.591, 6.427, 24.390] },
  { id: 'd-dorm3', name: 'Puerta dormitorio 3', hinge: [6.427, 25.720], closed: [0, -1], open: [1, 0], L: 0.76, h: DP, frame: [6.326, 24.941, 6.427, 25.740] },
  { id: 'd-dorm2', name: 'Puerta dormitorio 2', hinge: [5.447, 27.616], closed: [1, 0], open: [0, 1], L: 0.76, h: DP, frame: [5.427, 27.515, 6.226, 27.616] },
  { id: 'd-aseo', name: 'Puerta del aseo exterior', hinge: [0.250, 15.760], closed: [1, 0], open: [0, 1], L: 0.76, h: DP, frame: [0.230, 15.484, 1.032, 15.760] },
  { id: 'd-lav', name: 'Puerta del lavadero', hinge: [1.787, 25.245], closed: [-1, 0], open: [0, 1], L: 0.76, h: DP, frame: [1.005, 25.097, 1.807, 25.245] },
  { id: 'd-lav-tr', name: 'Puerta lavadero-trastero', hinge: [1.787, 27.195], closed: [-1, 0], open: [0, -1], L: 0.76, h: DP, frame: [1.005, 27.195, 1.807, 27.295] },
  { id: 'd-trastero', name: 'Puerta del trastero', hinge: [1.787, 29.245], closed: [-1, 0], open: [0, -1], L: 0.76, h: DP, frame: [1.005, 29.245, 1.807, 29.396] },
];

// Armarios empotrados (dibujados en el plano). front = hacia dónde se abren las hojas.
export const WARDROBES = [
  { id: 'a-d1a', name: 'Armario dormitorio 1 (izq.)', x0: 2.326, x1: 2.78, z0: 24.515, z1: 26.12, front: 'e', leaves: 2 },
  { id: 'a-d1b', name: 'Armario dormitorio 1 (dcha.)', x0: 4.63, x1: 5.226, z0: 24.515, z1: 26.32, front: 'w', leaves: 2 },
  { id: 'a-d2', name: 'Armario dormitorio 2', x0: 5.326, x1: 5.93, z0: 28.85, z1: 30.418, front: 'e', leaves: 2 },
  { id: 'a-d3', name: 'Armario dormitorio 3', x0: 6.427, x1: 7.0, z0: 25.92, z1: 27.515, front: 'e', leaves: 2 },
  { id: 'a-d4', name: 'Armario dormitorio 4', x0: 6.427, x1: 7.0, z0: 21.816, z1: 23.42, front: 'e', leaves: 2 },
];

// ---------------------------------------------------------------------------
//  Suelos. 'main' cambia entre porcelánico y tarima; 'wet' siempre porcelánico.
// ---------------------------------------------------------------------------
export const FLOORS = [
  { kind: 'main', r: [2.175, 14.754, 10.726, 30.418] },
  { kind: 'main', r: [9.946, 20.517, 10.298, 21.416] },
  { kind: 'kitchen', r: [7.527, 14.754, 10.726, 20.075] },
  { kind: 'wet', r: [2.175, 21.115, 5.226, 22.716] },   // baño 2
  { kind: 'wet', r: [2.175, 22.816, 5.226, 24.417] },   // baño 1
  { kind: 'wet', r: [0.056, 15.760, 1.905, 18.112] },   // aseo
  { kind: 'wet', r: [0.056, 25.245, 1.905, 29.245] },   // lavadero y trastero
];
// Estancias con alicatado hasta el techo (memoria: cocina, baños y aseos)
export const TILED = [
  { r: [2.175, 21.115, 5.226, 22.716], mat: 'tileB2' },
  { r: [2.175, 22.816, 5.226, 24.417], mat: 'tileB1' },
  { r: [0.056, 15.760, 1.905, 18.112], mat: 'tileB2' },
  { r: [0.056, 25.245, 1.905, 27.195], mat: 'tileB2' },
];
// Paredes de acento (zona de prueba delante de la cara del muro): pared de la TV del salón
// y paredes de los cabeceros de los dormitorios
export const ACCENTS = [
  { name: 'Salón · pared de la TV', r: [2.18, 15.0, 2.30, 21.0] },
  { name: 'Dormitorio 1 · cabecero', r: [2.18, 26.2, 2.30, 30.4] },
  { name: 'Dormitorio 2 · cabecero', r: [10.00, 27.62, 10.12, 30.41] },
  { name: 'Dormitorio 3 · cabecero', r: [7.0, 27.40, 10.72, 27.51] },
  { name: 'Dormitorio 4 · cabecero', r: [7.0, 21.82, 10.72, 21.93] },
];
// Techo normal (2,70) y falso techo (2,50)
export const CEILINGS = [{ r: [2.175, 14.754, 10.726, 30.418], low: false }];
export const LOW_CEILINGS = [
  [2.175, 21.115, 5.226, 24.417],   // baños
  [5.326, 21.017, 6.326, 27.515],   // distribuidor
  [6.326, 20.176, 9.946, 21.715],   // vestíbulo
  [7.527, 14.754, 10.726, 20.075],  // cocina
  [0.056, 15.760, 1.905, 18.112],   // aseo
  [0.056, 25.245, 1.905, 29.245],   // lavadero y trastero
];
// Faldones (bajada del falso techo donde queda abierto): [x0,z0,x1,z1]
export const FASCIAS = [
  [7.517, 14.905, 7.537, 19.115],   // cocina ↔ salón
  [5.326, 20.166, 7.125, 20.186],   // vestíbulo ↔ salón
  [5.326, 21.007, 6.326, 21.027],
];

export const ROOMS = [
  { id: 'salon', name: 'Salón-comedor', c: [4.6, 17.6], spawn: [5.4, 19.6, 0], note: '39,49 m²' },
  { id: 'cocina', name: 'Cocina', c: [9.0, 17.3], spawn: [7.0, 17.3, 270], note: '16,86 m²' },
  { id: 'vestibulo', name: 'Vestíbulo', c: [8.2, 20.95], spawn: [9.4, 20.95, 90], note: '' },
  { id: 'distrib', name: 'Distribuidor', c: [5.8, 24.3], spawn: [5.8, 22.0, 180], note: '5,80 m²' },
  { id: 'dorm1', name: 'Dormitorio 1', c: [3.7, 27.9], spawn: [4.6, 26.9, 90], note: '17,80 m²' },
  { id: 'dorm2', name: 'Dormitorio 2', c: [8.0, 29.0], spawn: [5.8, 28.1, 270], note: '13,36 m²' },
  { id: 'dorm3', name: 'Dormitorio 3', c: [8.6, 26.1], spawn: [6.9, 25.3, 270], note: '11,95 m²' },
  { id: 'dorm4', name: 'Dormitorio 4', c: [8.6, 23.2], spawn: [6.9, 24.0, 270], note: '11,97 m²' },
  { id: 'bano1', name: 'Baño 1', c: [3.7, 23.6], spawn: [3.7, 24.1, 0], note: '4,88 m²' },
  { id: 'bano2', name: 'Baño 2', c: [3.7, 21.9], spawn: [4.8, 22.25, 90], note: '4,88 m²' },
  { id: 'aseo', name: 'Aseo exterior', c: [1.0, 16.9], spawn: [0.65, 16.3, 180], note: '4,17 m²' },
  { id: 'lavadero', name: 'Lavadero', c: [1.0, 26.2], spawn: [1.4, 25.6, 180], note: '3,56 m²' },
  { id: 'trastero', name: 'Trastero', c: [1.0, 28.3], spawn: [1.4, 28.8, 0], note: '3,56 m²' },
  { id: 'porche', name: 'Porche', c: [5.5, 13.0], spawn: [5.5, 13.6, 0], note: '34,64 m²' },
  { id: 'jardin', name: 'Jardín y piscina', c: [8.0, 6.0], spawn: [8.5, 9.5, 180], note: '235,19 m²' },
  { id: 'patio', name: 'Patio', c: [0.9, 21.8], spawn: [0.9, 23.5, 0], note: '12,08 m²' },
  { id: 'acceso', name: 'Acceso y aparcamiento', c: [13.5, 28.0], spawn: [11.5, 31.5, 0], note: '102,76 m²' },
];

// ---------------------------------------------------------------------------
//  Focos empotrados (propuesta) y rejillas de climatización (propuesta)
// ---------------------------------------------------------------------------
export const SPOTS = [
  ['salon', 3.4, 16.0], ['salon', 5.4, 16.0], ['salon', 3.4, 18.2], ['salon', 5.4, 18.2], ['salon', 3.6, 20.0], ['salon', 6.4, 17.0], ['salon', 6.4, 19.2],
  ['cocina', 8.4, 16.0], ['cocina', 9.6, 16.0], ['cocina', 8.4, 18.4], ['cocina', 9.6, 18.4],
  ['pasillo', 7.4, 20.95], ['pasillo', 9.2, 20.95], ['pasillo', 5.8, 22.4], ['pasillo', 5.8, 24.3], ['pasillo', 5.8, 26.4],
  ['dorm1', 3.7, 27.9], ['dorm2', 8.0, 29.0], ['dorm3', 8.6, 26.1], ['dorm4', 8.6, 23.2],
  ['bano1', 3.7, 23.6], ['bano2', 3.7, 21.9], ['aseo', 1.0, 16.9],
];
export const LOW_SPOT_ROOMS = ['cocina', 'pasillo', 'bano1', 'bano2', 'aseo'];
export const GRILLES = [
  // [x, z, largo, orientación 'x'|'z']
  [4.4, 15.2, 1.2, 'x'], [6.6, 18.0, 1.2, 'z'],
  [3.7, 29.6, 0.8, 'x'], [8.0, 29.9, 0.8, 'x'], [9.7, 26.1, 0.8, 'z'], [9.7, 23.2, 0.8, 'z'],
];
export const ROOM_LIGHT_GROUPS = [
  ['salon', 'Salón-comedor'], ['cocina', 'Cocina'], ['pasillo', 'Vestíbulo y distribuidor'], ['dorm1', 'Dormitorio 1'],
  ['dorm2', 'Dormitorio 2'], ['dorm3', 'Dormitorio 3'], ['dorm4', 'Dormitorio 4'], ['bano1', 'Baño 1'], ['bano2', 'Baño 2'], ['aseo', 'Aseo exterior'],
];

// ---------------------------------------------------------------------------
//  Parcela
// ---------------------------------------------------------------------------
export const PARCEL = { x0: -0.09, z0: 0.02, x1: 16.07, z1: 34.18 };
export const POOL = {
  x0: 0.51, z0: 0.52, z1: 3.52, coping: 0.5,
  // medidas a comparar (la del plano y la memoria es 6 × 3). Crece hacia la derecha del plano.
  sizes: [{ id: '6x3', L: 6.0, name: '6 × 3 m (plano)' }, { id: '7.5x3', L: 7.5, name: '7,5 × 3 m' }],
};
export const PORCH = {
  x0: -0.09, x1: 10.996, z0: 11.53, z1: 14.484,
  pillars: [[-0.09, 0.16], [3.35, 3.61], [7.23, 7.48], [10.70, 10.95]],   // x0,x1 (z 11.53..11.79)
  pz0: 11.53, pz1: 11.79,
};
export const GRASS = [[7.01, 0.02, 16.07, 4.02], [-0.09, 4.02, 16.07, 11.48], [12.0, 11.48, 16.07, 21.55]];
export const DRIVE = [12.07, 21.55, 16.07, 34.18];                  // hormigón impreso
export const WOODLOOK = [[-0.09, 11.48, 12.0, 14.484], [-0.09, 14.484, 1.905, 15.484], [10.996, 14.484, 12.07, 34.18], [8.07, 30.687, 9.57, 34.18]];
export const PLANTER = [0.21, 31.89, 7.87, 33.74];
export const GATES = {
  ped: { x0: 8.57, x1: 9.57 },             // puerta peatonal (frente de la parcela, z = 34.18)
  car: { x0: 12.07, x1: 16.07 },           // corredera de vehículos
};

// Límite de la casa (para la cámara y las sombras)
export const BUILDING = { x0: -0.09, x1: 10.996, z0: 11.53, z1: 30.687 };
