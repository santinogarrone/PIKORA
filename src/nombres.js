export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function distancia(a, b) {
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const fila = [i];
    for (let j = 1; j <= b.length; j++) {
      fila[j] = Math.min(
        anterior[j] + 1,
        fila[j - 1] + 1,
        anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    anterior = fila;
  }
  return anterior[b.length];
}

export function tolerancia(longitud) {
  if (longitud >= 9) return 2;
  if (longitud >= 5) return 1;
  return 0;
}

export function coincide(intento, jugador) {
  const escrito = normalizar(intento);
  if (!escrito) return false;
  return [jugador.nombre, ...(jugador.alias ?? [])].some((valido) => {
    const v = normalizar(valido);
    return v && distancia(escrito, v) <= tolerancia(v.length);
  });
}
