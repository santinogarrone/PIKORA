// Fotos del juego ¿Quién es?
// Cada jugador tiene DOS archivos: la foto recortada (sin la cara), que se enseña mientras
// se adivina, y la foto entera, que se enseña al responder. Las dos se ven en el mismo marco.

import { h } from "./dom.js";

/** Marco cuadrado con una foto dentro. */
export function foto(src, alt) {
  return h(
    "div",
    { class: "foto" },
    h("img", { src, alt, draggable: "false" }),
  );
}

/** Descarga la imagen antes de necesitarla, para que no parpadee. */
export function precargar(src) {
  const img = new Image();
  img.src = src;
}
