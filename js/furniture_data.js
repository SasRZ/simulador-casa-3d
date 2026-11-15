// ============================================================================
//  MOBILIARIO · datos puros (sin Three.js, para poder comprobarlos desde Node)
//  Unidades: metros. Plano: x → derecha, z → abajo.
//  Cada pieza: centro (x, z) de su huella, w = ancho, d = fondo, h = alto total,
//  face = hacia dónde mira el frente ('n','s','e','w'; en camas, hacia dónde van los pies),
//  legs = altura libre bajo la pieza, y = elevación si va colgada.
//  v = variante: 'base' (siempre), 'salonA'/'salonB', 'd1A'/'d1B' (aquí d1 = dormitorio 2).
//  PRIMERA PROPUESTA: copia la distribución que dibuja la promotora. Se cambiará con
//  los gustos de Fernando (Fase 4 del CLAUDE.md).
// ============================================================================

export const VARIANTS = {
  salon: { A: 'A · Como el plano: dos sofás enfrentados y TV en la pared oeste', B: 'B · Sofá con chaise mirando a la TV' },
  d1: { A: 'A · Como el plano: dos camas de 90 y escritorio', B: 'B · Despacho (escritorio, estantería y butaca)' },
};

const P = (o) => ({ v: 'base', face: 's', legs: 0, y: 0, ...o });

