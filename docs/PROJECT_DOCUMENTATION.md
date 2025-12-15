
# InFocus CineLog - Service Design Package (SDP)

**Dokumentations-Standard:** ITIL v4  
**Status:** Live / In Operation  
**Version:** 1.9.27

---

## 1. Service Strategy (Strategie)

### 1.1 Business Case & Vision
Das Ziel des Services **"InFocus CineLog"** ist die Bereitstellung einer hochverfügbaren, intelligenten Web-Applikation zur Verwaltung von Medienkonsum (Filme & Serien).

### 1.2 Architektur-Entscheidung: Client-Side Direct
Für die MVP-Phase und den privaten Gebrauch wurde bewusst die **"Client-Side Direct"** Architektur gewählt.
*   **Konzept:** API Keys (TMDB, OMDb, Gemini) liegen entweder in Umgebungsvariablen (Build-Time Injection), im `localStorage` des Nutzers ODER fest einkodiert im `App.tsx` (Fallback).
*   **Vorteil:** Keine komplexen Proxy-Server nötig, kostenlos das Hosting (Vercel Static), maximale Privatsphäre (Keys verlassen nie das Gerät des Nutzers Richtung eigener Server).
*   **Trade-off:** Keys sind im Client-Code theoretisch sichtbar (bei Injection). Dies ist für den Prototyp-Status akzeptiert ("Friends & Family" Risk Level).

---

## 2. Service Design (Design & Architektur)

### 2.1 Technische Architektur (Technology Stack)

*   **Frontend / Client Layer:**
    *   **Framework:** React 19 (Functional Components, Hooks)
    *   **Build Tool:** Vite (High Performance Bundling)
    *   **Language:** TypeScript (Typsicherheit)
    *   **Styling:** Tailwind CSS (Utility-First), Lucide React (Icons)
    *   **Routing:** React Router DOM v7
    *   **Visualization:** Recharts

*   **Data & Backend Layer (BaaS):**
    *   **Provider:** Supabase (PostgreSQL)
    *   **Auth:** Supabase Auth (Email/Password, Session Management)
    *   **Database:** Relationale Tabellen (`profiles`, `media_items`, `custom_lists`)
    *   **Security:** Row Level Security (RLS) Policies.

*   **Intelligence Layer (AI):**
    *   **Provider:** Google Gemini API
    *   **Modelle:** 
        *   `gemini-2.5-flash` (Text, Chat, Analyse)
        *   `gemini-2.5-flash-image` (Vision Search, Avatar Gen)
    *   **Integration:** `@google/genai` SDK

### 2.4 Configuration Management (CMS)
Verwaltung der externen Schnittstellen-Konfigurationen.

| CI Name | Typ | Status | Speicherort |
|:---|:---|:---|:---|
| **CI-TMDB-KEY** | API Key | Active | Env Var, LocalStorage oder Code-Fallback |
| **CI-OMDB-KEY** | API Key | Active | Env Var, LocalStorage oder Code-Fallback |
| **CI-GEMINI-KEY** | API Key | Active | Env Var, LocalStorage oder Code-Fallback |

---

## 3. Service Transition (Änderungshistorie / Change Management)

Hier sind die durchgeführten **Requests for Change (RFC)**, die zum aktuellen Build geführt haben.

### 🔄 Change Log

