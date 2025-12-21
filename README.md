# 🎬 InFocus CineLog

**Die ultimative AI-Watchlist.** Verwalte deine Filme & Serien mit Vision-Suche, Deep Content Analysis und intelligenter Sammlungs-Verwaltung.

![Banner](https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop)

## ✨ Highlights

### 🧠 AI Powered (Google Gemini)
*   **Vision Search:** Fotografiere ein Filmplakat oder erkenne Filme aus Bildern – die App identifiziert den Titel automatisch.
*   **Deep Content Analysis:** Erhalte tiefe Einblicke in Filme basierend auf Handlung, Stil und kultureller Bedeutung.
*   **CineChat:** Ein integrierter AI-Chatbot, der deine Sammlung kennt und dir Empfehlungen gibt oder Fragen beantwortet.
*   **AI Empfehlungen:** Erhalte personalisierte Film-Tipps basierend auf deinen Favoriten.

### 🛠️ Profi-Features
*   **Smart Import:** Importiere deine bestehenden Listen (z.B. aus Excel oder anderen Apps) einfach per Copy-Paste. Die App erkennt die Titel automatisch.
*   **Self-Healing Data:** Fehlende Bewertungen (Rotten Tomatoes), Laufzeiten oder Poster werden im Hintergrund automatisch nachgeladen und korrigiert.
*   **Cinematic Detail View:** Erlebe Trailer direkt im Hintergrund der Detailansicht für volle Immersion.

### 📱 Modern UI/UX
*   **Design Lab:** Wähle zwischen Cinematic Dark, Daylight und einem edlen Glassmorphism-Design.
*   **PWA Support:** Installiere InFocus CineLog direkt auf deinem Homescreen (iOS & Android).
*   **Cloud Sync:** Vollständige Synchronisation und Authentifizierung über Supabase.

---

## 🛠️ Tech Stack

*   **Frontend:** React 19, Vite, TypeScript
*   **Styling:** Tailwind CSS, Lucide Icons
*   **AI:** Google Gemini API (`gemini-1.5-flash`)
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