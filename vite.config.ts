import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: './', // WICHTIG für GitHub Pages (relative Pfade)
    build: {
      outDir: 'dist', // Force output directory
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: {
        clientPort: 443
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // NEW: Inject TMDB and OMDB keys so they work on mobile without manual input
      'process.env.VITE_TMDB_API_KEY': JSON.stringify(env.VITE_TMDB_API_KEY || env.TMDB_API_KEY || ''),
      'process.env.VITE_OMDB_API_KEY': JSON.stringify(env.VITE_OMDB_API_KEY || env.OMDB_API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || '')
    }
  };
});