| ID | Change Type | Komponente | Beschreibung | Status |
|:---|:---|:---|:---|:---|
| **RFC-001** | Standard | **Core Setup** | Initialisierung des React/Vite Projekts, Tailwind Setup, Grundstruktur der Komponenten (`MediaCard`). | ✅ Done |
| **RFC-002** | Major | **Data Layer** | Integration der TMDB API. Implementierung der Suche und Detailansicht. | ✅ Done |
| **RFC-003** | Major | **Backend Migration** | Umstellung von LocalStorage-only auf **Supabase Cloud**. Einrichtung von Auth, Tabellen und RLS. Migrationstool für lokale Daten. | ✅ Done |
| **RFC-004** | Major | **AI Integration** | Implementierung der `gemini.ts` Services. Hinzufügen von **Vision Search** (Kamera-Upload) und **ChatBot**. | ✅ Done |
| **RFC-005** | Minor | **Social** | Einführung von "Custom Lists" und der Möglichkeit, Listen mit anderen User-IDs zu teilen (Many-to-Many Relation). | ✅ Done |
| **RFC-006** | Major | **Gamification** | Einführung des Level-Systems basierend auf Laufzeit (1 Min = 1 XP). Berechnung von Badges/Achievements im Frontend. | ✅ Done |
| **RFC-007** | Minor | **UX / Theming** | Implementierung des Theme-Switchers (Dark, Light, iOS Glassmorphism). Responsive Mobile Navigation. | ✅ Done |
| **RFC-008** | Emergency | **Performance** | **Smart Caching Update:** Implementierung von LocalStorage-Cache für AI-Anfragen (Empfehlungen & Analysen) zur Schonung des API-Limits. Fallback-Modus für Offline-Szenarien. | ✅ Done |
| **RFC-009** | Standard | **User Mgmt** | Admin-Dashboard zur Verwaltung von Benutzerrollen (RBAC: User, Manager, Admin). | ✅ Done |
| **RFC-010** | Standard | **Documentation** | Erstellung der Landing Page (`docs/index.html`) und ITIL-Dokumentation. | ✅ Done |
| **RFC-011** | Minor | **Ext. Data** | Integration von **Rotten Tomatoes Scores** via OMDb API. Erweiterung des DB-Schemas um `rt_score`. Anzeige in DetailView und MediaCard. | ✅ Done |
| **RFC-012** | Minor | **UX/Data** | **Retroactive Fetching:** Implementierung eines Fallbacks in der Detailansicht, der fehlende RT-Scores live nachlädt. | ✅ Done |
| **RFC-013** | Minor | **Data Integrity** | **Rating Persistence:** Nachträglich geladene RT-Scores werden nun sofort in der Datenbank (`media_items`) gespeichert, damit sie auch in der Übersicht (Grid) sichtbar sind. | ✅ Done |
| **RFC-014** | Major | **Social** | **Community Reviews:** Umwandlung von privaten Notizen in öffentliche Rezensionen. Integration eines Feeds in der Detailansicht, der Rezensionen anderer Nutzer anzeigt. | ✅ Done |
| **RFC-015** | Bugfix | **Settings / AI** | **Key Persistence Fix:** Automatisches Speichern des Gemini Keys nach erfolgreichem Verbindungstest (Auto-Save). Erweitertes Error-Handling im Chat für Quota (429) und Auth (403) Fehler. | ✅ Done |
| **RFC-016** | Minor | **UX / Admin** | **RBAC Visibility Check:** Implementierung einer visuellen Trennung (Header) für den Admin-Bereich in der Sidebar, um die Zugriffskontrolle transparent zu machen. | ✅ Done |
| **RFC-017** | Bugfix | **UX / Layout** | **Modal Portal Fix:** Refactoring des `AiRecommendationButton` zur Nutzung von `React.createPortal`. Behebt Clipping-Probleme (z-index Context) innerhalb der Sidebar auf Mobile & Desktop. | ✅ Done |
| **RFC-018** | Feature | **Help** | **In-App Guide:** Implementierung der `GuidePage` als interaktives Handbuch. Integration eines Links in den Einstellungen. | ✅ Done |
| **RFC-019** | Major | **Security** | **Security Hardening:** Erhöhung der minimalen Passwortlänge von 6 auf 8 Zeichen. Implementierung eines visuellen "Strength Meter" bei der Registrierung für bessere UX bei erhöhter Sicherheit. | ✅ Done |
| **RFC-020** | Minor | **UX / Help** | **Guide Access:** Handbuch nun auch auf dem Login-Screen verfügbar (Overlay), um neuen Nutzern Features & Sicherheitskonzepte vorab zu erklären. | ✅ Done |
| **RFC-021** | Minor | **UX / Mobile** | **Mobile Polish:** Optimierung der Dropdown-Menüs (Breite/Überlagerung), Anpassung der ChatBot-Position, Z-Index Korrekturen für Modals und explizite Implementierung des AI-Recommendation Buttons für Mobile. | ✅ Done |
| **RFC-022** | Critical | **Social / DB** | **Realtime & Sharing Fix:** Implementierung einer Supabase Realtime-Subscription in `App.tsx` für sofortige Listen-Updates. Überarbeitung der Benachrichtigungslogik. Bereitstellung der **zwingend notwendigen SQL-Policy** für geteilte Listen. | ✅ Done |
| **RFC-023** | Bugfix | **DB / SQL** | **Postgres Array Syntax Fix:** Korrektur des SQL-Statements für die Sharing-Policy. Nutzung von `ANY (array)` statt des JSON-Operators `?`, um Fehler `42883` zu beheben. | ✅ Done |
| **RFC-024** | Feature | **Social / DB** | **Shared Item Visibility:** Einführung einer SQL-Policy, die das Lesen von `media_items` erlaubt, wenn diese Teil einer geteilten Liste sind. Anpassung des Frontends, um geteilte Items in der Hauptansicht auszublenden. | ✅ Done |
| **RFC-025** | Bugfix | **DB / SQL** | **UUID Casting Fix:** Korrektur der `media_items` Policy. Die `id` Spalte (UUID) muss explizit zu `text` gecastet werden (`::text`), um sie mit dem `items` Array (Text[]) in `custom_lists` zu vergleichen. Behebt Fehler `42883: operator does not exist: uuid = text`. | ✅ Done |
| **RFC-026** | Minor | **UX / DetailView** | **Smart Share Upgrade:** Entfernung der "Vibe"-Smilies. Ersatz durch einen kontextsensitiven "Share"-Button, der auf Mobile das native Teilen-Menü öffnet und auf Desktop in die Zwischenablage kopiert. | ✅ Done |
| **RFC-027** | Feature | **Analytics** | **Smart Stats Core:** Umbau des Donut-Charts. Einführung eines interaktiven Zentrums ("Informative Center") zur Anzeige von Gesamt- und Detailwerten sowie eines Switches zum Wechsel zwischen "Anzahl" und "Laufzeit". | ✅ Done |
| **RFC-028** | Critical | **Build / Ops** | **Config Stabilization:** Erzwingung von CommonJS in Config-Dateien (`module.exports`) und Bereitstellung von `index.css`, um Vercel-Deployment Warnungen und Fehler zu beheben. | ✅ Done |
| **RFC-029** | Critical | **Build / Ops** | **Sync Force (Fix v1.0.3):** Version-Bump aller Config-Dateien auf 1.0.3 / 1.9.17, um Git-Tracking zu erzwingen und Deployment-Fehler endgültig zu beheben. | ✅ Done |
| **RFC-030** | Critical | **Mobile / UX** | **Mobile Key Isolation Incident:** Korrektur des Umgangs mit dem TMDB API Key. Implementierung des `SearchModal` Eingabe-UIs, um Keys lokal speichern zu können, falls keine Env-Vars vorhanden sind. | ✅ Done |
| **RFC-031** | Strategic | **Security** | **Client-Side Direct Architecture:** Bestätigung der Architektur-Entscheidung. Keys können via `vite.config.ts` injiziert werden (für Convenience) oder manuell eingegeben werden (für Flexibilität). Doku angepasst. | ✅ Done |
| **RFC-032** | Minor | **UX / Cleanup** | **Avatar Modernization:** Entfernung der `js-md5` Abhängigkeit und des Gravatar-Fallbacks. Standardisierung auf die farbenfrohen DiceBear "Adventurer" Avatare für ein lebendigeres UI und schlankeren Code. | ✅ Done |
| **RFC-033** | Feature | **Config / Ops** | **Hardcoded Key Fallback:** Implementierung eines `FALLBACK_KEYS` Objekts in `App.tsx`. Ermöglicht Entwicklern das direkte Eintragen von API Keys im Quellcode, um die App ohne Environment Variables (Vercel) oder manuelle Eingabe durch Endnutzer zu betreiben. | ✅ Done |
| **RFC-034** | Standard | **UI / Design** | **Stitch Design Finalization:** Korrektur der `AuthPage.tsx` (Cut-off Fix), Synchronisierung der `manifest.json` Farben (#0B0E14) und globale CSS-Anpassungen (Selection Color) für konsistenten Look. | ✅ Done |
| **RFC-035** | Standard | **UI / Branding** | **Web Typography & Branding Polish:** Erzwungene Sichtbarkeit des "InFocus"-Brandings im Header. Massive Vergrößerung der Schriftarten in `Stats.tsx` und `MediaCard.tsx` für bessere Lesbarkeit auf Desktop-Screens. Optimierung der Charts-Logik. | ✅ Done |
| **RFC-036** | Standard | **UI / Data** | **MediaCard Metadata Restoration:** Wiedereinführung der Icons für TMDB und Rotten Tomatoes, Anzeige der Laufzeit und der Hauptdarsteller (Cast) in der Listenansicht (Grid), unter Beibehaltung des neuen "Stitch"-Designs. | ✅ Done |
| **RFC-037** | Bugfix | **Auth** | **Auth Logic Hardening:** Entkopplung der Datenbank-Abfragen vom Login-Prozess. Der Login erfolgt nun priorisiert via E-Mail. Broadcast-Events und Username-Lookups finden erst NACH erfolgreicher Authentifizierung statt, um RLS-Fehler bei anonymen Zugriffen zu verhindern. | ✅ Done |
| **RFC-038** | Emergency | **Build / Ops** | **PromiseLike Fix:** Umbau der asynchronen Broadcast-Logik in `AuthContext` auf `async/await` IIFE, um TypeScript-Fehler `Property 'catch' does not exist on type 'PromiseLike<void>'` während des Vercel Builds zu beheben. | ✅ Done |

---

*Dokumentation aktualisiert: Version 1.9.27*
