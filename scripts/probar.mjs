// Pruebas de la lógica sin navegador. Uso: npm run test
import assert from "node:assert/strict";
import {
  fechaHoy,
  numeroDeDia,
  msHastaMedianoche,
  formatearCuentaAtras,
} from "../src/fecha.js";
import { preguntasDelDia } from "../src/semilla.js";
import { puntosPregunta, emojiPuntos, textoCompartir } from "../src/puntos.js";

// localStorage de mentira para probar storage.js
const memoria = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => memoria.set(k, String(v)),
};
const { leerPartida, guardarPartida, leerStats, registrarResultado } =
  await import("../src/storage.js");

let pruebas = 0;
const ok = (nombre, fn) => {
  fn();
  pruebas++;
  console.log("ok -", nombre);
};

// ---- fechas ----
ok(
  "fechaHoy usa hora argentina (02:00 UTC sigue siendo el día anterior)",
  () => {
    assert.equal(fechaHoy(new Date("2026-10-17T02:00:00Z")), "2026-10-16");
    assert.equal(fechaHoy(new Date("2026-10-17T03:00:00Z")), "2026-10-17");
  },
);

ok("msHastaMedianoche: a las 11:55 argentinas faltan 12h05m", () => {
  assert.equal(
    msHastaMedianoche(new Date("2026-10-17T14:55:00Z")),
    (12 * 60 + 5) * 60000,
  );
});

ok("formatearCuentaAtras", () => {
  assert.equal(formatearCuentaAtras(3661000), "01:01:01");
});

ok("numeroDeDia aumenta de uno en uno", () => {
  assert.equal(numeroDeDia("2026-10-18") - numeroDeDia("2026-10-17"), 1);
});

// ---- semilla ----
const lista = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));

ok("misma fecha = mismas preguntas, aunque cambie el orden de entrada", () => {
  const a = preguntasDelDia(lista, "2026-10-17", 10).map((p) => p.id);
  const b = preguntasDelDia([...lista].reverse(), "2026-10-17", 10).map(
    (p) => p.id,
  );
  assert.deepEqual(a, b);
});

ok("fechas distintas = preguntas distintas", () => {
  const a = preguntasDelDia(lista, "2026-10-17", 10).map((p) => p.id);
  const b = preguntasDelDia(lista, "2026-10-18", 10).map((p) => p.id);
  assert.notDeepEqual(a, b);
});

ok("10 días seguidos con 100 preguntas no repiten ninguna", () => {
  const vistas = new Set();
  for (let d = 17; d < 27; d++) {
    for (const p of preguntasDelDia(lista, `2026-10-${d}`, 10)) {
      assert.ok(!vistas.has(p.id), `repetida: ${p.id}`);
      vistas.add(p.id);
    }
  }
  assert.equal(vistas.size, 100);
});

ok("un día tiene 10 preguntas sin repetir dentro del día", () => {
  const ids = preguntasDelDia(lista, "2026-12-31", 10).map((p) => p.id);
  assert.equal(new Set(ids).size, 10);
});

ok("con menos preguntas que las pedidas lanza error claro", () => {
  assert.throws(
    () => preguntasDelDia(lista.slice(0, 5), "2026-10-17", 10),
    /al menos 10/,
  );
});

// ---- puntos ----
const preg = { respuesta: 50, min: 0, max: 100 };

ok("respuesta exacta = 100 puntos", () => {
  assert.equal(puntosPregunta(preg, 50), 100);
});

ok("más lejos = menos puntos, nunca negativos", () => {
  const cerca = puntosPregunta(preg, 55);
  const lejos = puntosPregunta(preg, 90);
  const maximo = puntosPregunta({ respuesta: 0, min: 0, max: 100 }, 100);
  assert.ok(cerca > lejos && lejos >= 0);
  assert.equal(maximo, 0);
});

ok("emojis por tramo", () => {
  assert.deepEqual([95, 70, 40, 5].map(emojiPuntos), ["🟩", "🟨", "🟧", "🟥"]);
});

ok("textoCompartir", () => {
  const t = textoCompartir({
    fecha: "2026-10-17",
    resultados: [{ puntos: 100 }, { puntos: 10 }],
  });
  assert.equal(t, "HowMuch 2026-10-17\n110/200\n🟩🟥");
});

// ---- storage ----
ok("partida: se recupera solo si es de la misma fecha", () => {
  guardarPartida("howmuch", {
    fecha: "2026-10-17",
    respuestas: [{ id: 1, intento: 5, puntos: 80 }],
    terminada: false,
  });
  assert.equal(leerPartida("howmuch", "2026-10-17").respuestas.length, 1);
  assert.equal(leerPartida("howmuch", "2026-10-18"), null);
});

