export function parseJsonc(texto) {
  let sinComentarios = "";
  let dentroDeCadena = false;
  let escapado = false;

  for (let i = 0; i < texto.length; i += 1) {
    const caracter = texto[i];

    if (dentroDeCadena) {
      sinComentarios += caracter;
      if (escapado) escapado = false;
      else if (caracter === "\\") escapado = true;
      else if (caracter === '"') dentroDeCadena = false;
      continue;
    }

    if (caracter === '"') {
      dentroDeCadena = true;
      sinComentarios += caracter;
      continue;
    }

    if (caracter === "/" && texto[i + 1] === "*") {
      const fin = texto.indexOf("*/", i + 2);
      if (fin === -1) throw new SyntaxError("Comentario JSONC sin cerrar.");
      i = fin + 1;
      continue;
    }

    if (caracter === "/" && texto[i + 1] === "/") {
      while (i + 1 < texto.length && texto[i + 1] !== "\n") i += 1;
      continue;
    }

    sinComentarios += caracter;
  }

  let resultado = "";
  dentroDeCadena = false;
  escapado = false;

  for (let i = 0; i < sinComentarios.length; i += 1) {
    const caracter = sinComentarios[i];

    if (dentroDeCadena) {
      resultado += caracter;
      if (escapado) escapado = false;
      else if (caracter === "\\") escapado = true;
      else if (caracter === '"') dentroDeCadena = false;
      continue;
    }

    if (caracter === '"') {
      dentroDeCadena = true;
      resultado += caracter;
      continue;
    }

    if (caracter === ",") {
      let siguiente = i + 1;
      while (/\s/.test(sinComentarios[siguiente] ?? "")) siguiente += 1;
      if (sinComentarios[siguiente] === "]" || sinComentarios[siguiente] === "}")
        continue;
    }

    resultado += caracter;
  }

  return JSON.parse(resultado);
}
