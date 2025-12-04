
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Lädt Umgebungsvariablen basierend auf dem Modus (development/production)
  // (process as any) behebt TypeScript-Fehler, falls @types/node fehlt
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      hmr: {
        clientPort: 443
      }
    },
    define: {
      // Dies ersetzt "process.env.API_KEY" im Code durch den echten Wert beim Build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