ok("racha: días seguidos suman, un hueco la reinicia", () => {
  memoria.clear();
  assert.equal(registrarResultado("howmuch", "2026-10-17", 500).racha, 1);
  assert.equal(registrarResultado("howmuch", "2026-10-18", 700).racha, 2);
  assert.equal(registrarResultado("howmuch", "2026-10-18", 999).racha, 2); // mismo día: no cuenta dos veces
  assert.equal(registrarResultado("howmuch", "2026-10-20", 300).racha, 1); // se saltó un día
  const s = leerStats("howmuch");
  assert.equal(s.mejorRacha, 2);
  assert.equal(s.mejorPuntaje, 700);
  assert.equal(s.jugadas, 3);
});

ok("racha cruza fin de mes y de año", () => {
  memoria.clear();
  registrarResultado("howmuch", "2026-12-31", 100);
  assert.equal(registrarResultado("howmuch", "2027-01-01", 100).racha, 2);
});

ok("storage con datos corruptos no rompe", () => {
  memoria.set("howmuch:howmuch:stats", "{esto no es json");
  memoria.set("howmuch:howmuch:partida", "tampoco");
  assert.equal(leerStats("howmuch").racha, 0);
  assert.equal(leerPartida("howmuch", "2026-10-17"), null);
});

// ---- catálogo de juegos ----
const { JUEGOS } = await import("../src/juegos/index.js");
const { howmuch, CANTIDAD, prepararPartida } =
  await import("../src/juegos/howmuch.js");

ok("catálogo: cada juego tiene lo que el Home y el popup necesitan", () => {
  assert.ok(JUEGOS.length >= 1);
  const ids = new Set();
  for (const j of JUEGOS) {
    assert.match(j.id, /^[\w-]+$/, "id sin espacios ni caracteres raros");
    assert.ok(!ids.has(j.id), `id repetido: ${j.id}`);
    ids.add(j.id);
    assert.ok(j.nombre && j.descripcion);
    assert.ok(Array.isArray(j.reglas) && j.reglas.length > 0);
    assert.equal(typeof j.estado, "function");
    assert.equal(typeof j.montar, "function");
  }
});

ok(
  "reglas de HowMuch: el ejemplo del 10 % coincide con la fórmula real",
  () => {
    assert.ok(howmuch.reglas.join(" ").includes("ganas 73 puntos"));
    assert.equal(puntosPregunta({ min: 0, max: 100, respuesta: 50 }, 60), 73);
  },
);

ok("estado del Home: nuevo, en curso, ganado y perdido", () => {
  memoria.clear();
  const hoy = fechaHoy();
  assert.deepEqual(howmuch.estado(), {
    tipo: "nuevo",
    texto: "Reto de hoy disponible",
  });

  // Entrar al juego y salir sin responder no cuenta como "en curso".
  guardarPartida("howmuch", { fecha: hoy, respuestas: [], terminada: false });
  assert.equal(howmuch.estado().tipo, "nuevo");

  guardarPartida("howmuch", {
    fecha: hoy,
    respuestas: [{ puntos: 50 }, { puntos: 60 }, { puntos: 70 }],
    terminada: false,
  });
  assert.deepEqual(howmuch.estado(), {
    tipo: "curso",
    texto: `En curso: 3/${CANTIDAD}`,
  });

  const todas = Array.from({ length: CANTIDAD }, () => ({ puntos: 84 }));
  guardarPartida("howmuch", { fecha: hoy, respuestas: todas, terminada: true });
  assert.deepEqual(howmuch.estado(), {
    tipo: "ganado",
    texto: `Ganado · Hoy: 840/${CANTIDAD * 100}`,
  });

  // Una partida de ayer no cuenta hoy.
  guardarPartida("howmuch", {
    fecha: "2000-01-01",
    respuestas: todas,
    terminada: true,
  });
  assert.equal(howmuch.estado().tipo, "nuevo");
});

ok("prepararPartida: partida nueva guarda las preguntas del día", () => {
  const { partida, preguntas } = prepararPartida(lista, "2026-10-17", null);
  assert.equal(preguntas.length, CANTIDAD);
  assert.deepEqual(partida.preguntas, preguntas);
  assert.deepEqual(
    [partida.fecha, partida.respuestas.length, partida.terminada],
    ["2026-10-17", 0, false],
  );
});

