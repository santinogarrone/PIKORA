const EXPONENTE = 3;

export function puntosPregunta(pregunta, intento) {
  const rango = pregunta.max - pregunta.min;
  const error = Math.abs(intento - pregunta.respuesta) / rango;
  return Math.round(100 * Math.pow(Math.max(0, 1 - error), EXPONENTE));
}

export function emojiPuntos(puntos) {
  if (puntos >= 90) return "🟩";
  if (puntos >= 60) return "🟨";
  if (puntos >= 30) return "🟧";
  return "🟥";
}

export function textoCompartir({ fecha, resultados }) {
  const total = resultados.reduce((suma, r) => suma + r.puntos, 0);
  const cuadros = resultados.map((r) => emojiPuntos(r.puntos)).join("");
  return `HowMuch ${fecha}\n${total}/${resultados.length * 100}\n${cuadros}`;
}
