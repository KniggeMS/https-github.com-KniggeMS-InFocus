# InFocus CineLog - Projekt Dokumentation

Willkommen zur technischen Dokumentation von InFocus CineLog. Dieses Dokument beschreibt die Architektur, Features, Setup-Anweisungen und strategische Entscheidungen für die App.

---

## 🚀 Version: v2.4 (Cinematic Immersion Update)

### ✨ Aktuelle Features

*   **Cinematic DetailView:** Verbesserte Detailansicht mit Hintergrund-Trailer (YouTube iframe), Fakten-Tab und User Review-Eingabe. Optimiert für iOS mit `playsinline` für reibungslose Wiedergabe.
*   **Responsive Sidebar & Profilmenü:** Überarbeitetes Layout für Desktop und Mobile. Sidebar ist einklappbar. Profil-Menü im "Stitch & Glass Fusion"-Design.
*   **Self-Healing Data:** `services/hydration.ts` lädt fehlende Runtime-, FSK- und Anbieterdaten automatisch nach. Aggressive "Self-Healing" für Rotten Tomatoes (RT) Scores in `MediaCard.tsx`.
*   **Intelligentes Layout:** Medienkarten haben jetzt eine einheitliche Höhe, unabhängig vom Inhalt (dank Flexbox und `min-h` in `MediaCard.tsx`).
*   **Admin Benachrichtigungen:** Persistentes System zur Benachrichtigung von Administratoren bei neuen Registrierungen oder Logins. Zeigt einen Badge im Profilmenü an.
*   **Listen Teilen:** Benutzer können nun ihre erstellten Listen mit anderen Nutzern teilen. Eine `ShareModal` Komponente wurde implementiert.
*   **AI Funktionen (Gemini 1.5 Flash):**
    *   **AI Tipp:** Button in der Sidebar für KI-Empfehlungen.
    *   **Deep Content Analysis:** Analyse von Filmen in der Detailansicht.
    *   **Chatbot:** Integrierter AI-Chatbot mit Kontext zur Sammlung.
    *   **Graceful Degradation:** Bei Überschreitung des API-Kontingents wird eine freundliche Fehlermeldung angezeigt, anstatt die Funktion zu deaktivieren.
*   **PWA Support:** Installierbar als App auf iOS und Android.
*   **Internationale Sprachunterstützung (i18n):** Implementiert für Deutsch und Englisch, einschließlich der Auth-Seite und des Chatbots.
*   **AuthPage Redesign:** Überarbeitetes Login/Registrierungs-Layout mit Glow-Effekten und Sprachumschalter.

### 🐛 Behobene Bugs in v2.4

*   "Missing Add Button" in `SearchModal`/`DetailView`.
*   "No Cards after Login" durch Login-Sync-Verbesserungen.
*   "No Rotten Tomatoes Score" durch robustere Hydration und Fallback-Mechanismen.
*   "Layout Shift" durch inkonsistente Kartenhöhen.
*   "AI Tipp/Deep Content Analysis Connection Issues" durch verbesserte API Key Logik.
*   "Chat Not Translated" durch Hinzufügen der Übersetzungen.
*   "Translation Button No Function" auf der Auth-Seite.

---

## 🛠️ Tech Stack

*   **Frontend:** React 19, Vite, TypeScript
*   **Styling:** Tailwind CSS, Lucide Icons
*   **AI:** Google Gemini API (`gemini-1.5-flash`)
*   **Backend/Auth:** Supabase
*   **Movie Data:** TMDB API (The Movie Database) & OMDb API

---

## 🚀 Installation & Setup

### 1. Repository klonen & Abhängigkeiten installieren

```bash
git clone https://github.com/DEIN_USERNAME/cinelog-infocus.git
cd cinelog-infocus
npm install
```

### 2. Supabase Projekt Setup

Erstelle ein Projekt auf [Supabase](https://supabase.com/) und richte die Authentifizierung ein.

### 3. Datenbank-Schema (SQL)

Führe diese SQL-Skripte im Supabase SQL Editor aus, um das erforderliche Schema zu erstellen.

```sql
-- Erstellt die Tabelle für Admin-Benachrichtigungen
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL, -- 'login' oder 'register'
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  user_id UUID -- Kann NULL sein, wenn es eine Systemnachricht ist oder der Benutzer noch nicht in 'profiles' ist
);

-- Aktiviert Row Level Security (RLS)
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Richtlinie: Admins können alle Benachrichtigungen lesen
CREATE POLICY "Allow admin to read all notifications"
ON admin_notifications FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
);

-- Richtlinie: Admins können Benachrichtigungen aktualisieren (z.B. als gelesen markieren)
CREATE POLICY "Allow admin to update notifications"
ON admin_notifications FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
);

-- Richtlinie: Authentifizierte Benutzer (d.h. die App selbst) können Benachrichtigungen hinzufügen.
CREATE POLICY "Allow authenticated users to insert notifications"
ON admin_notifications FOR INSERT WITH CHECK (true);
```

### 4. API Keys konfigurieren

Du benötigst API Keys für TMDB, OMDb und Google Gemini.

#### a) `.env` Datei (für Entwicklung)

Erstelle eine `.env` Datei im Hauptverzeichnis deines Projekts.

```env
# Supabase Konfiguration
VITE_SUPABASE_URL="DEINE_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="DEIN_SUPABASE_ANON_KEY"

# API Keys (für die Entwicklung)
VITE_TMDB_API_KEY="DEIN_TMDB_API_KEY"
VITE_OMDB_API_KEY="DEIN_OMDB_API_KEY"
VITE_GEMINI_API_KEY="DEIN_GEMINI_API_KEY"
```
*Stelle sicher, dass du `VITE_GEMINI_API_KEY` korrekt konfigurierst, um AI-Funktionen nutzen zu können.*

#### b) Benutzerdefinierte API Keys (im Browser)

Die App ermöglicht es Benutzern, ihre eigenen TMDB- und OMDb-API-Keys im Browser über `localStorage` zu hinterlegen. Diese überschreiben die `.env`-Keys.

*   **TMDB:** `localStorage.setItem('tmdb_api_key', 'DEIN_TMDB_KEY');`
*   **OMDb:** `localStorage.setItem('omdb_api_key', 'DEIN_OMDB_KEY');`
*   **Gemini:** `localStorage.setItem('gemini_api_key', 'DEIN_GEMINI_KEY');`

### 5. Lokalen Entwicklungsserver starten

```bash
npm run dev
```

### 6. Deployment (Vercel)

Dieses Projekt ist für die Bereitstellung mit Vercel vorkonfiguriert. Verknüpfe dein GitHub-Repository mit Vercel. Bei jedem Push auf den `main` Branch wird Vercel automatisch eine neue Version deiner App bauen und bereitstellen.

---

## 🗺️ Roadmap & Zukünftige Ideen

*   **Theme-Umschalter:** Implementierung eines einfachen Hell/Dunkel-Modus im Profilmenü. Der "Design Lab"-Button wird entfernt oder zu einem Admin-Feature umfunktioniert.
*   **Smart Import / Einstellungen:** Vollständige Implementierung der Funktionalität hinter den derzeit deaktivierten Buttons.
*   **Admin Notification UI:** Dedizierte Seite für Admins, um alle Benachrichtigungen einzusehen und zu verwalten.
*   **Erweiterte Listen-Funktionen:** Teilen von Listen mit spezifischen Nutzern, nicht nur öffentlich.
*   **Echtzeit-Updates:** Verbesserungen an der Realtime-Synchronisation für geteilte Listen.

---

*Powered by Google Gemini & TMDB.*