ok(
  "prepararPartida: si cambias el JSON a mitad de día, quien ya empezó conserva sus preguntas",
  () => {
    const { partida: inicial } = prepararPartida(lista, "2026-10-17", null);
    const ampliada = [
      ...lista,
      ...Array.from({ length: 50 }, (_, i) => ({ id: 1000 + i })),
    ];

    // Sin copia, las preguntas del día cambiarían al ampliar la lista...
    const sinCopia = prepararPartida(
      ampliada,
      "2026-10-17",
      null,
    ).preguntas.map((p) => p.id);
    assert.notDeepEqual(
      sinCopia,
      inicial.preguntas.map((p) => p.id),
    );

    // ...con la copia guardada, no.
    const { preguntas } = prepararPartida(ampliada, "2026-10-17", inicial);
    assert.deepEqual(preguntas, inicial.preguntas);
  },
);

ok(
  "prepararPartida: reemplaza una copia guardada si sus preguntas ya no existen",
  () => {
    const anteriores = lista.slice(0, CANTIDAD);
    const guardada = {
      fecha: "2026-10-17",
      preguntas: anteriores,
      respuestas: [{ id: anteriores[0].id, acierto: false }],
      terminada: false,
    };
    const actuales = lista.map((pregunta) => ({
      ...pregunta,
      id: pregunta.id + 1000,
    }));
    const { partida, preguntas } = prepararPartida(
      actuales,
      "2026-10-17",
      guardada,
    );

    assert.deepEqual(preguntas, partida.preguntas);
    assert.equal(partida.respuestas.length, 0);
    assert.equal(partida.terminada, false);
    assert.ok(preguntas.every((pregunta) => pregunta.id >= 1001));
  },
);

ok(
  "prepararPartida: partida antigua sin copia recibe las preguntas de hoy y conserva sus respuestas",
  () => {
    const antigua = {
      fecha: "2026-10-17",
      respuestas: [{ id: 5, intento: 1, puntos: 40 }],
      terminada: false,
    };
    const { partida, preguntas } = prepararPartida(
      lista,
      "2026-10-17",
      antigua,
    );
    assert.equal(preguntas.length, CANTIDAD);
    assert.deepEqual(partida.respuestas, antigua.respuestas);
    assert.deepEqual(partida.preguntas, preguntas);
  },
);

// ---- varios juegos ----
ok("storage: cada juego guarda lo suyo sin pisar al otro", () => {
  memoria.clear();
  guardarPartida("howmuch", {
    fecha: "2026-10-17",
    respuestas: [{ id: 1 }],
    terminada: false,
  });
  assert.equal(leerPartida("sino", "2026-10-17"), null);
  registrarResultado("sino", "2026-10-17", 7);
  assert.equal(leerStats("howmuch").jugadas, 0);
  assert.equal(leerStats("sino").mejorPuntaje, 7);
});

ok(
  "storage: HowMuch sigue leyendo las claves antiguas (sin perder la racha)",
  () => {
    memoria.clear();
    memoria.set(
      "howmuch:stats",
      JSON.stringify({
        racha: 4,
        mejorRacha: 4,
        mejorPuntaje: 800,
        ultimaFecha: "2026-10-16",
        jugadas: 4,
      }),
    );
    assert.equal(leerStats("howmuch").racha, 4);
    assert.equal(leerStats("sino").racha, 0); // otro juego no hereda nada
    assert.equal(registrarResultado("howmuch", "2026-10-17", 500).racha, 5);
    assert.equal(leerStats("howmuch").racha, 5);
  },
);

// ---- Sí o no ----
const {
  sino,
  CANTIDAD: CANT_SINO,
  aciertos,
  textoCompartir: compartirSino,
  prepararPartida: prepararSino,
} = await import("../src/juegos/sino.js");
const { sinoFutbol } = await import("../src/juegos/sino.js");
const leerJson = async (nombre) =>
  JSON.parse(
    (await import("node:fs")).readFileSync(
      new URL(`../public/data/${nombre}.json`, import.meta.url),
      "utf8",
    ),
  );
const datosSino = await leerJson("sino");
const datosFutbol = await leerJson("sino-futbol");

ok(
  "sino: el JSON tiene afirmaciones válidas y balance entre verdaderas y falsas",
  () => {
    const ps = datosSino.preguntas;
    assert.ok(ps.length >= CANT_SINO * 3);
    assert.ok(
      ps.every(
        (p) => typeof p.respuesta === "boolean" && p.texto && p.explicacion,
      ),
    );
    const verdaderas = ps.filter((p) => p.respuesta).length;
    assert.ok(
      verdaderas / ps.length > 0.4 && verdaderas / ps.length < 0.6,
      `verdaderas: ${verdaderas}/${ps.length}`,
    );
  },
);

