# InFocus CineLog - Service Design Package (SDP)

**Dokumentations-Standard:** ITIL v4 (Service Design)  
**Status:** Frozen Baseline (Stabiler Zustand)  
**Version:** 2.2.0 ("The Stability & Scale Release")  
**Zuletzt aktualisiert:** 20.12.2025

---

## 1. Service-Beschreibung (Service Description)
InFocus CineLog ist ein intelligenter Medien-Verwaltungsdienst, der AI-gestützte Analyse, Gamification und soziale Interaktion kombiniert.

### 1.1 Kernfunktionen
- **Vision-Suche:** Identifikation von Medien über Kamera-Bilder (Gemini Flash Vision).
- **Deep Content Analysis:** Personalisierte Einblicke basierend auf Rezensionen und Plot-Daten.
- **Smart Sync:** Echtzeit-Synchronisation von Listen über mehrere Benutzer hinweg.
- **Gamification:** Level-System (XP basierend auf Laufzeit) und Trophäen.

---

## 2. Technisches Design (Technical Architecture)

### 2.1 Frontend & UI/UX
- **Framework:** React 19 (Strict Mode) mit Vite 5.
- **Typisierung:** TypeScript 5.x mit expliziten Vite-Client-Typen (`vite-env.d.ts`).
- **Design-System:** "Stitch & Glass Fusion" – Deep Navy (#0B0E14) mit hocheffektiven Glassmorphism-Elementen.
- **Responsivität:** Mobile-First Design mit horizontal scrollbaren Daten-Tabellen und adaptiven Modals.

### 2.2 Backend & Schnittstellen (Integration Design)
- **Database/Auth:** Supabase (PostgreSQL / GoTrue).
- **Primary AI:** Google Gemini 3 Flash.
- **Media Meta-Data:** TMDB API v3 & OMDb API.
- **Environment Management:** Hybride Key-Erkennung (Vercel Managed Env > LocalStorage).

---

## 3. RFC-Historie (Change & Release Management)

| ID | Status | Titel | Beschreibung |
|:---|:---|:---|:---|
| **RFC-001** | Done | Initial Setup | Deployment-Basis, Supabase Tabellen. |
| **RFC-010** | Done | AI Core | Integration von Gemini Flash. |
| **RFC-012** | Done | Mobile Navigation | Einführung der schwebenden Such-Aktion & Bottom-Sheets. |
| **RFC-021** | Done | Restoration Fix | Wiederherstellung Web-Sharing & Mobile AI Button. |
| **RFC-025** | **Done** | **Build & Env Fix** | Einführung von `vite-env.d.ts` & Umstellung auf `import.meta.env`. |
| **RFC-026** | **Done** | **Responsive Tables** | Einführung von `overflow-x-auto` für Mobile Benutzerverwaltung. |
| **RFC-027** | **Done** | **Key-State Sync** | Grüne "VERCEL ACTIVE" Badges im UI bei Cloud-Keys. |

---

## 4. Spezifikation des Frozen State v2.2.0 (Stability Guidelines)

### 4.1 Rollenbasierte Zugriffskontrolle (RBAC)
- **ADMIN/MANAGER:** Zugriff auf `/users` (Benutzerverwaltung) und System-Konfiguration.
- **USER:** Zugriff auf Sammlung, Profil und Listen.
- **Security Rule:** System-Settings (API-Keys) sind nur für privilegierte Rollen sichtbar.

### 4.2 Daten-Integrität & Anzeige
- **Timestamp Protection:** Datums-Anzeigen (z.B. `createdAt`) werden durch eine defensive `formatDate`-Funktion geschützt, um Build-Abbrüche bei Nullwerten zu verhindern.

### 4.3 Mobile-spezifische Features
- **Scrollable Tables:** Große Datenmengen werden mobil durch horizontalen Scrollbereich (`min-w` + `overflow-x`) zugänglich gemacht.
- **Adaptive Modals:** Modals nutzen `flex-wrap` und `break-words`, um auf schmalen Screens nicht abzubrechen.

---

## 5. Wartungs-Checkliste (Operational Support)

- **Deployment:** Bei Build-Fehlern bzgl. `import.meta` sicherstellen, dass `vite-env.d.ts` im Root-Verzeichnis existiert.
- **API Management:** Die Funktion `getEffectiveApiKey` muss in allen Service-Calls (TMDB/OMDb) genutzt werden, um Vercel-Keys zu priorisieren.
- **Sprach-Erweiterung:** Neue UI-Elemente müssen zwingend in `LanguageContext.tsx` unter `de` und `en` registriert werden.

---
*Dokumentation nach ITIL v4 Standard archiviert am: 20.12.2025*