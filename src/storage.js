// Todo lo que se guarda en el navegador (localStorage), en un solo sitio.
// Cada juego tiene sus propias claves, así no se pisan:
//
//   howmuch:<juego>:partida  -> la partida de hoy: { fecha, respuestas: [...], terminada, preguntas: [...] }
//   howmuch:<juego>:stats    -> { racha, mejorRacha, mejorPuntaje, ultimaFecha, jugadas }
//
// Si localStorage no está disponible (ventana privada, bloqueado) el juego
// sigue funcionando, solo que no recuerda nada.

const clave = (juegoId, tipo) => `howmuch:${juegoId}:${tipo}`;

// Antes de existir más de un juego, HowMuch guardaba en estas claves.
// Se siguen leyendo para no perder la racha de quien ya jugaba.
const CLAVES_ANTIGUAS = {
  howmuch: { partida: "howmuch:partida", stats: "howmuch:stats" },
};

function leer(claveCompleta) {
  try {
    const texto = localStorage.getItem(claveCompleta);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function escribir(claveCompleta, valor) {
  try {
    localStorage.setItem(claveCompleta, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento: se ignora */
  }
}

function leerJuego(juegoId, tipo) {
  const nuevo = leer(clave(juegoId, tipo));
  if (nuevo) return nuevo;
  const antigua = CLAVES_ANTIGUAS[juegoId]?.[tipo];
  return antigua ? leer(antigua) : null;
}

// ---- Partida del día ----

/** Devuelve la partida guardada si es de la fecha indicada, si no null. */
export function leerPartida(juegoId, fecha) {
  const p = leerJuego(juegoId, "partida");
  return p && p.fecha === fecha && Array.isArray(p.respuestas) ? p : null;
}

export function guardarPartida(juegoId, partida) {
  escribir(clave(juegoId, "partida"), partida);
}

// ---- Estadísticas ----

const STATS_VACIAS = {
  racha: 0,
  mejorRacha: 0,
  mejorPuntaje: 0,
  ultimaFecha: null,
  jugadas: 0,
};

export function leerStats(juegoId) {
  return { ...STATS_VACIAS, ...(leerJuego(juegoId, "stats") ?? {}) };
}

function diaAnterior(fecha) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Se llama una vez, al terminar el reto del día. */
export function registrarResultado(juegoId, fecha, puntajeTotal) {
  const s = leerStats(juegoId);
  if (s.ultimaFecha === fecha) return s; // ya contado hoy

  s.racha = s.ultimaFecha === diaAnterior(fecha) ? s.racha + 1 : 1;
  s.mejorRacha = Math.max(s.mejorRacha, s.racha);
  // La primera partida fija el récord, aunque sea negativa (en ¿Quién es? se puede restar).
  s.mejorPuntaje =
    s.jugadas === 0 ? puntajeTotal : Math.max(s.mejorPuntaje, puntajeTotal);
  s.ultimaFecha = fecha;
  s.jugadas += 1;

  escribir(clave(juegoId, "stats"), s);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("pikora:resultados-hoy-actualizados"));
  }
  return s;
}
