// ============================================================================
//  CONFIGURACIÓN DEL SIMULADOR  ·  Villas del Sur · Vivienda 04 (4 dormitorios Plus)
//  Grupo Recio · Entrenúcleos UA-19 · Dos Hermanas (Sevilla)
//
//  Todas las unidades están en metros. Las coordenadas del plano son:
//     x → hacia la derecha del plano      z → hacia abajo del plano
//  El origen es la esquina noroeste de la parcela (medido sobre el PDF a escala 1:125,
//  22,677 pt por metro). La parcela ocupa x ≈ -0,09..16,07, z ≈ 0,02..34,18.
//
//  Cualquier valor marcado con  est  es una ESTIMACIÓN, no un dato del plano.
//  Cámbialo aquí cuando tengas la medida real y recarga la página.
// ============================================================================

export const CFG = {
  site: {
    lat: 37.31789969366171,
    lon: -5.923283579475076,
    tz: 'Europe/Madrid',
    // OJO: la flecha de norte del PDF acompaña al plano de situación (las 32 parcelas), donde
    // las parcelas van tumbadas (largo este-oeste) y la nuestra (04) tiene el jardín al ESTE.
    // En el plano grande la casa está girada 90º: "arriba del plano" (jardín y piscina) = ESTE,
    // y la puerta de la parcela da al OESTE, a la calle Lucía Gómez Román (OpenStreetMap).
    // Las calles están giradas ≈ 2º, de ahí 88º.                                     est
    planUpBearingDeg: 88,
    // Punto del plano que corresponde a las coordenadas GPS. Ajustado para que la calle
    // Lucía Gómez Román quede delante de la puerta de la parcela.                   est
    anchorPlan: { x: 8.0, z: 28.7 },
  },

  // ----- Alturas -----------------------------------------------------------
  H: {
    ceiling: 2.70,        // altura libre                                     est
    lowCeiling: 2.50,     // falso techo de pladur (baños, pasillos, cocina)   est
    slab: 0.30,           // forjado de cubierta                              est
    parapet: 0.45,        // peto de la cubierta sobre el forjado              est
    eye: 1.65,            // altura de ojos al caminar
  },

  // ----- Carpinterías (aluminio RPT gris antracita, doble vidrio) -------------
  win: {
    frame: 0.055,
    color: 0x3b3e42,      // antracita (render de la promotora)
    // Tipos de hueco: antepecho y altura (todas estimadas: el plano no las da)       est
    types: {
      dorm: { sill: 0.45, height: 1.75 },     // dormitorios (render: ventana alta)
      bath: { sill: 1.45, height: 0.65 },     // baños y aseo
      kitchen: { sill: 1.05, height: 1.15 },  // cocina (sobre la encimera)
      slider: { sill: 0.0, height: 2.20 },    // corredera del salón al porche
    },
  },
  door: { height: 2.03, thick: 0.035, color: 0xf6f5f2 },              // DM lacado blanco   est
  entryDoor: { height: 2.20, color: 0x3b3e42 },                        // antracita (render)  est
  wardrobeDoorHeight: 2.40,                                            //                     est

  // ----- Cocina (se entrega sin muebles: lo dibujado es la propuesta del plano) -----
  kitchen: {
    baseH: 0.86, counterT: 0.04,                          // encimera a 0,90 m   est
    tallH: 2.30, upperBottom: 1.45, upperTop: 2.30, upperDepth: 0.35,   //        est
  },

  // ----- Parcela -------------------------------------------------------------
  site2: {
    fenceFrontBlock: 0.90,  // murete de bloque enfoscado (memoria de calidades)
    fenceH: 2.00,           // altura total del cerramiento (resto metálico)      est
    medianeraH: 2.00,       // medianeras de citara con pilastras                 est
    poolDepth: 1.40,        // profundidad media de la piscina                    est
    porchH: 2.70,           // altura libre del porche                            est
  },

  // ----- Entorno -------------------------------------------------------------
  env: {
    neighbors: true,        // casas vecinas (copias simplificadas, posición estimada)   est
  },
};

