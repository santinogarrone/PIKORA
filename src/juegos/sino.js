// Juego "Sí o no": se lee una afirmación y se decide si es verdadera o falsa.
// Datos: public/data/<id>.json. Cada elemento: { id, texto, respuesta: true|false, explicacion }.
//
// crearSino() permite hacer varias versiones del mismo juego (normal, de fútbol...):
// cada una con su id, su JSON, su tarjeta y sus estadísticas.

import { fechaHoy } from "../fecha.js";
import { cargarPreguntas } from "../preguntas.js";
import { prepararPartida as preparar } from "../partida.js";
import { guardarPartida, leerPartida, leerStats, registrarResultado } from "../storage.js";
import { h } from "../dom.js";
import { statsBloque, cuentaAtras, progresoBloque } from "../ui.js";

export const CANTIDAD = 5;

export const prepararPartida = (todas, fecha, guardada) => preparar(todas, fecha, guardada, CANTIDAD);

export const aciertos = (respuestas) => respuestas.filter((r) => r.acierto).length;

/** Texto para compartir: una casilla verde por acierto y roja por fallo. */
export function textoCompartir({ nombre = "Sí o no", fecha, respuestas }) {
  const cuadros = respuestas.map((r) => (r.acierto ? "🟩" : "🟥")).join("");
  return `${nombre} ${fecha}\n${aciertos(respuestas)}/${respuestas.length}\n${cuadros}`;
}

/**
 * Crea una versión de Sí o no.
 * @param {{ id: string, nombre: string, descripcion: string }} config
 *   `id` es también el nombre del JSON: public/data/<id>.json
 */
export function crearSino({ id, nombre, descripcion }) {
  return {
    id,
    nombre,
    descripcion,
    reglas: [
      `Cada día hay ${CANTIDAD} afirmaciones, las mismas para todos.`,
      "Lee la afirmación y pulsa Sí si crees que es verdadera, o No si crees que es falsa.",
      "Después de cada respuesta ves si acertaste y el dato que lo explica.",
      `Cada acierto suma 1 punto. El máximo es ${CANTIDAD}.`,
      "Solo se juega un reto al día. Si recargas a mitad, sigues donde lo dejaste.",
      "Al terminar puedes copiar tu resultado para compartirlo. Jugar días seguidos suma racha.",
    ],

    /** Estado de hoy para la tarjeta del Home. Lee solo localStorage. */
    estado() {
      const partida = leerPartida(id, fechaHoy());
      if (partida?.terminada) {
        const puntos = aciertos(partida.respuestas);
        const ganado = puntos >= CANTIDAD / 2;
        return {
          tipo: ganado ? "ganado" : "perdido",
          texto: `${ganado ? "Ganado" : "Perdido"} · Hoy: ${puntos}/${CANTIDAD}`,
        };
      }
      if (partida && partida.respuestas.length > 0) {
        return { tipo: "curso", texto: `En curso: ${partida.respuestas.length}/${CANTIDAD}` };
      }
      return { tipo: "nuevo", texto: "Reto de hoy disponible" };
    },

    /** Pinta el juego en `contenedor`. Devuelve la función que lo limpia al salir. */
    async montar(contenedor) {
      contenedor.textContent = "Cargando...";
      try {
        const todas = await cargarPreguntas(id);
        const fecha = fechaHoy();
        const { partida, preguntas } = prepararPartida(todas, fecha, leerPartida(id, fecha));
        return jugar({ id, nombre, contenedor, preguntas, fecha, partida });
      } catch (error) {
        console.error(error);
        contenedor.textContent = "No se pudo cargar el juego. Recarga la página.";
        return () => {};
      }
    },
  };
}

export const sino = crearSino({
  id: "sino",
  nombre: "Sí o no",
  descripcion: `${CANTIDAD} afirmaciones al día. ¿Verdaderas o falsas?`,
});

export const sinoFutbol = crearSino({
  id: "sino-futbol",
  nombre: "Sí o no · Fútbol",
  descripcion: `${CANTIDAD} afirmaciones de fútbol al día. ¿Verdaderas o falsas?`,
});

// ---------- Pantallas ----------

