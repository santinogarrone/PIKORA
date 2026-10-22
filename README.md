
# Adivina el gol

El juego se habilita cuando agregues al menos 3 goles. Cada día presenta 3
imágenes con cuatro opciones por imagen.

- Guarda las imágenes en `public/goles/` (por ejemplo, `gol-maradona.jpg`).
- Edita `public/data/adivina-el-gol.json` y agrega los datos de cada gol:

```json
{
  "preguntas": [
    {
      "id": 1,
      "imagen": "gol-maradona.jpg",
      "opciones": [
        "Maradona contra Inglaterra · Mundial 1986",
        "Messi contra México · Mundial 2022",
        "Di María contra Francia · Mundial 2022",
        "Caniggia contra Brasil · Mundial 1990"
      ],
      "respuesta": "Maradona contra Inglaterra · Mundial 1986"
    }
  ]
}
```

`imagen` es el nombre del archivo dentro de `public/goles/`. `opciones` debe
tener exactamente cuatro respuestas distintas y `respuesta` debe coincidir
exactamente con la opción correcta. Cada `id` debe ser un entero único.
Cuando cargues los goles, comprueba los datos con `npm run validar`.
