// Catálogo de juegos. El Home muestra uno por cada elemento de esta lista, en este orden.
//
// Para añadir un juego: crea src/juegos/<id>.js con la misma forma que howmuch.js
// (id, nombre, descripcion, reglas, estado(), montar()) y añádelo aquí.

import { howmuch } from "./howmuch.js";
import { sino, sinoFutbol } from "./sino.js";
import { quienEsFutbol } from "./quien.js";
import { adivinaElGol } from "./adivina-el-gol.js";

export const JUEGOS = [howmuch, sino, sinoFutbol, quienEsFutbol, adivinaElGol];
