# InFocus CineLog - Service Design Package (SDP)

**Dokumentations-Standard:** ITIL v4  
**Status:** Live / In Operation  
**Version:** 1.9.41

---

## 1. Service Strategy (Strategie)

### 1.1 Business Case & Vision
Das Ziel des Services **"InFocus CineLog"** ist die Bereitstellung einer hochverfügbaren, intelligenten Web-Applikation zur Verwaltung von Medienkonsum (Filme & Serien). Der Endnutzer soll eine "Zero-Config" Experience haben.

### 1.2 Architektur-Entscheidung: Client-Side Direct via Env
Die App nutzt Umgebungsvariablen, die während des Build-Vorgangs (z.B. bei Vercel) sicher injiziert werden. Dies verhindert, dass Nutzer eigene Keys benötigen.

---

## 2. Vercel Deployment Guide (API Keys einrichten)

Um die App ohne manuelle Key-Eingabe für Nutzer zu veröffentlichen, folge diesen Schritten im Vercel Dashboard:

1.  **Projekt auswählen** -> **Settings** -> **Environment Variables**.
2.  Folgende Variablen anlegen (Typ: Plaintext):
    | Variable | Zweck |
    |:---|:---|
    | `API_KEY` | Google Gemini AI (Empfehlungen & Chat) |
    | `VITE_TMDB_API_KEY` | TMDB API (Suche, Bilder, Details) |
    | `VITE_OMDB_API_KEY` | OMDb API (Rotten Tomatoes Scores & Import) |
    | `VITE_SUPABASE_URL` | Deine Supabase Projekt URL |
    | `VITE_SUPABASE_ANON_KEY` | Dein Supabase Anon Key |
3.  Nach dem Speichern ein **Redeploy** durchführen.

---

## 3. Pre-Publication Security Checklist

Vor einer breiten Veröffentlichung oder dem Hochladen in ein öffentliches Repository müssen folgende Punkte geprüft werden:

1.  **[X] Hardcoded Keys:** In `App.tsx` (FALLBACK_KEYS) stehen keine echten Keys mehr.
2.  **[ ] Vercel Envs:** Alle Keys sind im Vercel Dashboard hinterlegt.
3.  **[ ] Supabase RLS:** Row Level Security ist aktiv (Nur Besitzer können eigene Daten lesen/schreiben).
4.  **[ ] Build-Test:** App lokal bauen (`npm run build`) und prüfen, ob die Suche ohne manuelle Key-Eingabe funktioniert.

---

*Dokumentation aktualisiert: Version 1.9.41*