ok(
  "sino: 10 afirmaciones por día sin repetir y con las mismas para todos",
  () => {
    const a = prepararSino(
      datosSino.preguntas,
      "2026-10-17",
      null,
    ).preguntas.map((p) => p.id);
    const b = prepararSino(
      datosSino.preguntas,
      "2026-10-17",
      null,
    ).preguntas.map((p) => p.id);
    assert.equal(new Set(a).size, CANT_SINO);
    assert.deepEqual(a, b);
  },
);

ok("sino: aciertos y texto para compartir", () => {
  const respuestas = [{ acierto: true }, { acierto: false }, { acierto: true }];
  assert.equal(aciertos(respuestas), 2);
  assert.equal(
    compartirSino({ fecha: "2026-10-17", respuestas }),
    "Sí o no 2026-10-17\n2/3\n🟩🟥🟩",
  );
});

ok("sino: estado del Home", () => {
  memoria.clear();
  const hoy = fechaHoy();
  assert.equal(sino.estado().tipo, "nuevo");
  guardarPartida("sino", {
    fecha: hoy,
    respuestas: [{ acierto: true }, { acierto: false }],
    terminada: false,
  });
  assert.deepEqual(sino.estado(), {
    tipo: "curso",
    texto: `En curso: 2/${CANT_SINO}`,
  });
  guardarPartida("sino", {
    fecha: hoy,
    respuestas: Array.from({ length: CANT_SINO }, (_, i) => ({
      acierto: i < 7,
    })),
    terminada: true,
  });
  assert.deepEqual(sino.estado(), {
    tipo: "ganado",
    texto: `Ganado · Hoy: 7/${CANT_SINO}`,
  });
});

ok("sino-futbol: versión propia con datos, id y estadísticas separados", () => {
  assert.equal(sinoFutbol.id, "sino-futbol");
  assert.notEqual(sinoFutbol.id, sino.id);
  assert.ok(datosFutbol.preguntas.length >= CANT_SINO * 3);
  assert.ok(
    datosFutbol.preguntas.every(
      (p) => typeof p.respuesta === "boolean" && p.texto && p.explicacion,
    ),
  );
  const verdaderas = datosFutbol.preguntas.filter((p) => p.respuesta).length;
  assert.ok(
    verdaderas / datosFutbol.preguntas.length > 0.4 &&
      verdaderas / datosFutbol.preguntas.length < 0.6,
  );

  memoria.clear();
  const hoy = fechaHoy();
  guardarPartida("sino", {
    fecha: hoy,
    respuestas: [{ acierto: true }],
    terminada: false,
  });
  assert.equal(sino.estado().tipo, "curso");
  assert.equal(sinoFutbol.estado().tipo, "nuevo"); // jugar una versión no toca la otra
});

ok("sino-futbol: el texto para compartir lleva el nombre de la versión", () => {
  const t = compartirSino({
    nombre: sinoFutbol.nombre,
    fecha: "2026-10-17",
    respuestas: [{ acierto: true }],
  });
  assert.equal(t, "Sí o no · Fútbol 2026-10-17\n1/1\n🟩");
});

// ---- ¿Quién es? ----
const { normalizar, coincide, distancia } = await import("../src/nombres.js");
const quien = await import("../src/juegos/quien.js");
const datosQuien = await leerJson("quien-es-futbol");

ok("nombres: ignora mayúsculas, tildes y signos", () => {
  assert.equal(normalizar("  Kylian  MBAPPÉ! "), "kylian mbappe");
  assert.equal(normalizar("Muñoz"), "munoz");
  assert.equal(normalizar(null), "");
});

ok(
  "nombres: acepta nombre completo, alias y un error de tecleo en nombres largos",
  () => {
    const messi = { nombre: "Lionel Messi", alias: ["Messi", "Leo Messi"] };
    assert.ok(coincide("lionel messi", messi));
    assert.ok(coincide("MESSI", messi));
    assert.ok(coincide("Mesi", messi)); // un error en "messi" (5 letras)
    assert.ok(coincide("Lionel Mesi", messi));
    assert.ok(!coincide("Neymar", messi));
    assert.ok(!coincide("", messi));
    assert.ok(!coincide("   ", messi));
  },
);

