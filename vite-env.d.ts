/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TMDB_API_KEY: string;
  readonly VITE_OMDB_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  // Hier kannst du weitere VITE_ Variablen hinzufügen
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}