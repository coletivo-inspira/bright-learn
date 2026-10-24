import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' = funciona em qualquer caminho do GitHub Pages
// (ex.: https://usuario.github.io/nome-do-repo/ ou domínio próprio).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
});
