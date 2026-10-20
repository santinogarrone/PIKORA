# ¿HowMuch?

Home con los juegos (HowMuch, Sí o no y Sí o no · Fútbol). Al pulsar un juego se abre un popup con las reglas y desde ahí se juega.
Solo frontend: Vite + JavaScript. Sin login ni backend. Un reto por día.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:5173
```

Otros comandos:

| Comando            | Qué hace                                            |
| ------------------ | --------------------------------------------------- |
| `npm run validar`  | Revisa `public/data/preguntas.json`                 |
| `npm run test`     | Pruebas de fechas, semilla, puntos, storage, catálogo |
| `npm run build`    | Genera `dist/` para publicar                        |
| `npm run preview`  | Sirve `dist/` en local                              |

## Estructura

```
index.html
public/
  favicon.svg
  data/
    howmuch.json           datos del juego HowMuch
    sino.json              datos del juego Sí o no
    sino-futbol.json       datos de Sí o no · Fútbol
src/
  main.js                  fuentes + estilos + arranque
  app.js                   rutas (#/ = Home, #/juego/<id> = juego)
  home.js                  Home: título y lista de juegos
  modal.js                 popup de reglas (<dialog>)
  juegos/
    index.js               catálogo: lista de juegos
    howmuch.js             juego HowMuch (definición)
    sino.js                Sí o no: crearSino() + versiones normal y de fútbol
  juego.js                 pantallas de HowMuch
  -- compartido por todos los juegos --
  dom.js                   helper h() para crear elementos
  ui.js                    bloque de estadísticas y cuenta atrás
  fecha.js                 fecha de hoy (hora de Argentina)
  semilla.js               elegir los elementos del día con semilla
  partida.js               prepara la partida de hoy
  preguntas.js             carga public/data/<id>.json
  storage.js               localStorage por juego
  style.css
scripts/
  validar.mjs              revisa cada JSON según su juego
  probar.mjs
```

## Cómo funciona la navegación

- `#/` muestra el Home.
- Pulsar una tarjeta abre el popup con las reglas.
- «Jugar» cambia la ruta a `#/juego/<id>` y monta el juego.
- «Volver al inicio» vuelve a `#/`. El botón Atrás del navegador también.
- Una ruta desconocida muestra el Home.

El popup usa `<dialog>`: Esc lo cierra, el clic fuera lo cierra y el foco vuelve a la tarjeta.

## Añadir un juego

Cada juego tiene sus propios datos, reglas y pantallas. Solo comparte las piezas de `src/` marcadas como compartidas.

1. Datos: `public/data/<id>.json` con una lista `"preguntas"`. Cada elemento necesita un `id` numérico único y los campos que tu juego use.
2. Juego: `src/juegos/<id>.js` exporta un objeto con esta forma:

```js
export const mijuego = {
  id: "mijuego",                 // solo letras, números, - y _. Es también el nombre del JSON
  nombre: "Mi juego",
  descripcion: "Una línea para la tarjeta.",
  reglas: ["Regla 1.", "Regla 2."],
  estado() {                     // etiqueta de la tarjeta, lee solo localStorage
    return { tipo: "nuevo", texto: "Disponible" }; // tipo: nuevo | curso | hecho
  },
  async montar(contenedor) {     // pinta el juego en `contenedor`
    contenedor.textContent = "Hola";
    return () => {};             // función de limpieza al salir (timers, listeners)
  },
};
```

3. Catálogo: añádelo en `src/juegos/index.js`: `export const JUEGOS = [howmuch, sino, mijuego];`
4. Validación: en `scripts/validar.mjs`, añade tu juego a `ARCHIVOS` y, si sus datos son nuevos, una función en `REVISORES`.

Plantilla real y corta: `src/juegos/sino.js`. Usa `cargarPreguntas(id)`, `prepararPartida`, las funciones de `storage.js` con su id, y `statsBloque` y `cuentaAtras` de `ui.js`.

## Crear una versión de un juego (fútbol, otro tema)

Una versión es un juego más: id, JSON y tarjeta propios, con el mismo código. Ejemplo con Sí o no (`crearSino`, en `src/juegos/sino.js`):

1. Datos: `public/data/sino-<tema>.json`, con el mismo formato que `sino.json`.
2. Versión: al final de `src/juegos/sino.js`:

```js
export const sinoCine = crearSino({
  id: "sino-cine",                       // = nombre del JSON, sin .json
  nombre: "Sí o no · Cine",
  descripcion: `${CANTIDAD} afirmaciones de cine al día. ¿Verdaderas o falsas?`,
});
```

3. Catálogo: en `src/juegos/index.js`, importa `sinoCine` y añádelo a `JUEGOS`.
4. Validación: en `scripts/validar.mjs`, añade `{ juego: "sino-cine", tipo: "sino" }` a `ARCHIVOS`.

Cada versión guarda su partida y su racha por separado. Se puede jugar una de cada en el mismo día.

HowMuch todavía no tiene `crear...`: para una versión de fútbol hay que hacer con él el mismo cambio que con Sí o no.

## Datos de cada juego

- HowMuch (`howmuch.json`): `id`, `categoriaId`, `texto`, `respuesta`, `min`, `max`, `paso`, `unidad` (opcional), `dificultad`.
- Sí o no (`sino.json`): `id`, `texto`, `respuesta` (`true` o `false`, sin comillas), `explicacion`. Mantén el reparto cerca del 50 % de verdaderas y falsas.

Cada día se eligen 10 con una semilla fija a partir de la fecha. Con N elementos hay N/10 días sin repetir.
No cambies `SEMILLA_BASE` en `src/semilla.js` después de publicar: cambiaría las preguntas de todos los días.

## Puntos (HowMuch)

`100 × (1 − |intento − respuesta| / (max − min))³`, redondeado. Fallar un 10 % del rango da 73 puntos. Máximo 1000 por día.

## localStorage

Dos claves por juego:

- `howmuch:<juego>:partida`: `{ fecha, respuestas, terminada, preguntas }`. Guarda las 10 preguntas del día: si editas el JSON a mitad de día, quien ya empezó conserva las suyas.
- `howmuch:<juego>:stats`: racha, mejor racha, mejor puntaje, última fecha, jugadas.

HowMuch también lee las claves antiguas `howmuch:partida` y `howmuch:stats`, para no perder la racha de quien jugaba antes.

## Publicar

`npm run build` y sube `dist/` a cualquier hosting estático (Netlify, Vercel, GitHub Pages). Las rutas con `#` no necesitan configuración en el servidor.
