import { h } from "./dom.js";

let contador = 0;

export function abrirReglas(juego, { onJugar }) {
  const idTitulo = `reglas-titulo-${++contador}`;
  const dialogo = h("dialog", { class: "reglas", "aria-labelledby": idTitulo });

  const cerrar = () => dialogo.close();
  const jugar = () => {
    dialogo.close();
    onJugar(juego);
  };

  dialogo.append(
    h(
      "div",
      { class: "reglas-contenido" },
      h(
        "div",
        { class: "reglas-cabecera" },
        h(
          "span",
          { class: "reglas-libro", "aria-hidden": "true" },
          "📖",
        ),
        h("h2", { id: idTitulo }, juego.nombre),
      ),
      h("p", {}, juego.descripcion),
      h("ol", {}, ...juego.reglas.map((regla) => h("li", {}, regla))),
      h(
        "div",
        { class: "reglas-acciones" },
        h("button", { class: "secundario", onclick: cerrar }, "Cerrar"),
        h(
          "button",
          { class: "primario", autofocus: "", onclick: jugar },
          "Jugar",
        ),
      ),
    ),
  );

  dialogo.addEventListener("close", () => dialogo.remove());
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo) cerrar();
  });

  document.body.append(dialogo);
  dialogo.showModal();
}
