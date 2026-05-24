import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const hasElectron = (): boolean => {
  try {
    return fs.existsSync(path.resolve(__dirname, 'node_modules/electron/dist/electron.exe'));
  } catch {
    return false;
  }
};

let plugins: Plugin[] = [react()];

// Only enable Electron plugin if the binary is installed
if (hasElectron()) {
  console.log('[vite] Electron found - enabling desktop plugins');
  // Dynamic import is needed because the package.json has "type": "module"
  // But vite.config.ts is always treated as ESM by Vite, so this should work
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'recharts'],
        },
      },
    },
  },
});
