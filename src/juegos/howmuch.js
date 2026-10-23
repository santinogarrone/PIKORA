import { fechaHoy } from "../fecha.js";
import { cargarPreguntas } from "../preguntas.js";
import { prepararPartida as preparar } from "../partida.js";
import { puntosPregunta } from "../puntos.js";
import { leerPartida } from "../storage.js";
import { iniciarJuego } from "../juego.js";

export const ID = "howmuch";
export const CANTIDAD = 5;

const PUNTOS_FALLO_10 = puntosPregunta({ min: 0, max: 100, respuesta: 50 }, 60);

export const prepararPartida = (todas, fecha, guardada) =>
  preparar(todas, fecha, guardada, CANTIDAD);

export const howmuch = {
  id: ID,
  nombre: "HowMuch",
  descripcion: `Adivina la cifra en ${CANTIDAD} preguntas. Cuanto más cerca, más puntos.`,
  reglas: [
    `Cada día hay ${CANTIDAD} preguntas, las mismas para todos.`,
    "Cada respuesta es un número. Escríbelo o usa el deslizador y pulsa Confirmar.",
    `Ganas hasta 100 puntos por pregunta y ${CANTIDAD * 100} en total. ` +
      `Si te equivocas un 10 % del rango, ganas ${PUNTOS_FALLO_10} puntos.`,
    "Después de cada respuesta ves la cifra correcta.",
    "Solo se juega un reto al día. Si recargas a mitad, sigues donde lo dejaste.",
    "Al terminar puedes copiar tu resultado para compartirlo. Jugar días seguidos suma racha.",
  ],

  estado() {
    const partida = leerPartida(ID, fechaHoy());
    if (partida?.terminada) {
      const puntos = partida.respuestas.reduce((suma, r) => suma + r.puntos, 0);
      const maximo = CANTIDAD * 100;
      const ganado = puntos >= maximo / 2;
      return {
        tipo: ganado ? "ganado" : "perdido",
        texto: `${ganado ? "Ganado" : "Perdido"} · Hoy: ${puntos}/${maximo}`,
      };
    }
    if (partida && partida.respuestas.length > 0) {
      return {
        tipo: "curso",
        texto: `En curso: ${partida.respuestas.length}/${CANTIDAD}`,
      };
    }
    return { tipo: "nuevo", texto: "Reto de hoy disponible" };
  },

  async montar(contenedor) {
    contenedor.textContent = "Cargando...";
    try {
      const todas = await cargarPreguntas(ID);
      const fecha = fechaHoy();
      const { partida, preguntas } = prepararPartida(
        todas,
        fecha,
        leerPartida(ID, fecha),
      );

      return iniciarJuego({
        juegoId: ID,
        contenedor,
        preguntas,
        fecha,
        partida,
      });
    } catch (error) {
      console.error(error);
      contenedor.textContent = "No se pudo cargar el juego. Recarga la página.";
      return () => {};
    }
  },
};
