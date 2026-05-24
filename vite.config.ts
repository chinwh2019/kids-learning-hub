import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Using relative paths so it works seamlessly on GitHub Pages subfolder
  build: {
    outDir: 'docs', // Build directly into the /docs directory for easy deploy
    emptyOutDir: true, // Clean the docs folder before every build
  }
});
