# InFocus CineLog - Service Design Package (SDP)

**Dokumentations-Standard:** ITIL v4 (Service Design)  
**Status:** Live Operation (Active Development)  
**Version:** 2.3.1 ("Cinematic Depth")  
**Zuletzt aktualisiert:** 21.12.2025

---

## 1. Service-Beschreibung (Service Description)
InFocus CineLog ist ein intelligenter Medien-Verwaltungsdienst, der AI-gestützte Analyse, Gamification und soziale Interaktion kombiniert.

### 1.1 Kernfunktionen
- **Vision-Suche:** Identifikation von Medien über Kamera-Bilder (Gemini Flash Vision).
- **Deep Content Analysis:** Personalisierte Einblicke basierend auf Rezensionen und Plot-Daten.
- **Smart Sync:** Echtzeit-Synchronisation von Listen über mehrere Benutzer hinweg.
- **Gamification:** Level-System (XP basierend auf Laufzeit) und Trophäen.
- **Self-Healing Data:** Automatische Reparatur unvollständiger Datensätze (Laufzeit, FSK, Provider) im Hintergrund.

---

## 2. Technisches Design (Technical Architecture)

### 2.1 Frontend & UI/UX
- **Framework:** React 19 (Strict Mode) mit Vite 5.
- **Typisierung:** TypeScript 5.x mit expliziten Vite-Client-Typen (`vite-env.d.ts`).
- **Design-System:** "Stitch & Glass Fusion" – Deep Navy (#0B0E14) mit hocheffektiven Glassmorphism-Elementen.
- **Detail-Richness:** Live-Fetch von Budget, Revenue und Taglines ("Micro-Facts").

### 2.2 Backend & Schnittstellen (Integration Design)
- **Database/Auth:** Supabase (PostgreSQL / GoTrue).
- **Primary AI:** Google Gemini 1.5 Flash (für Stabilität & Kompatibilität).
- **Media Meta-Data:** TMDB API v3 & OMDb API.
- **Environment Management:** Strikt via `import.meta.env` (.env Datei).

---

## 3. RFC-Historie (Change & Release Management)

| ID | Status | Titel | Beschreibung |
|:---|:---|:---|:---|
| **RFC-001** | Done | Initial Setup | Deployment-Basis, Supabase Tabellen. |
| **RFC-010** | Done | AI Core | Integration von Gemini Flash. |
| **RFC-012** | Done | Mobile Navigation | Einführung der schwebenden Such-Aktion & Bottom-Sheets. |
| **RFC-021** | Done | Restoration Fix | Wiederherstellung Web-Sharing & Mobile AI Button. |
| **RFC-025** | Done | Build & Env Fix | Einführung von `vite-env.d.ts` & Umstellung auf `import.meta.env`. |
| **RFC-026** | Done | Responsive Tables | Einführung von `overflow-x-auto` für Mobile Benutzerverwaltung. |
| **RFC-027** | Done | Key-State Sync | Grüne "VERCEL ACTIVE" Badges im UI bei Cloud-Keys. |
| **RFC-030** | Done | Data Hydration & AI | Implementierung von Self-Healing Services, AI-Reparatur & Micro-Facts UI. |
| **RFC-031** | **Done** | **Cinematic UI** | Einführung von Hintergrund-Trailern, Fakten-Tab & User-Review Feld. |

---

## 4. Spezifikation des Frozen State v2.2.0 (Stability Guidelines)

### 4.1 Rollenbasierte Zugriffskontrolle (RBAC)
- **ADMIN/MANAGER:** Zugriff auf `/users` (Benutzerverwaltung) und System-Konfiguration.
- **USER:** Zugriff auf Sammlung, Profil und Listen.
- **Security Rule:** System-Settings (API-Keys) sind nur für privilegierte Rollen sichtbar.

### 4.2 Daten-Integrität & Anzeige
- **Timestamp Protection:** Datums-Anzeigen (z.B. `createdAt`) werden durch eine defensive `formatDate`-Funktion geschützt.

### 4.3 Mobile-spezifische Features
- **Scrollable Tables:** Große Datenmengen werden mobil durch horizontalen Scrollbereich (`min-w` + `overflow-x`) zugänglich gemacht.
- **Adaptive Modals:** Modals nutzen `flex-wrap` und `break-words`.

---

## 5. Wartungs-Checkliste (Operational Support)

- **Deployment:** Bei Build-Fehlern bzgl. `import.meta` sicherstellen, dass `vite-env.d.ts` im Root-Verzeichnis existiert.
- **API Management:** Die Funktion `getEffectiveApiKey` muss in allen Service-Calls genutzt werden.
- **Database Maintenance:** Nutze `services/maintenance.js` (mit temporärem Service-Role Key via Env-Var) für Massen-Updates und Deduplizierung.
- **Hydration:** Der Hydration-Service läuft automatisch beim App-Start im Hintergrund.

---

## 6. Version 2.3.0 Feature Log

### Core Systems
*   **Self-Healing Service:** Ein neuer Hintergrund-Dienst (`services/hydration.ts`) prüft Items auf fehlende Metadaten und ergänzt diese automatisch via TMDB/OMDb API.
*   **Wartungs-Script:** Ein Zero-Dependency Node.js Script zur Bereinigung von Duplikaten und Massen-Reparatur der Datenbank.

### AI & Intelligence
*   **Gemini Restoration:** Die AI-Funktionen (Avatar-Generator, ChatBot, Empfehlungen) wurden vollständig implementiert und auf das stabile Modell `gemini-1.5-flash` migriert.
*   **Context Awareness:** Der ChatBot nutzt nun den Kontext der User-Sammlung für intelligentere Antworten.

### UI Enhancements ("Micro-Facts")
*   **Detail View:** Erweiterung um Tagline (kursiv), Produktionsstatus (Badge) und finanzielle Kennzahlen (Budget/Revenue mit Farbkodierung).
*   **Data Density:** Verbesserte Anzeige von Laufzeiten und FSK-Ratings durch automatische Nachladung.

## 7. Version 2.3.1 Feature Log ("Cinematic Depth")

### Visual Experience
*   **Cinematic Background:** Detail-Ansichten nutzen nun den Trailer als vollflächigen, atmosphärischen Hintergrund (gedimmt & unscharf).
*   **Immersive Layout:** Optimierte Überlagerung von Inhalten für maximale Lesbarkeit vor dynamischen Hintergründen.

### Structural Changes
*   **Facts Tab:** Ein neuer Reiter "FAKTEN" bündelt technische Daten (Budget, Box Office, Originaltitel, Sammlung), um den "Überblick" zu entlasten.
*   **User Reviews:** Integration eines Notizfeldes direkt im Haupt-Tab für schnelles Feedback.

---
*Dokumentation nach ITIL v4 Standard archiviert am: 21.12.2025*