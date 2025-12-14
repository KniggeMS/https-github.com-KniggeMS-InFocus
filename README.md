
# 🎬 InFocus CineLog

**Die ultimative AI-Watchlist.** Verwalte deine Filme & Serien mit Vision-Suche, Deep Content Analysis und Freunden.

![Banner](https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop)

## ✨ Features

### 🧠 AI Powered (Gemini 2.5)
*   **Vision Search:** Fotografiere ein Filmplakat im Kino oder Laden, und die App erkennt den Titel automatisch.
*   **Deep Content Analysis:** Hinterlege Notizen zu Filmen. Die AI analysiert diese und gibt dir "Deep Insights" basierend auf deinem Geschmack und der Handlung.
*   **Smart Caching:** Intelligente Speicherstrategie für AI-Antworten (LocalStorage), um das API-Limit zu schonen und Offline-Support zu bieten.
*   **CineChat:** Ein integrierter Chatbot, der vollen Zugriff auf den Kontext deiner Sammlung hat.

### 🤝 Social & Sync
*   **Listen Teilen:** Erstelle Listen (z.B. "Halloween Marathon") und teile sie in Echtzeit mit anderen Nutzern.
*   **Cloud Sync:** Dank Supabase sind deine Daten auf allen Geräten synchronisiert.
*   **Rollen-System:** User, Manager und Admin Rollen für erweiterte Verwaltung.

### 🏆 Gamification
*   **Level System:** Sammle XP basierend auf der Laufzeit deiner gesehenen Filme (1 Minute = 1 XP).
*   **Ränge:** Steige vom "Statist" bis zur "Hollywood Legende" auf.
*   **Trophäen:** Schalte Achievements frei (z.B. "Binge Master", "Genre Guru", "Zeitreisender").

### 📱 Modern UI/UX
*   **PWA Support:** Installierbar als App auf iOS und Android.
*   **Theming:** Wähle zwischen Dark Mode, Light Mode und dem exklusiven **iOS Glassmorphism** Theme.
*   **Responsive:** Optimiert für Desktop und Mobile ("Thumb-friendly" Navigation).

---

## 🛠️ Tech Stack

*   **Frontend:** React 19, Vite, TypeScript
*   **Styling:** Tailwind CSS, Lucide Icons
*   **AI:** Google Gemini API (`gemini-2.5-flash`, `gemini-2.5-flash-image`)
*   **Backend/Auth:** Supabase
*   **Movie Data:** TMDB API (The Movie Database) & OMDb API (Fallback)

---

## 🚀 Installation & Setup

1.  **Repository klonen**
    ```bash
    git clone https://github.com/DEIN_USERNAME/cinelog-infocus.git
    cd cinelog-infocus
    ```

2.  **Abhängigkeiten installieren**
    ```bash
    npm install
    ```

3.  **Lokal Starten**
    Erstelle eine `.env` Datei im Hauptverzeichnis für lokale Entwicklung:
    ```env
    VITE_TMDB_API_KEY=dein_tmdb_key
    VITE_OMDB_API_KEY=dein_omdb_key
    API_KEY=dein_gemini_key
    ```
    Starten:
    ```bash
    npm run dev
    ```

## 🌍 Landing Page & Docs

Eine Marketing-Landingpage für GitHub Pages findest du im Ordner `/docs`.
Aktiviere GitHub Pages in den Repository-Settings und wähle `/docs` als Source.

## 📄 Lizenz

MIT License.

---
*Powered by Google Gemini & TMDB.*
