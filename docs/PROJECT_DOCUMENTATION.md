# InFocus CineLog - Service Design Package (SDP)

**Dokumentations-Standard:** ITIL v4 (Service Design)  
**Status:** Frozen Baseline (Stabiler Zustand)  
**Version:** 2.1.0 ("The Final Blueprint")  
**Zuletzt aktualisiert:** 12.05.2024

---

## 1. Service-Beschreibung (Service Description)
InFocus CineLog ist ein intelligenter Medien-Verwaltungsdienst, der AI-gestützte Analyse, Gamification und soziale Interaktion kombiniert, um das Verwalten von Watchlists zu revolutionieren.

### 1.1 Kernfunktionen
- **Vision-Suche:** Identifikation von Medien über Kamera-Bilder (Gemini Flash Vision).
- **Deep Content Analysis:** Personalisierte Einblicke basierend auf Rezensionen und Plot-Daten.
- **Smart Sync:** Echtzeit-Synchronisation von Listen über mehrere Benutzer hinweg.
- **Gamification:** Level-System (XP basierend auf Laufzeit) und Trophäen.

---

## 2. Technisches Design (Technical Architecture)

### 2.1 Frontend & UI/UX
- **Framework:** React 19 (Strict Mode) mit Vite 5.
- **Design-System:** "Stitch & Glass Fusion" – Eine Kombination aus tiefem Navy (#0B0E14) und hocheffektiven Glassmorphism-Elementen.
- **Interaktion:** Sentient Glass (Spotlight-Effekt auf Karten), Thumb-friendly Mobile-Navigation.

### 2.2 Backend & Schnittstellen (Integration Design)
- **Database/Auth:** Supabase (PostgreSQL / GoTrue).
- **Primary AI:** Google Gemini 3 Flash (API-Key via process.env.API_KEY).
- **Media Meta-Data:** TMDB API v3 (Primär) & OMDb API (Fallback für Smart Import).

---

## 3. RFC-Historie (Change & Release Management)

| ID | Status | Titel | Beschreibung |
|:---|:---|:---|:---|
| **RFC-001** | Done | Initial Setup | Deployment-Basis, Supabase Tabellen (Profiles, Media_Items). |
| **RFC-010** | Done | AI Core | Integration von Gemini Flash für Empfehlungen und Vision-Suche. |
| **RFC-012** | Done | Mobile Navigation | Einführung der schwebenden Such-Aktion und Bottom-Sheet Menüs. |
| **RFC-015** | Done | Stitch Design | Umstellung auf Deep-Navy Theme mit Spotlight-Interaktion. |
| **RFC-020** | Done | Shared Lists | Implementierung der Custom_Lists Tabelle und Share-Logik. |
| **RFC-021** | **Active** | **Restoration Fix** | Wiederherstellung von: Web-Sharing, Mobile AI Button, Mobile List Switcher & Admin-Zutritt für Settings. |

---

## 4. Spezifikation des Frozen State v2.1.0 (Stability Guidelines)

### 4.1 Rollenbasierte Zugriffskontrolle (RBAC)
- **ADMIN/MANAGER:** Vollzugriff auf Benutzerverwaltung (`/users`) und System-Konfiguration (API-Keys).
- **USER:** Zugriff auf Sammlung, Profil, Handbuch und Listen-Features.
- **Security Rule:** Der Button "Einstellungen" (API-Keys) ist im Profil-Dropdown nur für Admins sichtbar.

### 4.2 Web-spezifische Features
- **Listen-Sharing:** In der `ListRoute` existiert ein permanenter Button "Gliedern/Teilen" neben dem Listennamen, sofern der User der Owner ist.

### 4.3 Mobile-spezifische Features
- **AI Recommendation FAB:** Violetter Button fest fixiert unten links (z-index 50).
- **Listen-Switcher:** Das Icon ganz rechts in der `MobileNav` öffnet das `MobileListsModal` zur Navigation zwischen "Alle Filme" und spezifischen Listen.

---

## 5. Wartungs-Checkliste (Operational Support)

- **Daten-Integrität:** Bei jedem Item-Update muss `selectedItem` auf Nullwerte geprüft werden (Conditional Rendering).
- **API Management:** System-Keys (Vercel) werden durch User-Keys (LocalStorage) überschrieben, falls vorhanden.
- **Sprach-Erweiterung:** Neue Schlüssel müssen in `LanguageContext.tsx` synchron für `de` und `en` hinzugefügt werden.

---
*Dokumentation nach ITIL v4 Standard archiviert am: 12.05.2024*