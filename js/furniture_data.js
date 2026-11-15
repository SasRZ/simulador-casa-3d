// ============================================================================
//  MOBILIARIO · datos puros (sin Three.js, para poder comprobarlos desde Node)
//  Unidades: metros. Plano: x → derecha, z → abajo.
//  Cada pieza: centro (x, z) de su huella, w = ancho, d = fondo, h = alto total,
//  face = hacia dónde mira el frente ('n','s','e','w'; en camas, hacia dónde van los pies),
//  legs = altura libre bajo la pieza, y = elevación si va colgada.
//  v = 'base' (siempre) o 'estancia:uso' (solo con ese uso elegido en el panel).
//  styles / notStyles = solo en esos estilos / en todos menos esos.
//  minPlants = aparece si el estilo lleva al menos ese nivel de plantas (1 pocas · 2 normal · 3 muchas).
//  Todo es PROPUESTA: distribuciones tipo hechas con las medidas del plano.
// ============================================================================

// ---------------------------------------------------------------- estilos
// colors: tintes de los materiales del mobiliario (las maderas son un tinte sobre la veta),
// wall: color de las paredes interiores.
export const STYLES = {
  nordico: {
    name: 'Nórdico / escandinavo', plants: 2, wall: 0xf6f4ef,
    note: 'Blancos y beis, roble claro, lana y lino, mucha luz.',
    colors: { oak: 0xffffff, ash: 0xffffff, sofa: 0xc9c4ba, sofaSoft: 0xd8d3c9, sofaLeg: 0xc8a978, metal: 0xe0ded8, rug: 0xece6da, rugEdge: 0xd9d0bf, sage: 0x9fb3a5, mustard: 0xe0c48a, petrol: 0x8fa7b3, linen: 0xe9e2d0, sand: 0xcbb890, cream: 0xf1ebdf, rattan: 0xd4b88a, ceramicSand: 0xe2d6c2, frame: 0xd9c3a0 },
  },
  minimalista: {
    name: 'Minimalista', plants: 1, wall: 0xf5f5f3,
    note: 'Menos es más: blanco, gris y negro, líneas rectas y pocas piezas.',
    colors: { oak: 0xf4f2ee, ash: 0xfafafa, sofa: 0x9a9a98, sofaSoft: 0xb0b0ae, sofaLeg: 0x151515, metal: 0x1e1e1e, rug: 0xdedcd8, rugEdge: 0xcfcdc8, sage: 0x8c8c8c, mustard: 0x2b2b2b, petrol: 0xc8c8c8, linen: 0xf0efec, sand: 0xbdbbb6, cream: 0xf2f2f0, rattan: 0xbdbbb6, ceramicSand: 0xe6e6e4, frame: 0x1e1e1e },
  },
  industrial: {
    name: 'Industrial', plants: 1, wall: 0xd7d4ce,
    note: 'Metal negro, madera maciza oscura, cuero y tonos hormigón.',
    colors: { oak: 0x9a7356, ash: 0xa8825f, sofa: 0x7a4f30, sofaSoft: 0x8a5c3a, sofaLeg: 0x1a1a1a, metal: 0x2a2a2a, rug: 0x5f5f5c, rugEdge: 0x4a4a48, sage: 0x5a6b5a, mustard: 0xa86d3a, petrol: 0x3d4f5c, linen: 0xb9b4aa, sand: 0x8f8a80, cream: 0xd2cdc3, rattan: 0x6b5a48, ceramicSand: 0x8f8b84, frame: 0x222222 },
  },
  japandi: {
    name: 'Japandi', plants: 2, wall: 0xeee8dd,
    note: 'Nórdico + japonés: tonos suaves, madera natural y oscura, espacios despejados.',
    colors: { oak: 0xe9dccb, ash: 0xf2e8d8, sofa: 0xc8bfae, sofaSoft: 0xd6cdbc, sofaLeg: 0x3a2e25, metal: 0x3a3530, rug: 0xdcd3c3, rugEdge: 0xc4b9a6, sage: 0x8e9a7e, mustard: 0xb39a7a, petrol: 0x6f7268, linen: 0xe4dccd, sand: 0xbfb29b, cream: 0xece4d6, rattan: 0xc7b08a, ceramicSand: 0x9c8f7d, frame: 0x3a2e25 },
  },
  mediterraneo: {
    name: 'Mediterráneo', plants: 2, wall: 0xffffff,
    note: 'Blanco encalado, azul, verde oliva y terracota, fibras naturales.',
    colors: { oak: 0xf3e6cc, ash: 0xfff4e0, sofa: 0xe8e0d0, sofaSoft: 0xf2ebdd, sofaLeg: 0x8a6a4a, metal: 0xd8d0c0, rug: 0xd7c39b, rugEdge: 0xc4ad80, sage: 0x7f8a4f, mustard: 0xc8693f, petrol: 0x2f6ea5, linen: 0xf3efe6, sand: 0xd8c7a3, cream: 0xf6f1e6, rattan: 0xcfae78, ceramicSand: 0xc8693f, frame: 0x2f6ea5 },
  },
  boho: {
    name: 'Boho-chic', plants: 3, wall: 0xf3ece0,
    note: 'Muchas plantas, yute, ratán, textiles étnicos y tonos tierra.',
    colors: { oak: 0xead2a8, ash: 0xf0dcb8, sofa: 0xc9a27e, sofaSoft: 0xd8b896, sofaLeg: 0x6b4a33, metal: 0xb08d57, rug: 0xcfb07e, rugEdge: 0xb08a55, sage: 0x7f8f5c, mustard: 0xc98a3a, petrol: 0xb5654a, linen: 0xeadfc8, sand: 0xc9ad84, cream: 0xf1e6d2, rattan: 0xc9a56d, ceramicSand: 0xb5654a, frame: 0xb08d57 },
  },
  rustico: {
    name: 'Rústico', plants: 2, wall: 0xf0e6d4,
    note: 'Madera maciza oscura, hierro, tejidos gruesos y tonos tierra cálidos.',
    colors: { oak: 0x9c7656, ash: 0xa8835f, sofa: 0x8a6a4e, sofaSoft: 0x9e7d5f, sofaLeg: 0x4a3424, metal: 0x3b3633, rug: 0x9b7f63, rugEdge: 0x7a634c, sage: 0x6e7a52, mustard: 0xa3683a, petrol: 0x6b4a3a, linen: 0xd9cbb2, sand: 0xa89070, cream: 0xe6d9c2, rattan: 0x9c7a50, ceramicSand: 0x8a6a4e, frame: 0x4a3424 },
  },
  eclectico: {
    name: 'Ecléctico', plants: 2, wall: 0xf1ece4,
    note: 'Mezcla equilibrada de colores y épocas: terciopelo verde, rosa, mostaza y latón.',
    colors: { oak: 0xd2ab80, ash: 0xe0c9a5, sofa: 0x2f5d50, sofaSoft: 0x3d6f61, sofaLeg: 0xb08d57, metal: 0xb08d57, rug: 0x8a3f4f, rugEdge: 0xd9b04c, sage: 0xd9768a, mustard: 0xe0b23a, petrol: 0x2d4f7a, linen: 0xe8dcc8, sand: 0xc9a77e, cream: 0xf0e6d6, rattan: 0xc9a56d, ceramicSand: 0x2d4f7a, frame: 0xb08d57 },
  },
  vintage: {
    name: 'Vintage', plants: 2, wall: 0xf3ece4,
    note: 'Muebles antiguos restaurados y materiales reutilizados (mesa de palés), en tonos pastel: rosa, azul y verde.',
    colors: { oak: 0xdcc8aa, ash: 0xe6d6bb, sofa: 0xd9a3a8, sofaSoft: 0xe3b5b9, sofaLeg: 0x8a6a4a, metal: 0xc9b48a, rug: 0xe6d8cc, rugEdge: 0xc9a6a8, sage: 0xa8c3a0, mustard: 0xe8d29a, petrol: 0x9db8cf, linen: 0xf0e6dc, sand: 0xd9c4a8, cream: 0xf6eee4, rattan: 0xd4b88a, ceramicSand: 0x9db8cf, frame: 0xc9b48a },
  },
  retro: {
    name: 'Retro (años 50-70)', plants: 1, wall: 0xf2ead8,
    note: 'Formas redondeadas, teca, patas inclinadas, plástico y vinilo; colores vivos: naranja, verde y amarillo.',
    colors: { oak: 0xb88050, ash: 0xc8925c, sofa: 0xc8762e, sofaSoft: 0xd88a40, sofaLeg: 0x5a3a22, metal: 0xc9a24a, rug: 0xd8b04c, rugEdge: 0x8a5a2a, sage: 0x6f8a4a, mustard: 0xe0c03a, petrol: 0x2e7d7a, linen: 0xeadcc0, sand: 0xc8a878, cream: 0xf0e2c6, rattan: 0xc9a56d, ceramicSand: 0x2e7d7a, frame: 0x5a3a22 },
  },
  artdeco: {
    name: 'Art déco', plants: 1, wall: 0xe9e4da,
    note: 'Años 20-30: geometría, mármol, vidrio, dorado, negro y rojo, terciopelo y espejos.',
    colors: { oak: 0x6a4a36, ash: 0x7a5a42, sofa: 0x1f4d45, sofaSoft: 0x2b5f55, sofaLeg: 0xc9a24a, metal: 0xc9a24a, rug: 0x1e1e1e, rugEdge: 0xc9a24a, sage: 0x1f4d45, mustard: 0xc9a24a, petrol: 0x7a1f2b, linen: 0xe8e0d0, sand: 0x9a8a70, cream: 0xf0e8d8, rattan: 0xc9a24a, ceramicSand: 0x1e1e1e, frame: 0xc9a24a },
  },
  nautico: {
    name: 'Náutico', plants: 1, wall: 0xffffff,
    note: 'Costa: blanco, azul marino y arena, madera pintada, ratán y cuerdas.',
    colors: { oak: 0xf5efe6, ash: 0xfbf8f2, sofa: 0xeeede8, sofaSoft: 0xf6f5f0, sofaLeg: 0x8a6a4a, metal: 0xb9b2a3, rug: 0xe8e2d2, rugEdge: 0x1f3a5f, sage: 0x9fc5d6, mustard: 0xc0392b, petrol: 0x1f3a5f, linen: 0xf3efe6, sand: 0xd8c7a3, cream: 0xf7f3ea, rattan: 0xcfae78, ceramicSand: 0x1f3a5f, frame: 0x1f3a5f },
  },
  zen: {
    name: 'Zen', plants: 2, wall: 0xf3efe7,
    note: 'Armonía y sencillez: madera natural, líneas rectas, pocos objetos y tonos neutros claros.',
    colors: { oak: 0xeadbc4, ash: 0xf2e6d2, sofa: 0xd9d2c3, sofaSoft: 0xe4ddcf, sofaLeg: 0xb89a74, metal: 0x8a8070, rug: 0xe2d6bd, rugEdge: 0xcfc0a2, sage: 0x9aa58a, mustard: 0xc9b896, petrol: 0x8e9488, linen: 0xeee7da, sand: 0xcdbf9f, cream: 0xf3ede2, rattan: 0xc7b08a, ceramicSand: 0xb9ab92, frame: 0xb89a74 },
  },
  kitsch: {
    name: 'Kitsch', plants: 1, wall: 0xf7d7e3,
    note: 'Color sin complejos: rosa chicle, azul cielo, rojo y verde manzana, formas llamativas.',
    colors: { oak: 0xffffff, ash: 0xffffff, sofa: 0xff5fa2, sofaSoft: 0xff86ba, sofaLeg: 0xffe04f, metal: 0xffe04f, rug: 0x4fc3f7, rugEdge: 0xffe04f, sage: 0x7ed957, mustard: 0xff3b30, petrol: 0x4fc3f7, linen: 0xfff1f6, sand: 0xffb3d1, cream: 0xfff6fa, rattan: 0xffe04f, ceramicSand: 0x7ed957, frame: 0xffe04f },
  },
};

