import { puntosPregunta, textoCompartir, emojiPuntos } from "./puntos.js";
import { guardarPartida, leerStats, registrarResultado } from "./storage.js";
import { h } from "./dom.js";
import { statsBloque, cuentaAtras, progresoBloque } from "./ui.js";

const nf = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const formato = (n, unidad) => `${nf.format(n)}${unidad ? " " + unidad : ""}`;

export function iniciarJuego({
  juegoId,
  contenedor,
  preguntas,
  fecha,
  partida,
}) {
  let pararCuenta = null;

  const total = preguntas.length;

  function pintar(...nodos) {
    pararCuenta?.();
    pararCuenta = null;
    contenedor.replaceChildren(...nodos);
  }

  function guardar() {
    guardarPartida(juegoId, partida);
  }

  function pantallaInicio() {
    const s = leerStats(juegoId);
    const continuando = partida.respuestas.length > 0;

    pintar(
      h("h1", {}, "HowMuch"),
      h("p", { class: "sub" }, `Reto del ${fecha}`),
      h(
        "p",
        {},
        `${total} preguntas. Adivina la cifra: cuanto más cerca, más puntos (máximo ${total * 100}). ` +
          "Solo se juega una vez al día.",
      ),
      statsBloque(s),
      h(
        "button",
        { class: "primario", onclick: () => pantallaPregunta() },
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
    const paso = p.paso ?? 1;
    const medio =
      p.min + Math.round((p.max - p.min) / 2 / paso) * paso;

    const numero = h("input", {
      type: "number",
      min: p.min,
      max: p.max,
      step: paso,
      value: medio,
      "aria-label": "Tu respuesta",
    });
    const deslizador = h("input", {
      type: "range",
      min: p.min,
      max: p.max,
      step: paso,
      value: medio,
      "aria-label": "Deslizador de respuesta",
    });

    const actualizarRelleno = () => {
      const porcentaje =
        ((Number(deslizador.value) - p.min) / (p.max - p.min)) * 100;
      deslizador.style.setProperty("--porcentaje", `${porcentaje}%`);
    };

    numero.addEventListener("input", () => {
      if (numero.value !== "") {
        deslizador.value = numero.value;
        actualizarRelleno();
      }
    });
    deslizador.addEventListener("input", () => {
      numero.value = deslizador.value;
      actualizarRelleno();
    });
    actualizarRelleno();

    const error = h("p", { class: "error", role: "alert" });

    const confirmar = () => {
      const intento = Number(numero.value);
      if (numero.value === "" || Number.isNaN(intento)) {
        error.textContent = "Escribe un número.";
        return;
      }
      if (intento < p.min || intento > p.max) {
        error.textContent = `Debe estar entre ${formato(p.min)} y ${formato(p.max)}.`;
        return;
      }
      const puntos = puntosPregunta(p, intento);
      partida.respuestas.push({ id: p.id, intento, puntos });
      guardar();
      pantallaRevelar(p, intento, puntos);
    };

    numero.addEventListener("keydown", (e) => {
      if (e.key === "Enter") confirmar();
    });

    pintar(
      h(
        "div",
        { class: "reto-meta" },
        h("span", { class: "etiqueta-reto" }, `HowMuch · Reto del ${fecha}`),
        h(
          "span",
          { class: "puntuacion-actual" },
          `☆ ${partida.respuestas.reduce((suma, r) => suma + r.puntos, 0)} pts`,
        ),
      ),
      progresoBloque(indice + 1, total),
      h("h2", {}, p.texto),
      h(
        "div",
        { class: "entrada-meta" },
        h("span", {}, "Tu estimación calculada"),
        h("span", {}, `Paso: ${formato(paso, p.unidad)}`),
      ),
      h(
        "div",
        { class: "entrada" },
        h(
          "div",
          { class: "control-numero" },
          numero,
          p.unidad ? h("span", { class: "unidad-valor" }, p.unidad) : "",
        ),
      ),
      deslizador,
      h(
        "div",
        { class: "rango" },
        h(
          "span",
          {},
          formato(p.min, p.unidad),
          h("small", {}, "Mínimo"),
        ),
        h(
          "span",
          {},
          formato((p.min + p.max) / 2, p.unidad),
          h("small", {}, "Punto medio"),
        ),
        h(
          "span",
          {},
          formato(p.max, p.unidad),
          h("small", {}, "Máximo"),
        ),
      ),
      h(
        "p",
        { class: "ayuda-entrada" },
        "Escribí tu número o ajustalo con la barra. Enter confirma.",
      ),
      error,
      h(
        "button",
        { class: "primario", onclick: confirmar },
        "Confirmar respuesta →",
      ),
    );
    numero.focus();
  }

  function pantallaRevelar(p, intento, puntos) {
    const ultima = partida.respuestas.length >= total;
    pintar(
      h(
        "div",
        { class: "reto-meta" },
        h("span", { class: "etiqueta-reto" }, `HowMuch · Reto del ${fecha}`),
        h(
          "span",
          { class: "puntuacion-actual" },
          `☆ ${partida.respuestas.reduce((suma, r) => suma + r.puntos, 0)} pts`,
        ),
      ),
      progresoBloque(partida.respuestas.length, total),
      h("h2", {}, p.texto),
      h("p", {}, `Tu respuesta: ${formato(intento, p.unidad)}`),
      h(
        "p",
        { class: "correcta" },
        `Respuesta correcta: ${formato(p.respuesta, p.unidad)}`,
      ),
      h("p", { class: "puntos" }, `${emojiPuntos(puntos)} ${puntos} puntos`),
      h(
        "button",
        {
          class: "primario",
          onclick: () => (ultima ? finalizar() : pantallaPregunta()),
        },
        ultima ? "Ver resultado final" : "Siguiente",
      ),
    );
  }

  function finalizar() {
    partida.terminada = true;
    guardar();
    const totalPuntos = partida.respuestas.reduce(
      (suma, r) => suma + r.puntos,
      0,
    );
    const stats = registrarResultado(juegoId, fecha, totalPuntos);
    pantallaFinal(totalPuntos, stats);
  }

  function pantallaFinal(totalPuntos, stats) {
    const texto = textoCompartir({ fecha, resultados: partida.respuestas });
    const cuenta = cuentaAtras();
    pararCuenta = cuenta.parar;
    const aviso = h("p", { class: "sub", role: "status" });

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
            `${emojiPuntos(r.puntos)} ${p.texto} → tú: ${formato(r.intento, p.unidad)}, ` +
              `correcta: ${formato(p.respuesta, p.unidad)} (${r.puntos} pts)`,
          ),
        ];
      }),
    );

    pintar(
      h("h1", {}, "Reto completado"),
      h("p", { class: "grande" }, `${totalPuntos} / ${total * 100}`),
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
  }

  if (partida.terminada) {
    const totalPuntos = partida.respuestas.reduce(
      (suma, r) => suma + r.puntos,
      0,
    );
    pantallaFinal(totalPuntos, leerStats(juegoId));
  } else {
    pantallaInicio();
  }

  return () => {
    pararCuenta?.();
    pararCuenta = null;
  };
}