export const FURNITURE = [
  // ------------------------------------------------------------------ SALÓN · común
  P({ id: 'tv-mueble', name: 'Mueble TV bajo, roble claro, con patas', room: 'salon', kind: 'tvUnit', x: 2.40, z: 17.30, w: 1.80, d: 0.44, h: 0.50, legs: 0.16, face: 'e' }),
  P({ id: 'tv', name: 'TV 65" en la pared', room: 'salon', kind: 'tv', x: 2.20, z: 17.30, w: 1.45, d: 0.05, h: 0.84, y: 0.80, face: 'e', wall: true }),
  P({ id: 'mesa-comedor', name: 'Mesa de comedor 190 × 90, roble claro', room: 'salon', kind: 'diningTable', x: 6.53, z: 17.45, w: 0.90, d: 1.90, h: 0.75, legs: 0.70, face: 's' }),
  ...[16.85, 17.45, 18.05].flatMap((z, i) => [
    P({ id: `silla-o${i}`, name: 'Silla de comedor', room: 'salon', kind: 'chair', x: 5.86, z, w: 0.45, d: 0.46, h: 0.85, legs: 0.43, face: 'e' }),
    P({ id: `silla-e${i}`, name: 'Silla de comedor', room: 'salon', kind: 'chair', x: 7.20, z, w: 0.45, d: 0.46, h: 0.85, legs: 0.43, face: 'w' }),
  ]),
  P({ id: 'planta-salon', name: 'Planta grande en maceta', room: 'salon', kind: 'plant', plant: 'ficus', x: 2.55, z: 15.10, w: 0.40, d: 0.40, h: 1.60, face: 's' }),
  P({ id: 'alfombra-salon', name: 'Alfombra 200 × 300', room: 'salon', kind: 'rug', x: 3.95, z: 17.43, w: 3.0, d: 2.0, h: 0.015, face: 'e', walk: true }),

  // ------------------------------------------------------------------ SALÓN · variante A (plano)
  P({ id: 'sofa-n', v: 'salonA', name: 'Sofá 3 plazas 210 × 85', room: 'salon', kind: 'sofa', x: 3.94, z: 15.83, w: 2.10, d: 0.85, h: 0.85, legs: 0.15, face: 's' }),
  P({ id: 'sofa-s', v: 'salonA', name: 'Sofá 3 plazas 210 × 85', room: 'salon', kind: 'sofa', x: 3.94, z: 19.03, w: 2.10, d: 0.85, h: 0.85, legs: 0.15, face: 'n' }),
  P({ id: 'mesa-centro-a', v: 'salonA', name: 'Mesa de centro 120 × 70', room: 'salon', kind: 'coffeeTable', x: 3.99, z: 17.43, w: 1.20, d: 0.70, h: 0.40, legs: 0.30, face: 's' }),

  // ------------------------------------------------------------------ SALÓN · variante B
  P({ id: 'sofa-l', v: 'salonB', name: 'Sofá con chaise longue 286 × 170', room: 'salon', kind: 'sofaL', x: 4.85, z: 17.30, w: 2.86, d: 1.70, h: 0.90, legs: 0.16, chaise: 1.0, face: 'w' }),
  P({ id: 'mesa-centro-b', v: 'salonB', name: 'Mesa de centro 110 × 55', room: 'salon', kind: 'coffeeTable', x: 3.35, z: 17.30, w: 1.10, d: 0.55, h: 0.40, legs: 0.30, face: 'w' }),
  P({ id: 'butaca', v: 'salonB', name: 'Butaca', room: 'salon', kind: 'armchair', x: 3.0, z: 15.50, w: 0.80, d: 0.80, h: 0.80, legs: 0.18, face: 's' }),

  // ------------------------------------------------------------------ DORMITORIO 1 (principal, en suite)
  P({ id: 'cama-d1', name: 'Cama 150 × 200', room: 'dorm1', kind: 'bed', x: 3.33, z: 28.83, w: 1.50, d: 2.00, h: 0.60, legs: 0.15, face: 'e', bed: { throw: 'sage' } }),
  P({ id: 'cabecero-d1', name: 'Cabecero tapizado', room: 'dorm1', kind: 'headboard', x: 2.36, z: 28.83, w: 1.60, d: 0.07, h: 1.00, y: 0.25, face: 'e', headboard: true }),
  P({ id: 'mesita-d1a', name: 'Mesita de noche', room: 'dorm1', kind: 'nightstand', x: 2.55, z: 27.80, w: 0.45, d: 0.40, h: 0.46, legs: 0.18, face: 'e', lampOn: true }),
  P({ id: 'mesita-d1b', name: 'Mesita de noche', room: 'dorm1', kind: 'nightstand', x: 2.55, z: 29.86, w: 0.45, d: 0.40, h: 0.46, legs: 0.18, face: 'e', lampOn: true }),
  P({ id: 'comoda-d1', name: 'Cómoda / mueble TV', room: 'dorm1', kind: 'sideboard', x: 5.00, z: 29.00, w: 1.20, d: 0.45, h: 0.80, legs: 0.18, face: 'w' }),

  // ------------------------------------------------------------------ DORMITORIO 2 (variantes)
  P({ id: 'cama-d2a', v: 'd1A', name: 'Cama 90 × 190', room: 'dorm2', kind: 'bed', x: 9.13, z: 28.27, w: 0.90, d: 1.90, h: 0.55, legs: 0.15, face: 'w', bed: { throw: 'mustard' } }),
  P({ id: 'cama-d2b', v: 'd1A', name: 'Cama 90 × 190', room: 'dorm2', kind: 'bed', x: 9.13, z: 29.77, w: 0.90, d: 1.90, h: 0.55, legs: 0.15, face: 'w', bed: { throw: 'sage' } }),
  P({ id: 'mesita-d2', v: 'd1A', name: 'Mesita de noche', room: 'dorm2', kind: 'nightstand', x: 9.90, z: 29.02, w: 0.40, d: 0.35, h: 0.46, legs: 0.18, face: 'w' }),
  P({ id: 'escritorio-d2', name: 'Escritorio 110 × 50', room: 'dorm2', kind: 'desk', x: 7.19, z: 27.87, w: 1.10, d: 0.50, h: 0.74, legs: 0.70, face: 's' }),
  P({ id: 'silla-d2', name: 'Silla de escritorio', room: 'dorm2', kind: 'officeChair', x: 7.19, z: 28.45, w: 0.60, d: 0.60, h: 1.0, face: 'n' }),
  P({ id: 'estanteria-d2', v: 'd1B', name: 'Estantería abierta', room: 'dorm2', kind: 'openShelf', x: 9.95, z: 29.0, w: 0.90, d: 0.35, h: 1.80, legs: 0.16, face: 'w' }),
  P({ id: 'butaca-d2', v: 'd1B', name: 'Butaca de lectura', room: 'dorm2', kind: 'armchair', x: 8.6, z: 29.7, w: 0.80, d: 0.80, h: 0.80, legs: 0.18, face: 'n' }),

  // ------------------------------------------------------------------ DORMITORIOS 3 y 4 (como el plano)
  P({ id: 'cama-d3a', name: 'Cama 90 × 190', room: 'dorm3', kind: 'bed', x: 8.40, z: 26.57, w: 0.90, d: 1.90, h: 0.55, legs: 0.15, face: 'n', bed: { throw: 'sage' } }),
  P({ id: 'cama-d3b', name: 'Cama 90 × 190', room: 'dorm3', kind: 'bed', x: 9.90, z: 26.57, w: 0.90, d: 1.90, h: 0.55, legs: 0.15, face: 'n', bed: { throw: 'mustard' } }),
  P({ id: 'mesita-d3', name: 'Mesita de noche', room: 'dorm3', kind: 'nightstand', x: 9.15, z: 27.30, w: 0.40, d: 0.35, h: 0.46, legs: 0.18, face: 'n' }),
  P({ id: 'cama-d4a', name: 'Cama 90 × 190', room: 'dorm4', kind: 'bed', x: 8.40, z: 22.77, w: 0.90, d: 1.90, h: 0.55, legs: 0.15, face: 's', bed: { throw: 'mustard' } }),
  P({ id: 'cama-d4b', name: 'Cama 90 × 190', room: 'dorm4', kind: 'bed', x: 9.90, z: 22.77, w: 0.90, d: 1.90, h: 0.55, legs: 0.15, face: 's', bed: { throw: 'sage' } }),
  P({ id: 'mesita-d4', name: 'Mesita de noche', room: 'dorm4', kind: 'nightstand', x: 9.15, z: 22.02, w: 0.40, d: 0.35, h: 0.46, legs: 0.18, face: 's' }),

  // ------------------------------------------------------------------ LAVADERO
  P({ id: 'lavadora', name: 'Lavadora carga frontal', room: 'lavadero', kind: 'washer', x: 0.40, z: 26.82, w: 0.60, d: 0.60, h: 0.85, face: 'e' }),

  // ------------------------------------------------------------------ PORCHE
  P({ id: 'mesa-porche', name: 'Mesa de exterior 180 × 90', room: 'porche', kind: 'diningTable', x: 8.6, z: 13.0, w: 1.80, d: 0.90, h: 0.75, legs: 0.70, face: 's' }),
  ...[8.0, 9.2].flatMap((x, i) => [
    P({ id: `silla-pn${i}`, name: 'Silla de exterior', room: 'porche', kind: 'outdoorChair', x, z: 12.3, w: 0.5, d: 0.5, h: 0.85, legs: 0.42, face: 's' }),
    P({ id: `silla-ps${i}`, name: 'Silla de exterior', room: 'porche', kind: 'outdoorChair', x, z: 13.7, w: 0.5, d: 0.5, h: 0.85, legs: 0.42, face: 'n' }),
  ]),
];

export const ROOM_NAMES = {
  salon: 'Salón-comedor', dorm1: 'Dormitorio 1 · principal', dorm2: 'Dormitorio 2', dorm3: 'Dormitorio 3', dorm4: 'Dormitorio 4',
  lavadero: 'Lavadero', porche: 'Porche',
};

// Avisos: [nivel, texto]  (nivel: ok | warn | bad)
export const AVISOS = [
  ['warn', '<b>Primera propuesta.</b> Los muebles copian lo que dibuja la promotora en el plano. Cuando me digas cuántos sois, vuestro estilo y qué queréis en cada habitación, lo cambio.'],
  ['warn', '<b>Comedor junto a la cocina:</b> entre las sillas del lado este y los muebles de cocina quedan unos 10 cm hasta el borde de la cocina. Si la mesa os resulta estrecha de paso, la giramos o usamos una redonda.'],
  ['warn', '<b>Sin datos:</b> enchufes, tomas de TV, termostatos y cuadro eléctrico no están en el plano. No los he tapado a propósito, pero compruébalo en la obra.'],
  ['ok', '<b>Armarios empotrados</b> en los 4 dormitorios (memoria de calidades), en la posición del plano.'],
];
