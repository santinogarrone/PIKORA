import { numeroDeDia } from "./fecha.js";

const SEMILLA_BASE = 12345;

export function mulberry32(semilla) {
  return () => {
    semilla |= 0;
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mezcla la lista siempre igual (misma semilla = mismo orden). */
function mezclarConSemilla(lista, semilla) {
  const rng = mulberry32(semilla);
  const copia = [...lista].sort((a, b) => a.id - b.id);
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function preguntasDelDia(todas, fecha, cantidad = 10) {
  if (todas.length < cantidad) {
    throw new Error(
      `Hacen falta al menos ${cantidad} preguntas (hay ${todas.length}).`,
    );
  }
  const orden = mezclarConSemilla(todas, SEMILLA_BASE);
  const inicio = (numeroDeDia(fecha) * cantidad) % orden.length;
  return Array.from(
    { length: cantidad },
    (_, i) => orden[(inicio + i) % orden.length],
  );
}
