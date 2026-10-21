export async function cargarPreguntas(juegoId) {
  const url = `${import.meta.env.BASE_URL}data/${juegoId}.json`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`No se pudo cargar ${juegoId}.json (${res.status}).`);
  const datos = await res.json();
  return datos.preguntas;
}