// Estilos que usan las formas de otro (cambian colores y detalles)
export const STYLE_ALIAS = { retro: 'vintage', artdeco: 'eclectico', nautico: 'mediterraneo', zen: 'japandi', kitsch: 'eclectico' };

// ---------------------------------------------------------------- usos por estancia
const BED_USES = { dos: 'Dos camas de 90 (como el plano)', doble: 'Dormitorio doble (cama 150)', juvenil: 'Juvenil (cama 90 y escritorio)', despacho: 'Despacho / estudio' };
export const VARIANTS = {
  salon: { conv: 'Conversación: dos sofás enfrentados (plano)', tv: 'TV: sofá con chaise mirando a la tele' },
  d2: { ...BED_USES },
  d3: { ...BED_USES },
  d4: { ...BED_USES },
};
export const VARIANT_LABELS = { salon: 'Salón', d2: 'Dormitorio 2', d3: 'Dormitorio 3', d4: 'Dormitorio 4' };

const P = (o) => ({ v: 'base', face: 's', legs: 0, y: 0, ...o });
const LAMP = { color: 0xffd9a0, i: 5, y: 1.5 };

// Piezas tipo para un dormitorio secundario (rx0..rx1 · rz0..rz1 = zona libre de la habitación)
const bed = (id, room, v, x, z, w, d, face, extra = {}) => P({ id, room, v, name: `Cama ${Math.round(w * 100)} × ${Math.round(d * 100)}`, kind: 'bed', x, z, w, d, h: 0.55, legs: 0.15, face, bed: { throw: extra.throw || 'sage' }, ...extra });
const night = (id, room, v, x, z, face) => P({ id, room, v, name: 'Mesita de noche', kind: 'nightstand', x, z, w: 0.42, d: 0.38, h: 0.46, legs: 0.18, face, lampOn: true });
const desk = (id, room, v, x, z, w, face) => P({ id, room, v, name: `Escritorio ${Math.round(w * 100)} × 60`, kind: 'desk', x, z, w, d: 0.60, h: 0.74, legs: 0.70, face });
const chair = (id, room, v, x, z, face) => P({ id, room, v, name: 'Silla de escritorio', kind: 'officeChair', x, z, w: 0.60, d: 0.60, h: 1.0, face });
const shelf = (id, room, v, x, z, w, face) => P({ id, room, v, name: 'Estantería abierta', kind: 'openShelf', x, z, w, d: 0.32, h: 1.80, legs: 0.12, face });
const sofabed = (id, room, v, x, z, face) => P({ id, room, v, name: 'Sofá cama 190 × 85 (para invitados)', kind: 'sofa', x, z, w: 1.90, d: 0.85, h: 0.85, legs: 0.15, face });
const art = (id, room, v, x, z, y, w, h, face) => P({ id, room, v, name: 'Cuadro', kind: 'frame', x, z, y, w, h, d: 0.03, face, wall: true });
const rug = (id, room, v, x, z, w, d, face = 's') => P({ id, room, v, name: `Alfombra ${Math.round(w * 100)} × ${Math.round(d * 100)}`, kind: 'rug', x, z, w, d, h: 0.015, face, walk: true });
const plant = (id, room, x, z, k = 'zz', min = 2, h = 0.8) => P({ id, room, name: 'Planta en maceta', kind: 'plant', plant: k, x, z, w: 0.32, d: 0.32, h, face: 's', minPlants: min });

