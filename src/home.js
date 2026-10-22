import { h } from "./dom.js";

const preguntasFrecuentes = [
  {
    pregunta: "¿Qué es PIKORA?",
    respuesta:
      "Es una colección de mini juegos de trivia diarios para poner a prueba cuánto sabés, sumar puntos y mantener tu racha.",
  },
  {
    pregunta: "¿Cómo se juega?",
    respuesta:
      "Elegí un reto en la portada y seguí sus instrucciones. Hay desafíos de estimar cifras, responder sobre fútbol y reconocer goles históricos.",
  },
  {
    pregunta: "¿Cuándo se renuevan los retos?",
    respuesta:
      "Cada día a la medianoche, según la hora de Argentina, aparecen nuevos retos para todos.",
  },
  {
    pregunta: "¿Puedo jugar más de una vez?",
    respuesta:
      "Cada reto se juega una vez por día. Si salís o recargás la página mientras jugás, tu progreso queda guardado para que puedas continuar.",
  },
  {
    pregunta: "¿Cómo se cuentan los resultados?",
    respuesta:
      "Cada juego tiene su propio puntaje. Al terminar con al menos la mitad de los puntos posibles, cuenta como ganado; con menos, como perdido.",
  },
];

export function pintarHome(contenedor, juegos, { onElegir }) {
  const lista = h(
    "ul",
    { class: "juegos" },
    ...juegos.map((juego) => {
      const estado = juego.estado();
      return h(
        "li",
        {},
        h(
          "button",
          {
            class: `juego${estado.tipo === "ganado" || estado.tipo === "perdido" ? " juego-terminado" : ""}`,
            onclick: () => onElegir(juego),
          },
          estado.tipo === "ganado"
            ? h(
                "span",
                {
                  class: "resultado-juego resultado-ganado",
                  role: "img",
                  "aria-label": "Reto ganado",
                },
                "✓",
              )
            : estado.tipo === "perdido"
              ? h(
                  "span",
                  {
                    class: "resultado-juego resultado-perdido",
                    role: "img",
                    "aria-label": "Reto perdido",
                  },
                  "×",
                )
              : "",
          h("span", { class: "juego-nombre" }, juego.nombre),
          h("span", { class: "juego-desc" }, juego.descripcion),
          h("span", { class: `sello sello-${estado.tipo}` }, estado.texto),
        ),
      );
    }),
  );

  contenedor.replaceChildren(
    h(
      "header",
      { class: "portada" },
      h(
        "div",
        { class: "portada-intro" },
        h("p", { class: "sobrelinea" }, "TRIVIA · UN RETO CADA DÍA"),
        h("h1", {}, "¿Cuánto sabés?"),
        h(
          "p",
          { class: "lema" },
          "Elegí un juego, hacé tu apuesta y sumá puntos.",
        ),
      ),
    ),
    h(
      "section",
      { class: "seccion-juegos", "aria-label": "Juegos" },
      h(
        "div",
        { class: "seccion-titulo" },
        h("h2", {}, "Juegos"),
        h("span", {}, `${juegos.length} retos disponibles`),
      ),
      lista,
    ),
    h(
      "section",
      { class: "preguntas-frecuentes", "aria-labelledby": "titulo-faq" },
      h(
        "h2",
        { id: "titulo-faq", class: "titulo-faq" },
        h("span", {}, "PREGUNTAS FRECUENTES"),
        " SOBRE PIKORA",
      ),
      h(
        "div",
        { class: "faq-panel" },
        ...preguntasFrecuentes.map(({ pregunta, respuesta }) =>
          h(
            "article",
            { class: "faq-item" },
            h(
              "h3",
              { class: "faq-pregunta" },
              h("span", { class: "faq-punto", "aria-hidden": "true" }),
              pregunta,
            ),
            h("p", { class: "faq-respuesta" }, respuesta),
          ),
        ),
      ),
    ),
  );
}