ok("nombres: los nombres cortos no admiten errores", () => {
  const kane = { nombre: "Kane" };
  assert.ok(coincide("kane", kane));
  assert.ok(!coincide("kaka", kane));
  assert.equal(distancia("casa", "cosa"), 1);
});

ok("¿Quién es?: +1 por acierto, −1 por fallo, y puede ser negativo", () => {
  const r = (...v) => v.map((acierto) => ({ acierto }));
  assert.equal(quien.puntosTotales(r(true, true, false)), 1);
  assert.equal(quien.puntosTotales(r(false, false, true)), -1);
  assert.equal(quien.puntosTotales(r(false, false, false)), -3);
  assert.equal(quien.puntosTotales([]), 0);
  assert.deepEqual([4, 0, -3].map(quien.formatoPuntos), ["+4", "0", "−3"]);
});

ok("¿Quién es?: texto para compartir", () => {
  const t = quien.textoCompartir({
    nombre: "¿Quién es? Fútbol",
    fecha: "2026-10-20",
    respuestas: [{ acierto: true }, { acierto: false }, { acierto: false }],
  });
  assert.equal(t, "¿Quién es? Fútbol 2026-10-20\nPuntos: −1\n🟩🟥🟥");
});

ok("¿Quién es?: el Home identifica victoria y derrota", () => {
  memoria.clear();
  const hoy = fechaHoy();
  const juego = quien.quienEsFutbol;
  assert.equal(juego.estado().tipo, "nuevo");
  guardarPartida(juego.id, {
    fecha: hoy,
    respuestas: [{ acierto: false }],
    terminada: false,
  });
  assert.deepEqual(juego.estado(), {
    tipo: "curso",
    texto: `En curso: 1/${quien.CANTIDAD}`,
  });
  const fallos = Array.from({ length: quien.CANTIDAD }, () => ({
    acierto: false,
  }));
  guardarPartida(juego.id, { fecha: hoy, respuestas: fallos, terminada: true });
  assert.deepEqual(juego.estado(), {
    tipo: "perdido",
    texto: `Perdido · Hoy: −${quien.CANTIDAD}`,
  });

  const aciertosQuien = Array.from({ length: quien.CANTIDAD }, () => ({
    acierto: true,
  }));
  guardarPartida(juego.id, {
    fecha: hoy,
    respuestas: aciertosQuien,
    terminada: true,
  });
  assert.deepEqual(juego.estado(), {
    tipo: "ganado",
    texto: `Ganado · Hoy: +${quien.CANTIDAD}`,
  });
});

ok("storage: un récord negativo cuenta si es la primera partida", () => {
  memoria.clear();
  const ventanaAnterior = globalThis.window;
  const ventana = new EventTarget();
  let eventos = 0;
  ventana.addEventListener("pikora:resultados-hoy-actualizados", () => {
    eventos += 1;
  });
  globalThis.window = ventana;

  try {
    assert.equal(
      registrarResultado("quien-es-futbol", "2026-10-17", -4).racha,
      1,
    );
    assert.equal(eventos, 1);
    assert.equal(leerStats("quien-es-futbol").mejorPuntaje, -4);
    registrarResultado("quien-es-futbol", "2026-10-18", -8);
    assert.equal(leerStats("quien-es-futbol").mejorPuntaje, -4);
    registrarResultado("quien-es-futbol", "2026-10-19", 3);
    assert.equal(leerStats("quien-es-futbol").mejorPuntaje, 3);
  } finally {
    if (ventanaAnterior === undefined) delete globalThis.window;
    else globalThis.window = ventanaAnterior;
  }
});

ok(
  "¿Quién es?: el JSON tiene jugadores con las dos fotos y suficientes para 10 por día",
  () => {
    const ps = datosQuien.preguntas;
    assert.ok(ps.length >= quien.CANTIDAD);
    assert.ok(ps.every((p) => p.id <= 200));
    assert.ok(
      ps.every(
        (p) =>
          p.nombre &&
          p.foto &&
          p.fotoRecortada &&
          p.foto !== p.fotoRecortada,
      ),
    );
    const ids = quien
      .prepararPartida(ps, "2026-10-17", null)
      .preguntas.map((p) => p.id);
    assert.equal(new Set(ids).size, quien.CANTIDAD);
    for (const p of ps)
      assert.ok(
        coincide(p.nombre, p) && (p.alias ?? []).every((a) => coincide(a, p)),
      );
  },
);

console.log(`\n${pruebas} pruebas correctas.`);
