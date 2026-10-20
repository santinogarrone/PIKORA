import { h } from "./dom.js";
import { msHastaMedianoche, formatearCuentaAtras } from "./fecha.js";

function stat(etiqueta, valor) {
  return h(
    "div",
    { class: "stat" },
    h("strong", {}, String(valor)),
    h("span", {}, etiqueta),
  );
}

export function statsBloque(s) {
  return h(
    "div",
    { class: "stats" },
    stat("Racha", s.racha),
    stat("Mejor racha", s.mejorRacha),
    stat("Mejor puntaje", s.mejorPuntaje),
  );
}

export function progresoBloque(indice, total, etiqueta = "Pregunta") {
  const progreso = Math.round((indice / total) * 100);
  return h(
    "div",
    {
      class: "progreso",
      role: "progressbar",
      "aria-label": `${etiqueta} ${indice} de ${total}`,
      "aria-valuemin": "0",
      "aria-valuemax": String(total),
      "aria-valuenow": String(indice),
    },
    h(
      "div",
      { class: "progreso-info" },
      h("span", {}, `${etiqueta} ${indice} de ${total}`),
      h("span", {}, `${progreso}% completado`),
    ),
    h(
      "div",
      { class: "progreso-track", "aria-hidden": "true" },
      ...Array.from({ length: total }, (_, i) =>
        h("span", {
          class: [
            "progreso-segmento",
            i < indice ? "activo" : "",
            i === indice - 1 ? "actual" : "",
          ]
            .filter(Boolean)
            .join(" "),
        }),
      ),
    ),
  );
}

export function cuentaAtras() {
  const nodo = h("strong", {}, "");
  const actualizar = () => {
    const ms = msHastaMedianoche();
    nodo.textContent = formatearCuentaAtras(ms);
    if (ms === 0) location.reload();
  };
  actualizar();
  const timer = setInterval(actualizar, 1000);
  return { nodo, parar: () => clearInterval(timer) };
}
