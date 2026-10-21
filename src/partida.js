import { preguntasDelDia } from "./semilla.js";

export function prepararPartida(todas, fecha, guardada, cantidad) {
  const idsDisponibles = new Set(todas.map((pregunta) => pregunta.id));
  const tieneCopiaDelDia =
    Array.isArray(guardada?.preguntas) &&
    guardada.preguntas.length === cantidad;
  const hayCopia =
    tieneCopiaDelDia &&
    guardada.preguntas.every((pregunta) =>
      idsDisponibles.has(pregunta.id),
    );
  const preguntas = hayCopia
    ? guardada.preguntas
    : preguntasDelDia(todas, fecha, cantidad);
  const partida =
    tieneCopiaDelDia && !hayCopia
      ? { fecha, respuestas: [], terminada: false, preguntas }
      : guardada
        ? { ...guardada, preguntas }
        : { fecha, respuestas: [], terminada: false, preguntas };
  return { partida, preguntas };
}
