const ZONA = "America/Argentina/Buenos_Aires";

export function fechaHoy(ahora = new Date()) {
  return ahora.toLocaleDateString("en-CA", { timeZone: ZONA });
}

export function numeroDeDia(fecha) {
  return Math.floor(Date.parse(fecha) / 86400000);
}

export function msHastaMedianoche(ahora = new Date()) {
  const [a, m, d] = fechaHoy(ahora).split("-").map(Number);
  const proxima = Date.UTC(a, m - 1, d + 1, 3, 0, 0);
  return Math.max(0, proxima - ahora.getTime());
}

export function formatearCuentaAtras(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
