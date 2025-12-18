# InFocus CineLog - Service Design Package (SDP)

**Dokumentations-Standard:** ITIL v4  
**Status:** Live / In Operation  
**Version:** 1.9.40

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
        *   `gemini-3-flash-preview` (Text, Chat, Analyse)
        *   `gemini-2.5-flash-image` (Vision Search, Avatar Gen)
    *   **Integration:** `@google/genai` SDK

---

## 3. Service Transition (Änderungshistorie / Change Management)

Hier sind die durchgeführten **Requests for Change (RFC)**, die zum aktuellen Build geführt haben.

### 🔄 Change Log

| ID | Change Type | Komponente | Beschreibung | Status |
|:---|:---|:---|:---|:---|
| **RFC-001** | Standard | **Core Setup** | Initialisierung des React/Vite Projekts, Tailwind Setup. | ✅ Done |
| **...** | ... | ... | ... | ... |
| **RFC-042** | Bugfix | **Mobile / PWA** | **PWA Install Troubleshooting:** Erweiterung des `InstallPwaModal`. | ✅ Done |
| **RFC-043** | Feature | **Mobile / UX** | **Sentient Bottom Sheet:** Ersatz der Mobile-Dropdowns. | ✅ Done |
| **RFC-044** | Bugfix | **Video / UI** | **YouTube Bot-Bypass & Glow Boost:** Spezialisierte Embed-Parameter (`widgetid`, `origin`) zur Umgehung der Bot-Sperre auf Desktop-Browsern und Verstärkung der Hintergrund-Sphären auf v1.9.40. | ✅ Done |

---

## 4. Known Issues & Workarounds (Problem Management)

| Problem | Workaround |
|:---|:---|
| **YouTube "Bot" Meldung** | Trotz RFC-044 kann YouTube bei extrem restriktiven Browser-Privacy-Einstellungen (z.B. Hardened Firefox) das Laden blockieren. Workaround: "Relativ-Skalierung im Browser prüfen oder Third-Party-Cookies für YouTube kurzzeitig erlauben". |
| **Android Shortcut Failure** | Falls nach Klick auf "Installieren" kein Icon erscheint: Berechtigung "Startbildschirm-Verknüpfungen" in Chrome-Einstellungen prüfen. |

---

*Dokumentation aktualisiert: Version 1.9.40*