
# InFocus CineLog - Service Design Package (SDP)

**Dokumentations-Standard:** ITIL v4  
**Status:** Live / In Operation  
**Version:** 1.9.31

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
| **...** | ... | ... | ... | ... |
| **RFC-040** | Security | **RBAC / Routing** | **Design Lab Lockdown:** Beschränkung der Route `/design-lab` auf Administratoren. | ✅ Done |
| **RFC-041** | Feature | **UI / UX** | **Sentient Glass (Phase 6):** Implementierung von "Smart Borders" und einem "Spotlight"-Effekt auf `MediaCard.tsx`. | ✅ Done |
| **RFC-042** | Bugfix | **Mobile / PWA** | **PWA Install Troubleshooting:** Erweiterung des `InstallPwaModal` um Hilfe-Texte. | ✅ Done |
| **RFC-043** | Feature | **Mobile / UX** | **Sentient Bottom Sheet:** Ersatz der Mobile-Dropdowns durch native-like Bottom Sheets zur Behebung von Viewport-Clipping und Verbesserung der Ergonomie. | ✅ Done |

---

## 4. Known Issues & Workarounds (Problem Management)

| Problem | Workaround |
|:---|:---|
| **Android Shortcut Failure** | Falls nach Klick auf "Installieren" kein Icon erscheint, muss in den Android-App-Einstellungen für Chrome die Berechtigung "Startbildschirm-Verknüpfungen" manuell aktiviert werden. Alternativ: "Drei-Punkte-Menü > App installieren". |

---

*Dokumentation aktualisiert: Version 1.9.31*
