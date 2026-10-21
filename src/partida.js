import { preguntasDelDia } from "./semilla.js";

export function prepararPartida(todas, fecha, guardada, cantidad) {
  const porId = new Map(todas.map((pregunta) => [pregunta.id, pregunta]));
  const tieneCopiaDelDia =
    Array.isArray(guardada?.preguntas) &&
    guardada.preguntas.length === cantidad;
  const hayCopia =
    tieneCopiaDelDia &&
    guardada.preguntas.every((pregunta) => {
      const actual = porId.get(pregunta.id);
      if (!actual) return false;
      return (
        pregunta.foto === undefined ||
        (pregunta.foto === actual.foto &&
          pregunta.fotoRecortada === actual.fotoRecortada)
      );
    });
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