export const FURNITURE = [
  // ------------------------------------------------------------------ SALÓN · común
  P({ id: 'tv-mueble', name: 'Mueble TV bajo', room: 'salon', kind: 'tvUnit', x: 2.40, z: 17.30, w: 1.80, d: 0.44, h: 0.50, legs: 0.16, face: 'e' }),
  P({ id: 'tv', name: 'TV 65" en la pared', room: 'salon', kind: 'tv', x: 2.20, z: 17.30, w: 1.45, d: 0.05, h: 0.84, y: 0.80, face: 'e', wall: true }),
  P({ id: 'mesa-comedor', name: 'Mesa de comedor 190 × 90', room: 'salon', kind: 'diningTable', x: 6.53, z: 17.45, w: 0.90, d: 1.90, h: 0.75, legs: 0.70, face: 's' }),
  ...[16.85, 17.45, 18.05].flatMap((z, i) => [
    P({ id: `silla-o${i}`, name: 'Silla de comedor', room: 'salon', kind: 'chair', x: 5.86, z, w: 0.45, d: 0.46, h: 0.85, legs: 0.43, face: 'e' }),
    P({ id: `silla-e${i}`, name: 'Silla de comedor', room: 'salon', kind: 'chair', x: 7.20, z, w: 0.45, d: 0.46, h: 0.85, legs: 0.43, face: 'w' }),
  ]),
  plant('planta-salon', 'salon', 2.55, 15.10, 'ficus', 1, 1.6),
  plant('planta-salon2', 'salon', 4.90, 20.75, 'monstera', 2, 1.1),
  plant('planta-salon3', 'salon', 4.10, 20.75, 'palm', 3, 1.7),
  rug('alfombra-salon', 'salon', 'base', 3.95, 17.43, 3.0, 2.0, 'e'),
  P({ id: 'lampara-salon', name: 'Lámpara de pie (luz cálida)', room: 'salon', kind: 'floorLamp', x: 2.50, z: 15.75, w: 0.30, d: 0.30, h: 1.65, face: 'e', light: LAMP, notStyles: ['minimalista'] }),
  // pendientes sobre la mesa (industrial, boho, rústico, ecléctico, vintage)
  ...[17.0, 17.9].map((z, i) => P({ id: `colgante${i}`, name: 'Lámpara colgante sobre la mesa', room: 'salon', kind: 'pendant', x: 6.53, z, y: 1.55, w: 0.55, d: 0.55, h: 0.3, face: 's', light: { color: 0xffd9a0, i: 3 }, styles: ['industrial', 'boho', 'rustico', 'eclectico', 'vintage', 'mediterraneo'] })),
  // pufs (boho, ecléctico)
  P({ id: 'puf1', v: 'salon:conv', name: 'Puf de yute', room: 'salon', kind: 'puff', x: 5.25, z: 16.55, w: 0.45, d: 0.45, h: 0.40, face: 's', styles: ['boho', 'eclectico', 'mediterraneo'] }),

  // ------------------------------------------------------------------ SALÓN · usos
  P({ id: 'sofa-n', v: 'salon:conv', name: 'Sofá 3 plazas 210 × 85', room: 'salon', kind: 'sofa', x: 3.94, z: 15.83, w: 2.10, d: 0.85, h: 0.85, legs: 0.15, face: 's' }),
  P({ id: 'sofa-s', v: 'salon:conv', name: 'Sofá 3 plazas 210 × 85', room: 'salon', kind: 'sofa', x: 3.94, z: 19.03, w: 2.10, d: 0.85, h: 0.85, legs: 0.15, face: 'n' }),
  P({ id: 'mesa-centro-a', v: 'salon:conv', name: 'Mesa de centro 120 × 70', room: 'salon', kind: 'coffeeTable', x: 3.99, z: 17.43, w: 1.20, d: 0.70, h: 0.40, legs: 0.30, face: 's' }),
  P({ id: 'sofa-l', v: 'salon:tv', name: 'Sofá con chaise longue 286 × 170', room: 'salon', kind: 'sofaL', x: 4.85, z: 17.30, w: 2.86, d: 1.70, h: 0.90, legs: 0.16, chaise: 1.0, face: 'w' }),
  P({ id: 'mesa-centro-b', v: 'salon:tv', name: 'Mesa de centro 110 × 55', room: 'salon', kind: 'coffeeTable', x: 3.35, z: 17.30, w: 1.10, d: 0.55, h: 0.40, legs: 0.30, face: 'w' }),
  P({ id: 'butaca', v: 'salon:tv', name: 'Butaca', room: 'salon', kind: 'armchair', x: 3.40, z: 15.50, w: 0.80, d: 0.80, h: 0.80, legs: 0.18, face: 's', notStyles: ['minimalista'] }),

  // ------------------------------------------------------------------ DORMITORIO 1 (principal, en suite)
  P({ id: 'cama-d1', name: 'Cama 150 × 200', room: 'dorm1', kind: 'bed', x: 3.33, z: 28.83, w: 1.50, d: 2.00, h: 0.60, legs: 0.15, face: 'e', bed: { throw: 'sage' } }),
  P({ id: 'cabecero-d1', name: 'Cabecero tapizado', room: 'dorm1', kind: 'headboard', x: 2.36, z: 28.83, w: 1.60, d: 0.07, h: 1.00, y: 0.25, face: 'e', headboard: true }),
  night('mesita-d1a', 'dorm1', 'base', 2.55, 27.80, 'e'), night('mesita-d1b', 'dorm1', 'base', 2.55, 29.86, 'e'),
  P({ id: 'comoda-d1', name: 'Cómoda', room: 'dorm1', kind: 'sideboard', x: 5.00, z: 29.00, w: 1.20, d: 0.45, h: 0.80, legs: 0.18, face: 'w' }),
  { ...art('cuadro-d1', 'dorm1', 'base', 2.20, 28.83, 1.45, 1.0, 0.6, 'e'), notStyles: ['boho', 'eclectico', 'industrial'] },
  rug('alfombra-d1', 'dorm1', 'base', 3.6, 28.83, 2.0, 1.4, 'e'),
  { ...plant('planta-d1', 'dorm1', 4.95, 30.12, 'zz', 2), notStyles: ['japandi'] },

  // ------------------------------------------------------------------ DORMITORIO 2 (libre: x 5,93..10,13 · z 27,62..30,42)
  bed('d2-cama1', 'dorm2', 'd2:dos', 9.13, 28.27, 0.90, 1.90, 'w', { throw: 'mustard' }), bed('d2-cama2', 'dorm2', 'd2:dos', 9.13, 29.77, 0.90, 1.90, 'w'),
  night('d2-mesita', 'dorm2', 'd2:dos', 9.92, 29.02, 'w'),
  desk('d2-mesa', 'dorm2', 'd2:dos', 7.19, 27.92, 1.10, 's'), chair('d2-silla', 'dorm2', 'd2:dos', 7.19, 28.55, 'n'),

  bed('d2-cama-db', 'dorm2', 'd2:doble', 9.126, 29.0, 1.50, 2.00, 'w', { h: 0.60 }),
  P({ id: 'd2-cabecero', v: 'd2:doble', name: 'Cabecero tapizado', room: 'dorm2', kind: 'headboard', x: 10.09, z: 29.0, w: 1.60, d: 0.07, h: 1.00, y: 0.25, face: 'w', headboard: true }),
  night('d2-mes1', 'dorm2', 'd2:doble', 9.92, 27.95, 'w'), night('d2-mes2', 'dorm2', 'd2:doble', 9.92, 30.06, 'w'),
  P({ id: 'd2-comoda', v: 'd2:doble', name: 'Cómoda', room: 'dorm2', kind: 'sideboard', x: 7.6, z: 27.85, w: 1.20, d: 0.45, h: 0.80, legs: 0.18, face: 's' }),
  art('d2-cuadro-db', 'dorm2', 'd2:doble', 10.11, 29.0, 1.35, 1.0, 0.6, 'w'),
  rug('d2-alf-db', 'dorm2', 'd2:doble', 8.2, 29.0, 1.4, 2.0, 'w'),

  bed('d2-cama-j', 'dorm2', 'd2:juvenil', 9.676, 29.30, 0.90, 1.90, 'n', { throw: 'mustard' }),
  night('d2-mes-j', 'dorm2', 'd2:juvenil', 8.95, 30.10, 'n'),
  desk('d2-mesa-j', 'dorm2', 'd2:juvenil', 7.8, 27.92, 1.20, 's'), chair('d2-silla-j', 'dorm2', 'd2:juvenil', 7.8, 28.55, 'n'),
  shelf('d2-est-j', 'dorm2', 'd2:juvenil', 9.2, 27.80, 0.80, 's'),
  rug('d2-alf-j', 'dorm2', 'd2:juvenil', 7.9, 29.5, 1.6, 1.0),

  desk('d2-mesa-o', 'dorm2', 'd2:despacho', 8.726, 30.10, 1.40, 'n'), chair('d2-silla-o', 'dorm2', 'd2:despacho', 8.726, 29.45, 's'),
  sofabed('d2-sofa-o', 'dorm2', 'd2:despacho', 8.40, 28.06, 's'),
  { ...shelf('d2-est-o', 'dorm2', 'd2:despacho', 9.95, 28.95, 0.80, 'w'), notStyles: ['industrial'] },
  P({ id: 'd2-taquilla', v: 'd2:despacho', name: 'Taquilla metálica', room: 'dorm2', kind: 'locker', x: 9.92, z: 28.95, w: 0.80, d: 0.38, h: 1.80, face: 'w', styles: ['industrial'] }),
  art('d2-cuadro-o', 'dorm2', 'd2:despacho', 8.40, 27.64, 1.45, 1.0, 0.6, 's'),

  // ------------------------------------------------------------------ DORMITORIO 3 (libre: x 7,0..10,73 · z 24,72..27,52)
  bed('d3-cama1', 'dorm3', 'd3:dos', 8.40, 26.57, 0.90, 1.90, 'n'), bed('d3-cama2', 'dorm3', 'd3:dos', 9.90, 26.57, 0.90, 1.90, 'n', { throw: 'mustard' }),
  night('d3-mesita', 'dorm3', 'd3:dos', 9.15, 27.30, 'n'),

  bed('d3-cama-db', 'dorm3', 'd3:doble', 9.05, 26.515, 1.50, 2.00, 'n', { h: 0.60 }),
  P({ id: 'd3-cabecero', v: 'd3:doble', name: 'Cabecero tapizado', room: 'dorm3', kind: 'headboard', x: 9.05, z: 27.48, w: 1.60, d: 0.07, h: 1.00, y: 0.25, face: 'n', headboard: true }),
  night('d3-mes1', 'dorm3', 'd3:doble', 7.85, 27.30, 'n'), night('d3-mes2', 'dorm3', 'd3:doble', 10.25, 27.30, 'n'),
  art('d3-cuadro-db', 'dorm3', 'd3:doble', 9.05, 27.50, 1.35, 1.0, 0.6, 'n'),

  bed('d3-cama-j', 'dorm3', 'd3:juvenil', 9.62, 27.065, 0.90, 1.90, 'w', { throw: 'mustard' }),
  night('d3-mes-j', 'dorm3', 'd3:juvenil', 8.40, 27.30, 'n'),
  desk('d3-mesa-j', 'dorm3', 'd3:juvenil', 10.42, 25.70, 1.20, 'w'), chair('d3-silla-j', 'dorm3', 'd3:juvenil', 9.75, 25.70, 'e'),
  shelf('d3-est-j', 'dorm3', 'd3:juvenil', 8.6, 24.88, 0.80, 's'),
  rug('d3-alf-j', 'dorm3', 'd3:juvenil', 8.5, 25.9, 1.6, 1.0),

  desk('d3-mesa-o', 'dorm3', 'd3:despacho', 10.42, 26.27, 1.40, 'w'), chair('d3-silla-o', 'dorm3', 'd3:despacho', 9.72, 26.27, 'e'),
  sofabed('d3-sofa-o', 'dorm3', 'd3:despacho', 8.60, 27.09, 'n'),
  { ...shelf('d3-est-o', 'dorm3', 'd3:despacho', 8.8, 24.88, 0.90, 's'), notStyles: ['industrial'] },
  P({ id: 'd3-taquilla', v: 'd3:despacho', name: 'Taquilla metálica', room: 'dorm3', kind: 'locker', x: 8.8, z: 24.91, w: 0.90, d: 0.38, h: 1.80, face: 's', styles: ['industrial'] }),
  art('d3-cuadro-o', 'dorm3', 'd3:despacho', 8.60, 27.50, 1.45, 1.0, 0.6, 'n'),

  // ------------------------------------------------------------------ DORMITORIO 4 (libre: x 7,0..10,73 · z 21,82..24,62)
  bed('d4-cama1', 'dorm4', 'd4:dos', 8.40, 22.77, 0.90, 1.90, 's', { throw: 'mustard' }), bed('d4-cama2', 'dorm4', 'd4:dos', 9.90, 22.77, 0.90, 1.90, 's'),
  night('d4-mesita', 'dorm4', 'd4:dos', 9.15, 22.03, 's'),

  bed('d4-cama-db', 'dorm4', 'd4:doble', 9.05, 22.816, 1.50, 2.00, 's', { h: 0.60 }),
  P({ id: 'd4-cabecero', v: 'd4:doble', name: 'Cabecero tapizado', room: 'dorm4', kind: 'headboard', x: 9.05, z: 21.85, w: 1.60, d: 0.07, h: 1.00, y: 0.25, face: 's', headboard: true }),
  night('d4-mes1', 'dorm4', 'd4:doble', 7.85, 22.03, 's'), night('d4-mes2', 'dorm4', 'd4:doble', 10.25, 22.03, 's'),
  art('d4-cuadro-db', 'dorm4', 'd4:doble', 9.05, 21.83, 1.35, 1.0, 0.6, 's'),

  bed('d4-cama-j', 'dorm4', 'd4:juvenil', 9.62, 24.165, 0.90, 1.90, 'w'),
  night('d4-mes-j', 'dorm4', 'd4:juvenil', 8.40, 24.40, 'n'),
  desk('d4-mesa-j', 'dorm4', 'd4:juvenil', 10.42, 22.90, 1.20, 'w'), chair('d4-silla-j', 'dorm4', 'd4:juvenil', 9.75, 22.90, 'e'),
  shelf('d4-est-j', 'dorm4', 'd4:juvenil', 8.6, 21.98, 0.80, 's'),
  rug('d4-alf-j', 'dorm4', 'd4:juvenil', 8.5, 23.2, 1.6, 1.0),

  desk('d4-mesa-o', 'dorm4', 'd4:despacho', 10.42, 23.00, 1.40, 'w'), chair('d4-silla-o', 'dorm4', 'd4:despacho', 9.72, 23.00, 'e'),
  sofabed('d4-sofa-o', 'dorm4', 'd4:despacho', 8.60, 22.24, 's'),
  { ...shelf('d4-est-o', 'dorm4', 'd4:despacho', 8.6, 24.45, 0.90, 'n'), notStyles: ['industrial'] },
  P({ id: 'd4-taquilla', v: 'd4:despacho', name: 'Taquilla metálica', room: 'dorm4', kind: 'locker', x: 8.6, z: 24.42, w: 0.90, d: 0.38, h: 1.80, face: 'n', styles: ['industrial'] }),
  art('d4-cuadro-o', 'dorm4', 'd4:despacho', 8.60, 21.83, 1.45, 1.0, 0.6, 's'),

  // ------------------------------------------------------------------ PIEZAS PROPIAS DE CADA ESTILO
  P({ id: 'huevo', name: 'Sillón huevo colgante de ratán', room: 'salon', kind: 'hangingChair', x: 6.95, z: 15.45, w: 0.80, d: 0.80, h: 2.0, face: 'w', styles: ['boho'] }),
  P({ id: 'farol', name: 'Farol de papel de pie', room: 'salon', kind: 'lantern', x: 6.95, z: 15.30, w: 0.45, d: 0.45, h: 0.75, face: 's', styles: ['japandi'] }),
  P({ id: 'cesto-salon', name: 'Cesto de fibra con manta', room: 'salon', kind: 'basket', x: 2.42, z: 18.55, w: 0.40, d: 0.40, h: 0.42, face: 'e', styles: ['mediterraneo', 'boho', 'nordico'] }),
  P({ id: 'biombo-d1', name: 'Biombo de madera y papel', room: 'dorm1', kind: 'screen', x: 4.60, z: 30.15, w: 0.90, d: 0.30, h: 1.70, face: 'n', styles: ['japandi'] }),
  P({ id: 'macrame-d1', name: 'Tapiz de macramé', room: 'dorm1', kind: 'macrame', x: 2.20, z: 28.83, y: 1.30, w: 0.9, d: 0.03, h: 0.8, face: 'e', wall: true, styles: ['boho'] }),
  P({ id: 'galeria-d1', name: 'Pared de cuadros (galería)', room: 'dorm1', kind: 'gallery', x: 2.20, z: 28.83, y: 1.55, w: 1.7, d: 0.03, h: 0.9, face: 'e', wall: true, styles: ['eclectico', 'industrial'] }),
  P({ id: 'baul-d2', v: 'd2:doble', name: 'Baúl de madera a los pies de la cama', room: 'dorm2', kind: 'trunk', x: 7.90, z: 29.0, w: 1.00, d: 0.45, h: 0.48, face: 'w', styles: ['rustico', 'boho', 'vintage'] }),
  P({ id: 'cojines-d3', v: 'd3:juvenil', name: 'Cojines de suelo', room: 'dorm3', kind: 'floorCushion', x: 8.1, z: 25.6, w: 0.6, d: 0.6, h: 0.10, face: 's', walk: true, styles: ['boho', 'japandi'] }),
  P({ id: 'banco-porche', name: 'Banco bajo de madera', room: 'porche', kind: 'lowBench', x: 1.0, z: 12.9, w: 1.6, d: 0.40, h: 0.45, face: 'e', styles: ['japandi', 'rustico', 'mediterraneo', 'boho'] }),

  // ------------------------------------------------------------------ LAVADERO
  P({ id: 'lavadora', name: 'Lavadora carga frontal', room: 'lavadero', kind: 'washer', x: 0.40, z: 26.82, w: 0.60, d: 0.60, h: 0.85, face: 'e' }),

  // ------------------------------------------------------------------ PORCHE
  P({ id: 'mesa-porche', name: 'Mesa de exterior 180 × 90', room: 'porche', kind: 'diningTable', x: 8.6, z: 13.0, w: 1.80, d: 0.90, h: 0.75, legs: 0.70, face: 's' }),
  ...[8.0, 9.2].flatMap((x, i) => [
    P({ id: `silla-pn${i}`, name: 'Silla de exterior', room: 'porche', kind: 'outdoorChair', x, z: 12.3, w: 0.5, d: 0.5, h: 0.85, legs: 0.42, face: 's' }),
    P({ id: `silla-ps${i}`, name: 'Silla de exterior', room: 'porche', kind: 'outdoorChair', x, z: 13.7, w: 0.5, d: 0.5, h: 0.85, legs: 0.42, face: 'n' }),
  ]),
  plant('planta-porche', 'porche', 3.0, 14.15, 'olive', 2, 1.4),
];

