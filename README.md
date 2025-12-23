# 🎬 InFocus CineLog

**Die ultimative AI-Watchlist.** Verwalte deine Filme & Serien mit Vision-Suche, Deep Content Analysis und intelligenter Sammlungs-Verwaltung.

![Banner](https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop)

## ✨ Highlights

### 🧠 Hybrid AI Powered (Groq & Gemini)
*   **Groq (Llama 3):** Ultraschnelle Textantworten im CineChat und bei Filmempfehlungen.
*   **Gemini (1.5 Flash):** Leistungsstarke Vision-Suche und Deep Content Analysis.
*   **Vision Search:** Fotografiere ein Filmplakat oder erkenne Filme aus Bildern – die App identifiziert den Titel automatisch.
*   **CineChat:** Ein integrierter AI-Chatbot, der deine Sammlung kennt und dir Empfehlungen gibt oder Fragen beantwortet.

### 🛠️ Profi-Features
*   **Smart Import:** Importiere deine bestehenden Listen (z.B. aus Excel oder anderen Apps) einfach per Copy-Paste. Die App erkennt die Titel automatisch (Admin-only).
*   **Self-Healing Data:** Fehlende Bewertungen (Rotten Tomatoes), Laufzeiten oder Poster werden im Hintergrund automatisch nachgeladen und korrigiert.
*   **Cinematic Detail View:** Erlebe Trailer direkt im Hintergrund der Detailansicht für volle Immersion.

### 📱 Modern UI/UX
*   **Mobile-First Design:** Optimierte Steuerung via Floating Action Button (FAB) für AI-Tipps und Bottom Sheets für Listen-Aktionen.
*   **Design Lab:** Wähle zwischen Cinematic Dark, Daylight und einem edlen Glassmorphism-Design.
*   **PWA Support:** Installiere InFocus CineLog direkt auf deinem Homescreen (iOS & Android).

---

## 🛠️ Tech Stack

*   **Frontend:** React 19, Vite, TypeScript
*   **AI Engines:** Groq (Llama 3), Google Gemini (1.5 Flash)
*   **Backend/Auth:** Supabase
*   **Movie Data:** TMDB API & OMDb API (Fallback für RT-Scores)

---

## 🚀 Quick Start

1.  **Repository klonen**
    ```bash
    git clone https://github.com/KniggeMS/InFocus.git
    cd InFocus
    ```

2.  **Abhängigkeiten installieren**
    ```bash
    npm install
    ```

3.  **Konfiguration**
    Kopiere die `.env.example` nach `.env` und trage deine API-Keys ein:
    *   `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`
    *   `VITE_TMDB_API_KEY`
    *   `VITE_GEMINI_API_KEY`

4.  **Lokal Starten**
    ```bash
    npm run dev
    ```

## 🌍 Deployment

Dieses Projekt ist für das Deployment auf **Vercel** optimiert. 
Vergiss nicht, die Environment Variables im Vercel-Dashboard zu hinterlegen.

## 📄 Lizenz

MIT License.

---
*Powered by Google Gemini & TMDB.*