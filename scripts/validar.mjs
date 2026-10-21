// Revisa los JSON de public/data/. Uso: npm run validar
// Cada juego tiene su propia función de revisión, porque sus datos son distintos.
import { readFileSync, existsSync } from "node:fs";

const comunes = (p, ids, errores) => {
  if (!Number.isInteger(p.id)) errores.push("id no es un entero");
  if (ids.has(p.id)) errores.push("id repetido");
  ids.add(p.id);
};

const textoObligatorio = (p, errores) => {
  if (typeof p.texto !== "string" || !p.texto.trim()) errores.push("sin texto");
};

const REVISORES = {
  howmuch(datos) {
    const idsCategoria = new Set((datos.categorias ?? []).map((c) => c.id));
    return (p, ids) => {
      const errores = [];
      comunes(p, ids, errores);
      textoObligatorio(p, errores);
      if (!idsCategoria.has(p.categoriaId))
        errores.push("categoriaId no existe");
      for (const campo of ["respuesta", "min", "max"]) {
        if (typeof p[campo] !== "number")
          errores.push(`${campo} debe ser un número sin comillas`);
      }
      if (!(p.min >= 0)) errores.push("min menor que 0");
      if (!(p.max > p.min)) errores.push("max no es mayor que min");
      if (!(p.respuesta >= p.min && p.respuesta <= p.max))
        errores.push("respuesta fuera de rango");
      if (![1, 2, 3, 4, 5].includes(p.dificultad))
        errores.push("dificultad debe ser 1 a 5");
      if (p.paso !== undefined && !(p.paso > 0))
        errores.push("paso debe ser mayor que 0");
      return errores;
    };
  },

  // ¿Quién es?: cada jugador necesita nombre y dos fotos que existan (recortada y entera).
  quien(datos, juego, carpetaFotos = `fotos/${juego}`) {
    const nombres = new Map();
    return (p, ids) => {
      const errores = [];
      comunes(p, ids, errores);
      if (typeof p.nombre !== "string" || !p.nombre.trim())
        errores.push("sin nombre");
      else {
        const clave = p.nombre.trim().toLowerCase();
        const anterior = nombres.get(clave);
        if (
          anterior &&
          (anterior.foto !== p.foto ||
            anterior.fotoRecortada !== p.fotoRecortada)
        ) {
          errores.push("nombre repetido con fotos distintas");
        } else if (!anterior) {
          nombres.set(clave, {
            foto: p.foto,
            fotoRecortada: p.fotoRecortada,
          });
        }
      }
      if (
        p.alias !== undefined &&
        !(
          Array.isArray(p.alias) &&
          p.alias.every((a) => typeof a === "string" && a.trim())
        )
      ) {
        errores.push("alias debe ser una lista de textos");
      }
      for (const campo of ["fotoRecortada", "foto"]) {
        if (typeof p[campo] !== "string" || !p[campo].trim())
          errores.push(`sin ${campo}`);
        else if (
          !existsSync(
            new URL(`../public/${carpetaFotos}/${p[campo]}`, import.meta.url),
          )
        ) {
          errores.push(`no existe public/${carpetaFotos}/${p[campo]}`);
        }
      }
      if (p.foto && p.foto === p.fotoRecortada)
        errores.push(
          "foto y fotoRecortada son el mismo archivo: se vería la cara",
        );
      if (p.pista !== undefined && typeof p.pista !== "string")
        errores.push("pista debe ser un texto");
      return errores;
    };
  },

  sino() {
    return (p, ids) => {
      const errores = [];
      comunes(p, ids, errores);
      textoObligatorio(p, errores);
      if (typeof p.respuesta !== "boolean")
        errores.push("respuesta debe ser true o false, sin comillas");
      if (typeof p.explicacion !== "string" || !p.explicacion.trim())
        errores.push("sin explicacion");
      return errores;
    };
  },
};

// Un archivo por juego. `tipo` elige qué revisor usar: varias versiones de un juego
// (normal, fútbol...) comparten tipo. Al añadir un juego, añade su línea aquí.
const ARCHIVOS = [
  { juego: "howmuch", tipo: "howmuch" },
  { juego: "sino", tipo: "sino" },
  { juego: "sino-futbol", tipo: "sino" },
  {
    juego: "quien-es-futbol",
    tipo: "quien",
    carpetaFotos: "fotos-quien-es",
  },
];

let fallos = 0;

for (const { juego, tipo, carpetaFotos } of ARCHIVOS) {
  const crearRevisor = REVISORES[tipo];
  let datos;
  try {
    datos = JSON.parse(
      readFileSync(
        new URL(`../public/data/${juego}.json`, import.meta.url),
        "utf8",
      ),
    );
  } catch (e) {
    console.error(`${juego}.json: no se pudo leer (${e.message})`);
    fallos++;
    continue;
  }

  const preguntas = datos.preguntas ?? [];
  const revisar = crearRevisor(datos, juego, carpetaFotos);
  const ids = new Set();
  let malas = 0;

  for (const p of preguntas) {
    const errores = revisar(p, ids);
    if (errores.length) {
      malas++;
      console.log(`${juego} #${p.id}: ${errores.join(", ")}`);
    }
  }
  if (preguntas.length < 10) {
    malas++;
    console.log(
      `${juego}: hacen falta al menos 10 elementos (hay ${preguntas.length}).`,
    );
  }

  fallos += malas;
  console.log(
    `${juego}: ${preguntas.length} revisadas, ${malas} con problemas.`,
  );
}

process.exit(fallos ? 1 : 0);