export const ROOM_NAMES = {
  salon: 'Salón-comedor', dorm1: 'Dormitorio 1 · principal', dorm2: 'Dormitorio 2', dorm3: 'Dormitorio 3', dorm4: 'Dormitorio 4',
  lavadero: 'Lavadero', porche: 'Porche',
};

// Avisos: [nivel, texto]  (nivel: ok | warn | bad)
export const AVISOS = [
  ['warn', '<b>Decoraciones tipo.</b> Cada estilo cambia colores de paredes, maderas, telas, alfombras, plantas y algunas piezas (lámparas colgantes, pufs…). La distribución sale de las medidas del plano y del uso elegido para cada habitación.'],
  ['ok', '<b>Dormitorios 2, 3 y 4:</b> todas las opciones dejan libres el barrido de la puerta y las hojas del armario empotrado, y pasos de al menos 60 cm.'],
  ['warn', '<b>Comedor junto a la cocina:</b> las sillas del lado este quedan casi en el borde de la cocina. Si os resulta estrecho, se gira la mesa o se pone una redonda.'],
  ['warn', '<b>Dormitorio juvenil 3 y 4:</b> la cama de 90 va bajo el lateral de la ventana; la ventana empieza a 45 cm del suelo (estimado), así que el cabecero queda un poco por encima del antepecho.'],
  ['warn', '<b>Sin datos:</b> enchufes, tomas de TV y cuadro eléctrico no están en el plano. Compruébalo en la obra.'],
];
