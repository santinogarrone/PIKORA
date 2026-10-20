import { h } from "./dom.js";
import { pintarHome } from "./home.js";
import { abrirReglas } from "./modal.js";
import { fechaHoy } from "./fecha.js";
import { JUEGOS } from "./juegos/index.js";

const RUTA_JUEGO = /^#\/juego\/([\w-]+)$/;

export function iniciarApp(raiz, juegos = JUEGOS) {
  const fecha = new Intl.DateTimeFormat("es-AG", {
    day: "2-digit",
    month: "numeric",
  })
    .format(new Date(`${fechaHoy()}T12:00:00`))
    .replace(".", "")
    .toUpperCase();
  const contenido = h("main", { class: "contenido-app" });
  const ganados = h("span", { class: "marcador-ganados" }, "0");
  const perdidos = h("span", { class: "marcador-perdidos" }, "0");
  const marcador = h(
    "span",
    {
      class: "marcador-diario",
      "aria-live": "polite",
      "aria-label": "Juegos ganados 0, perdidos 0",
    },
    ganados,
    h("span", { class: "marcador-separador", "aria-hidden": "true" }, "–"),
    perdidos,
  );
  const barra = h(
    "header",
    { class: "barra-app" },
    h(
      "div",
      { class: "barra-app-inner" },
      h("a", { class: "marca", href: "#/" }, "PIKORA"),
      h("span", { class: "reto-diario" }, fecha),
      marcador,
    ),
  );
  const pie = h(
    "footer",
    { class: "pie-app" },
    h(
      "p",
      { class: "pie-etiqueta" },
      "◷ Un reto nuevo cada medianoche · hora de Argentina",
    ),
    h("p", {}, "Sin registro · Una partida al día · ¿Te animás?"),
  );
  raiz.replaceChildren(barra, contenido, pie);

  const actualizarMarcador = () => {
    let cantidadGanados = 0;
    let cantidadPerdidos = 0;
    for (const juego of juegos) {
      const tipo = juego.estado().tipo;
      if (tipo === "ganado") cantidadGanados += 1;
      if (tipo === "perdido") cantidadPerdidos += 1;
    }
    ganados.textContent = String(cantidadGanados);
    perdidos.textContent = String(cantidadPerdidos);
    marcador.setAttribute(
      "aria-label",
      `Juegos ganados ${cantidadGanados}, perdidos ${cantidadPerdidos}`,
    );
  };
  actualizarMarcador();
  window.addEventListener(
    "pikora:resultados-hoy-actualizados",
    actualizarMarcador,
  );

  let limpiar = null;
  let version = 0;

  const irAlJuego = (juego) => {
    location.hash = `#/juego/${juego.id}`;
  };

  async function pintar() {
    const mia = ++version;
    limpiar?.();
    limpiar = null;

    const id = location.hash.match(RUTA_JUEGO)?.[1];
    const juego = juegos.find((j) => j.id === id);

    if (!juego) {
      contenido.classList.remove("contenido-juego");
      document.title = "PIKORA";
      pintarHome(contenido, juegos, {
        onElegir: (j) => abrirReglas(j, { onJugar: irAlJuego }),
      });
      return;
    }

    contenido.classList.add("contenido-juego");
    document.title = `${juego.nombre} | PIKORA`;
    const tarjeta = h("div", { class: "tarjeta" });
    contenido.replaceChildren(
      h("a", { class: "volver", href: "#/" }, "Volver al inicio"),
      tarjeta,
    );

    const destruir = await juego.montar(tarjeta);
    if (mia === version) limpiar = destruir;
    else destruir?.();
  }

  window.addEventListener("hashchange", pintar);
  return pintar();
}
