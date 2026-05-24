import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/kids-learning-hub/', // Absolute path for robust GitHub Pages subfolder resolution
  build: {
    outDir: 'docs', // Build directly into the /docs directory for easy deploy
    emptyOutDir: true, // Clean the docs folder before every build
  }
});
