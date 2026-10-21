import { fechaHoy } from "../fecha.js";
import { cargarPreguntas } from "../preguntas.js";
import { prepararPartida as preparar } from "../partida.js";
import {
  guardarPartida,
  leerPartida,
  leerStats,
  registrarResultado,
} from "../storage.js";
import { coincide } from "../nombres.js";
import { foto, precargar } from "../foto.js";
import { h } from "../dom.js";
import { statsBloque, cuentaAtras } from "../ui.js";

export const CANTIDAD = 10;

export const prepararPartida = (todas, fecha, guardada) =>
  preparar(todas, fecha, guardada, CANTIDAD);

export const aciertos = (respuestas) =>
  respuestas.filter((r) => r.acierto).length;

export const puntosTotales = (respuestas) =>
  aciertos(respuestas) - (respuestas.length - aciertos(respuestas));

export const formatoPuntos = (n) =>
  n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0";

export function textoCompartir({ nombre, fecha, respuestas }) {
  const cuadros = respuestas.map((r) => (r.acierto ? "🟩" : "🟥")).join("");
  return `${nombre} ${fecha}\nPuntos: ${formatoPuntos(puntosTotales(respuestas))}\n${cuadros}`;
}

const urlFoto = (carpeta, archivo) =>
  `${import.meta.env.BASE_URL}${carpeta}/${archivo}`;

/**
 * @param {{ id: string, nombre: string, descripcion: string, carpetaFotos?: string }} config
 */
export function crearQuienEs({
  id,
  nombre,
  descripcion,
  carpetaFotos = `fotos/${id}`,
}) {
  return {
    id,
    nombre,
    descripcion,
    reglas: [
      `Cada día hay ${CANTIDAD} jugadores, los mismos para todos.`,
      "Ves una foto recortada, sin la cara. Escribe el nombre y pulsa Responder. No importan mayúsculas ni tildes.",
      "Si aciertas, sumas 1 punto. Si fallas, restas 1. Puedes acabar con puntos negativos.",
      "Después de cada respuesta ves la foto entera y el nombre correcto.",
      "Solo se juega un reto al día. Si recargas a mitad, sigues donde lo dejaste.",
      "Al terminar puedes copiar tu resultado para compartirlo. Jugar días seguidos suma racha.",
    ],

    estado() {
      const partida = leerPartida(id, fechaHoy());
      if (partida?.terminada) {
        return {
          tipo: "hecho",
          texto: `Hoy: ${formatoPuntos(puntosTotales(partida.respuestas))}`,
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
        const todas = await cargarPreguntas(id);
        const fecha = fechaHoy();
        const { partida, preguntas } = prepararPartida(
          todas,
          fecha,
          leerPartida(id, fecha),
        );
        return jugar({
          id,
          nombre,
          carpetaFotos,
          contenedor,
          preguntas,
          fecha,
          partida,
        });
      } catch (error) {
        console.error(error);
        contenedor.textContent =
          "No se pudo cargar el juego. Recarga la página.";
        return () => {};
      }
    },
  };
}

export const quienEsFutbol = crearQuienEs({
  id: "quien-es-futbol",
  nombre: "¿Quién es? Fútbol",
  descripcion: `Adivina el futbolista por una foto sin cara. +1 si aciertas, −1 si fallas.`,
  carpetaFotos: "fotos-quien-es",
});

function jugar({
  id,
  nombre,
  carpetaFotos,
  contenedor,
  preguntas,
  fecha,
  partida,
}) {
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
        `${total} jugadores. Escribe el nombre de cada uno a partir de una foto sin cara. ` +
          "Aciertas: +1 punto. Fallas: −1 punto. Solo se juega una vez al día.",
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
    const p = preguntas[indice];

    const entrada = h("input", {
      type: "text",
      class: "nombre",
      "aria-label": "Nombre del jugador",
      placeholder: "Nombre del jugador",
      autocomplete: "off",
      autocapitalize: "words",
      spellcheck: "false",
      enterkeyhint: "done",
      maxlength: "60",
    });
    const error = h("p", { class: "error", role: "alert" });

    const responder = () => {
      const dijo = entrada.value.trim();
      if (!dijo) {
        error.textContent = "Escribe un nombre.";
        return;
      }
      const acierto = coincide(dijo, p);
      partida.respuestas.push({ id: p.id, dijo, acierto });
      guardar();
      pantallaRevelar(p, dijo, acierto);
    };
    entrada.addEventListener("keydown", (e) => {
      if (e.key === "Enter") responder();
    });

    pintar(
      h(
        "p",
        { class: "sub" },
        `Jugador ${indice + 1} de ${total} · Puntos: ${formatoPuntos(puntosTotales(partida.respuestas))}`,
      ),
      foto(
        urlFoto(carpetaFotos, p.fotoRecortada),
        "Foto recortada de un jugador, sin la cara",
      ),
      p.pista ? h("p", { class: "pista" }, `Pista: ${p.pista}`) : "",
      h("div", { class: "entrada" }, entrada),
      error,
      h("button", { class: "primario", onclick: responder }, "Responder"),
    );

    // En el móvil no se enfoca solo: el teclado taparía la foto.
    if (!matchMedia("(pointer: coarse)").matches) entrada.focus();

    precargar(urlFoto(carpetaFotos, p.foto)); // la entera, para que al responder aparezca al instante
    const siguiente = preguntas[indice + 1];
    if (siguiente) precargar(urlFoto(carpetaFotos, siguiente.fotoRecortada));
  }

  function pantallaRevelar(p, dijo, acierto) {
    const ultima = partida.respuestas.length >= total;
    pintar(
      h(
        "p",
        { class: "sub" },
        `Jugador ${partida.respuestas.length} de ${total} · Puntos: ${formatoPuntos(puntosTotales(partida.respuestas))}`,
      ),
      foto(urlFoto(carpetaFotos, p.foto), `Foto de ${p.nombre}`),
      h(
        "p",
        { class: `veredicto ${acierto ? "veredicto-ok" : "veredicto-mal"}` },
        acierto ? "🟩 Acertaste: +1 punto" : "🟥 Fallaste: −1 punto",
      ),
      h("h2", {}, p.nombre),
      h("p", { class: "tu-respuesta" }, `Tu respuesta: ${dijo}`),
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
    pantallaFinal(
      registrarResultado(id, fecha, puntosTotales(partida.respuestas)),
    );
  }

  function pantallaFinal(stats) {
    const texto = textoCompartir({
      nombre,
      fecha,
      respuestas: partida.respuestas,
    });
    const aviso = h("p", { class: "sub", role: "status" });
    const cuenta = cuentaAtras();
    const nAciertos = aciertos(partida.respuestas);

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
            `${r.acierto ? "🟩" : "🟥"} ${p.nombre} → tu respuesta: ${r.dijo}`,
          ),
        ];
      }),
    );

    pintar(
      h("h1", {}, "Reto completado"),
      h(
        "p",
        { class: "grande" },
        formatoPuntos(puntosTotales(partida.respuestas)),
      ),
      h(
        "p",
        { class: "sub" },
        `${nAciertos} aciertos · ${partida.respuestas.length - nAciertos} fallos`,
      ),
      h("pre", { class: "compartir" }, texto),
      h(
        "button",
        { class: "primario", onclick: compartir },
        "Copiar resultado",
      ),
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
