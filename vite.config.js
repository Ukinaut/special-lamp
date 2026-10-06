import { resolve } from 'path';
import { defineConfig } from 'vite';
import fs from 'fs';

const inputOptions = {
  admin: resolve(process.cwd(), 'admin.html'),
};

if (fs.existsSync(resolve(process.cwd(), 'empresas.html'))) {
  inputOptions.empresas = resolve(process.cwd(), 'empresas.html');
}
if (fs.existsSync(resolve(process.cwd(), 'contacto.html'))) {
  inputOptions.contacto = resolve(process.cwd(), 'contacto.html');
}
if (fs.existsSync(resolve(process.cwd(), 'tienda.html'))) {
  inputOptions.tienda = resolve(process.cwd(), 'tienda.html');
}

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: inputOptions,
    },
  },
});
