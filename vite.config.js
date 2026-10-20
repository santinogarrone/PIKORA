import { defineConfig } from "vite";

// base "./" hace que la web funcione en cualquier carpeta o dominio
// (Netlify, Vercel, GitHub Pages en subcarpeta...).
export default defineConfig({
  base: "./",
});