function jugar({ id, nombre, contenedor, preguntas, fecha, partida }) {
  const total = preguntas.length;
  let pararCuenta = null;

  function pintar(...nodos) {
    pararCuenta?.();
    pararCuenta = null;
    contenedor.replaceChildren(...nodos);
  }

  const guardar = () => guardarPartida(id, partida);

  function pantallaInicio() {
    const continuando = partida.respuestas.length > 0;
    pintar(
      h("h1", {}, nombre),
      h("p", { class: "sub" }, `Reto del ${fecha}`),
      h("p", {}, `${total} afirmaciones. Di si son verdaderas o falsas. Solo se juega una vez al día.`),
      statsBloque(leerStats(id)),
      h(
        "button",
        { class: "primario", onclick: pantallaPregunta },
        continuando ? `Continuar (${partida.respuestas.length}/${total})` : "Empezar",
      ),
    );
    guardar();
  }

  function pantallaPregunta() {
    const indice = partida.respuestas.length;
    if (indice >= total) return finalizar();
    const p = preguntas[indice];

    const responder = (dijo) => {
      const acierto = dijo === p.respuesta;
      partida.respuestas.push({ id: p.id, dijo, acierto });
      guardar();
      pantallaRevelar(p, dijo, acierto);
    };

    pintar(
      h(
        "div",
        { class: "reto-meta" },
        h("span", { class: "etiqueta-reto" }, `${nombre} · Reto del ${fecha}`),
        h("span", { class: "puntuacion-actual" }, `☆ ${aciertos(partida.respuestas)} pts`),
      ),
      progresoBloque(indice + 1, total, "Afirmación"),
      h("h2", {}, p.texto),
      h(
        "div",
        { class: "sino-botones" },
        h("button", { class: "primario opcion-si", onclick: () => responder(true) }, "Sí"),
        h("button", { class: "primario opcion-no", onclick: () => responder(false) }, "No"),
      ),
    );
  }

  function pantallaRevelar(p, dijo, acierto) {
    const ultima = partida.respuestas.length >= total;
    pintar(
      h(
        "div",
        { class: "reto-meta" },
        h("span", { class: "etiqueta-reto" }, `${nombre} · Reto del ${fecha}`),
        h("span", { class: "puntuacion-actual" }, `☆ ${aciertos(partida.respuestas)} pts`),
      ),
      progresoBloque(partida.respuestas.length, total, "Afirmación"),
      h("h2", {}, p.texto),
      h("p", {}, `Tu respuesta: ${dijo ? "Sí" : "No"}`),
      h(
        "p",
        { class: "correcta" },
        `${acierto ? "🟩 Acertaste" : "🟥 Fallaste"}. Es ${p.respuesta ? "verdadero" : "falso"}.`,
      ),
      h("p", {}, p.explicacion),
      h(
        "button",
        { class: "primario", onclick: ultima ? finalizar : pantallaPregunta },
        ultima ? "Ver resultado final" : "Siguiente",
      ),
    );
  }

  function finalizar() {
    partida.terminada = true;
    guardar();
    pantallaFinal(registrarResultado(id, fecha, aciertos(partida.respuestas)));
  }

  function pantallaFinal(stats) {
    const texto = textoCompartir({ nombre, fecha, respuestas: partida.respuestas });
    const aviso = h("p", { class: "sub", role: "status" });
    const cuenta = cuentaAtras();

    const compartir = async () => {
      try {
        await navigator.clipboard.writeText(texto);
        aviso.textContent = "Resultado copiado. Pégalo donde quieras.";
      } catch {
        aviso.textContent = "No se pudo copiar. Selecciona el texto de arriba.";
      }
    };

    const detalle = h(
      "ol",
      { class: "detalle" },
      ...partida.respuestas.flatMap((r) => {
        const p = preguntas.find((q) => q.id === r.id);
        if (!p) return [];
        return [
          h(
            "li",
            {},
            `${r.acierto ? "🟩" : "🟥"} ${p.texto} → es ${p.respuesta ? "verdadero" : "falso"}. ${p.explicacion}`,
          ),
        ];
      }),
    );

    pintar(
      h("h1", {}, "Reto completado"),
      h("p", { class: "grande" }, `${aciertos(partida.respuestas)} / ${total}`),
      h("pre", { class: "compartir" }, texto),
      h("button", { class: "primario", onclick: compartir }, "Copiar resultado"),
      aviso,
      statsBloque(stats),
      h("p", {}, "Próximo reto en ", cuenta.nodo),
      detalle,
    );
    pararCuenta = cuenta.parar;
  }

  if (partida.terminada) pantallaFinal(leerStats(id));
  else pantallaInicio();

  return () => {
    pararCuenta?.();
    pararCuenta = null;
  };
}
