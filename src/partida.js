import { preguntasDelDia } from "./semilla.js";

export function prepararPartida(todas, fecha, guardada, cantidad) {
  const hayCopia =
    Array.isArray(guardada?.preguntas) &&
    guardada.preguntas.length === cantidad;
  const preguntas = hayCopia
    ? guardada.preguntas
    : preguntasDelDia(todas, fecha, cantidad);
  const partida = guardada
    ? { ...guardada, preguntas }
    : { fecha, respuestas: [], terminada: false, preguntas };
  return { partida, preguntas };
}
