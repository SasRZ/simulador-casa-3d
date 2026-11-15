// Posición solar (algoritmo astronómico estándar, precisión ~0,1º) y utilidades de hora local.
const rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545;
const e = rad * 23.4397;

const toDays = (ms) => ms / dayMs - 0.5 + J1970 - J2000;
const solarMeanAnomaly = (d) => rad * (357.5291 + 0.98560028 * d);
const eclipticLongitude = (M) => {
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  return M + C + rad * 102.9372 + Math.PI;
};
const declination = (l) => Math.asin(Math.sin(e) * Math.sin(l));
const rightAscension = (l) => Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l));
const siderealTime = (d, lw) => rad * (280.16 + 360.9856235 * d) - lw;

// Devuelve { az: rumbo en radianes desde el norte en sentido horario, alt: elevación en radianes }
export function sunPosition(utcMs, latDeg, lonDeg) {
  const lw = rad * -lonDeg, phi = rad * latDeg, d = toDays(utcMs);
  const M = solarMeanAnomaly(d), L = eclipticLongitude(M), dec = declination(L), ra = rightAscension(L);
  const H = siderealTime(d, lw) - ra;
  const azSouth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  let az = azSouth + Math.PI; az = ((az % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return { az, alt };
}

// ---- Hora local de Madrid ↔ UTC (con horario de verano automático) ----
const fmtCache = {};
function tzOffsetMs(tz, utcMs) {
  const f = fmtCache[tz] || (fmtCache[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const p = {}; f.formatToParts(new Date(utcMs)).forEach((x) => { p[x.type] = +x.value; });
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000) * 60000;
}
export function localToUtc(tz, dateStr, minutes) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, 0) + minutes * 60000;
  let utc = guess - tzOffsetMs(tz, guess);
  utc = guess - tzOffsetMs(tz, utc);
  return utc;
}
export function sunTimes(tz, dateStr, lat, lon) {
  let rise = null, set = null, prev = null;
  for (let m = 0; m <= 1440; m += 2) {
    const alt = sunPosition(localToUtc(tz, dateStr, m), lat, lon).alt / rad;
    if (prev !== null) {
      if (prev < -0.833 && alt >= -0.833 && rise === null) rise = m;
      if (prev >= -0.833 && alt < -0.833) set = m;
    }
    prev = alt;
  }
  return { rise, set };
}
export const fmtMin = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
export const bearingName = (deg) => ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'][Math.round(deg / 22.5) % 16];
