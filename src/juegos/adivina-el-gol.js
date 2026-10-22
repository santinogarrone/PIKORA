import { fechaHoy } from "../fecha.js";
import { cargarPreguntas } from "../preguntas.js";
import { prepararPartida as preparar } from "../partida.js";
import {
  guardarPartida,
  leerPartida,
  leerStats,
  registrarResultado,
} from "../storage.js";
import { h } from "../dom.js";
import { statsBloque, cuentaAtras, progresoBloque } from "../ui.js";

export const CANTIDAD = 3;

export const prepararPartida = (todas, fecha, guardada) =>
  preparar(todas, fecha, guardada, CANTIDAD);

export const aciertos = (respuestas) =>
  respuestas.filter((respuesta) => respuesta.acierto).length;

export function textoCompartir({ fecha, respuestas }) {
  const cuadros = respuestas.map((respuesta) =>
    respuesta.acierto ? "🟩" : "🟥",
  ).join("");
  return `Adivina el gol ${fecha}\n${aciertos(respuestas)}/${respuestas.length}\n${cuadros}`;
}

const urlImagen = (imagen) =>
  `${import.meta.env.BASE_URL}goles/${encodeURIComponent(imagen)}`;

export const adivinaElGol = {
  id: "adivina-el-gol",
  nombre: "Adivina el gol",
  descripcion: "Reconoce goles míticos e históricos a partir de una imagen.",
  reglas: [
    `Cada día hay ${CANTIDAD} goles, los mismos para todos.`,
    "Mira la imagen y elige cuál de las cuatro opciones identifica el gol.",
    "Después de responder verás si acertaste y cuál era la opción correcta.",
    `Cada acierto suma 1 punto. El máximo es ${CANTIDAD}.`,
    "Solo se juega un reto al día. Si recargas a mitad, sigues donde lo dejaste.",
    "Al terminar puedes copiar tu resultado para compartirlo. Jugar días seguidos suma racha.",
  ],

  estado() {
    const partida = leerPartida(this.id, fechaHoy());
    if (partida?.terminada) {
      const puntos = aciertos(partida.respuestas);
      const ganado = puntos >= CANTIDAD / 2;
      return {
        tipo: ganado ? "ganado" : "perdido",
        texto: `${ganado ? "Ganado" : "Perdido"} · Hoy: ${puntos}/${CANTIDAD}`,
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
      const todas = await cargarPreguntas(this.id);
      if (todas.length < CANTIDAD) {
        contenedor.replaceChildren(
          h("h1", {}, this.nombre),
          h("p", { class: "sub" }, "Juego en preparación"),
          h(
            "p",
            {},
            `Agrega al menos ${CANTIDAD} goles para habilitar el reto diario. ` +
              "Encontrarás el formato y las instrucciones en README.md.",
          ),
          h("p", { class: "sub" }, `Goles cargados: ${todas.length}/${CANTIDAD}`),
        );
        return () => {};
      }

      const fecha = fechaHoy();
      const { partida, preguntas } = prepararPartida(
        todas,
        fecha,
        leerPartida(this.id, fecha),
      );
      return jugar({
        id: this.id,
        nombre: this.nombre,
        contenedor,
        preguntas,
        fecha,
        partida,
      });
    } catch (error) {
      console.error(error);
      contenedor.textContent =
        "No se pudo cargar el juego. Revisa public/data/adivina-el-gol.json y ejecuta npm run validar.";
      return () => {};
    }
  },
};

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
      h(
        "p",
        {},
        `${total} goles. Mira cada imagen y elige una de las cuatro opciones. ` +
          "Cada acierto suma 1 punto. Solo se juega una vez al día.",
      ),
      statsBloque(leerStats(id)),
      h(
        "button",
        { class: "primario", onclick: pantallaPregunta },
        continuando
          ? `Continuar (${partida.respuestas.length}/${total})`
          : "Empezar",
      ),
    );
    guardar();
  }

  function pantallaPregunta() {
    const indice = partida.respuestas.length;
    if (indice >= total) return finalizar();
    const pregunta = preguntas[indice];
    const errorImagen = h("p", {
      class: "error",
      role: "alert",
      "aria-live": "polite",
    });
    const imagen = h("img", {
      class: "imagen-gol",
      src: urlImagen(pregunta.imagen),
      alt: `Imagen del gol ${indice + 1}`,
      loading: "eager",
    });
    imagen.addEventListener("error", () => {
      errorImagen.textContent =
        `No se encontró la imagen public/goles/${pregunta.imagen}.`;
    });

    const responder = (opcion) => {
      const acierto = opcion === pregunta.respuesta;
      partida.respuestas.push({ id: pregunta.id, opcion, acierto });
      guardar();
      pantallaRevelar(pregunta, opcion, acierto);
    };

    pintar(
      h(
        "div",
        { class: "reto-meta" },
        h("span", { class: "etiqueta-reto" }, `${nombre} · Reto del ${fecha}`),
        h(
          "span",
          { class: "puntuacion-actual" },
          `☆ ${aciertos(partida.respuestas)} pts`,
        ),
      ),
      progresoBloque(indice + 1, total, "Gol"),
      imagen,
      errorImagen,
      h(
        "div",
        {
          class: "opciones-gol",
          role: "group",
          "aria-label": "Opciones de respuesta",
        },
        ...pregunta.opciones.map((opcion) =>
          h(
            "button",
            {
              class: "primario opcion-gol",
              type: "button",
              onclick: () => responder(opcion),
            },
            opcion,
          ),
        ),
      ),
    );
  }

  function pantallaRevelar(pregunta, opcion, acierto) {
    const ultima = partida.respuestas.length >= total;
    pintar(
      h(
        "div",
        { class: "reto-meta" },
        h("span", { class: "etiqueta-reto" }, `${nombre} · Reto del ${fecha}`),
        h(
          "span",
          { class: "puntuacion-actual" },
          `☆ ${aciertos(partida.respuestas)} pts`,
        ),
      ),
      progresoBloque(partida.respuestas.length, total, "Gol"),
      h("img", {
        class: "imagen-gol",
        src: urlImagen(pregunta.imagen),
        alt: `Imagen del gol ${partida.respuestas.length}`,
      }),
      h(
        "p",
        { class: acierto ? "correcta" : "veredicto veredicto-mal" },
        acierto ? "🟩 ¡Acertaste! +1 punto" : "🟥 No era esa opción.",
      ),
      h("p", {}, `Tu respuesta: ${opcion}`),
      h("p", { class: "correcta" }, `Respuesta correcta: ${pregunta.respuesta}`),
      h(
        "button",
        {
          class: "primario",
          onclick: ultima ? finalizar : pantallaPregunta,
        },
        ultima ? "Ver resultado final" : "Siguiente",
      ),
    );
  }

  function finalizar() {
    partida.terminada = true;
    guardar();
    pantallaFinal(
      registrarResultado(id, fecha, aciertos(partida.respuestas)),
    );
  }

  function pantallaFinal(stats) {
    const texto = textoCompartir({ fecha, respuestas: partida.respuestas });
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
      ...partida.respuestas.flatMap((respuesta) => {
        const pregunta = preguntas.find((p) => p.id === respuesta.id);
        if (!pregunta) return [];
        return [
          h(
            "li",
            {},
            `${respuesta.acierto ? "🟩" : "🟥"} ${pregunta.respuesta} · ` +
              `Tu respuesta: ${respuesta.opcion}`,
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