// Lista legible de lo que NO viene del plano (se muestra en el panel "Datos estimados")
export const ESTIMATES = [
  ['Medidas en general', 'el plano no tiene cotas: todo se ha medido a escala 1:125 sobre el PDF vectorial (baños 4,88 m² y dormitorio 2 13,17 m² cuadran con el plano)'],
  ['Altura libre interior', '2,70 m'],
  ['Falso techo', '2,50 m en baños, aseo, distribuidor, vestíbulo y cocina (la memoria dice que lo hay; la altura es estimada)'],
  ['Cubierta', 'plana de grava, no transitable (memoria) · forjado 0,30 m y peto de 0,45 m (estimados)'],
  ['Ventanas de dormitorios', 'ancho 1,20 m (plano) · antepecho 0,45 · alto 1,75 m (estimado según el render)'],
  ['Ventanas de baños y aseo', 'ancho 0,60 m (plano) · antepecho 1,45 · alto 0,65 m'],
  ['Ventanas de cocina', 'norte 1,20 m y este 0,70 m (plano) · antepecho 1,05 · alto 1,15 m'],
  ['Corredera salón → porche', 'ancho 2,50 m (plano) · alto 2,20 m · persiana motorizada (memoria)'],
  ['Puertas de paso', 'hojas 0,63–0,83 m (plano) · alto 2,03 m · DM lacado blanco (memoria)'],
  ['Puerta de entrada', 'hueco 0,90 m (plano) · alto 2,20 m · antracita (render)'],
  ['Armarios empotrados', 'dibujados en el plano en los 4 dormitorios; alto 2,40 m; interior con balda y barra (memoria)'],
  ['Porche', 'pilares de 0,25 m (plano) · cubierta de lamas blancas a 2,70 m (o losa: elige en el panel) · el plano no dice cuál'],
  ['Cristalera del porche (opcional)', 'propuesta: hojas correderas de vidrio con perfil antracita en el frente (entre pilares) y en los dos laterales, de suelo a viga (2,66 m). Modelo y nº de hojas estimados'],
  ['Placas solares (opcional)', 'propuesta: paneles de 1,72 × 1,13 m (≈ 450 W) sobre estructura inclinada 30º, mirando al sur, en filas sobre la cubierta. No vienen en la memoria de calidades'],
  ['Piscina', '6,00 × 3,00 m (plano y memoria) · opción de 7,5 × 3 m para comparar (se alarga hacia las tumbonas, misma posición del lado de la casa) · profundidad 1,40 m · coronación a elegir'],
  ['Cerramiento de parcela', 'frente: murete de 0,90 m + reja metálica hasta 2,00 m · medianeras de ladrillo 2,00 m con pilastras'],
  ['Puertas de la parcela', 'peatonal 0,92 m y corredera de vehículos de 4,0 m (posición del plano, modelo estimado)'],
  ['Cocina', 'se entrega SIN muebles (memoria). Lo que se ve es la distribución del plano, a modo de propuesta (se puede ocultar)'],
  ['Baños', 'sanitarios según el plano; alicatado y colores estimados (Porcelanosa, blanco/gris claro)'],
  ['Orientación', 'deducida del plano de situación y de las calles: el jardín y la piscina miran al ESTE y la entrada de la parcela al OESTE (calle Lucía Gómez Román). CONFÍRMALO'],
  ['Ubicación exacta', 'GPS dado por Fernando; la parcela se ha encajado para que la calle quede delante de la puerta'],
  ['Casas vecinas', 'copias simplificadas de la misma casa en las parcelas 03 (norte) y 05 (sur) (SIN DATO REAL)'],
  ['Rejillas de aire y focos', 'posiciones propuestas (no figuran en el plano)'],
  ['Mobiliario', 'propuesta orientativa basada en el plano de la promotora; se cambia cuando me digas tus gustos'],
];
