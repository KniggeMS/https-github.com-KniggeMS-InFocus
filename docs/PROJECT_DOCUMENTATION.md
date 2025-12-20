# InFocus CineLog - Service Design Package (SDP)

**Dokumentations-Standard:** ITIL v4
**Status:** Operational / Stable Baseline (FROZEN STATE)
**Version:** 2.1.0 ("The Final Blueprint")
**Zuletzt aktualisiert:** 12.05.2024

---

## 1. Release Notes (v2.1.0)

Dieser Zustand ist als finale Baseline markiert. Er dient als Referenzpunkt für alle Service-Wiederherstellungen.

### 1.1 Kritische Korrekturen (Stability Fixes)

- **RBAC Security Lockdown:** Der Zugang zu den API-Settings (`SettingsModal`) wurde strikt auf Rollen `ADMIN` und `MANAGER` beschränkt. Normale User haben keinen Zugriff mehr auf System-Keys.
- **Mobile Navigation Logic:** Der Listen-Switcher (unten rechts) wurde für Mobilgeräte reaktiviert, um einen nahtlosen Wechsel zwischen globaler Kollektion und geteilten Listen zu ermöglichen.
- **UI Restoration:** Der lila AI-FAB (Floating Action Button) wurde für Mobile-User fixiert. Das "Gliedern/Teilen"-Feature für Web-User wurde in der ListRoute konsolidiert.
- **Translation Integrity:** Alle Sprachschlüssel wurden auf ITIL-Konformität geprüft. Status-Mapping erfolgt nun konsistent von Lowercase-Keys (`to_watch`) auf lokalisierte Labels (`Geplant`).

---

## 2. Technische Architektur

### 2.1 Frontend Stack
- **Framework:** React 19 (Strict Mode)
- **Styling:** Tailwind CSS (Design-Philosophie: Stitch & Glass Fusion)
- **Icons:** Lucide React
- **AI Integration:** Google Gemini 3 Flash (Primary Inference)

### 2.2 Datenhaltung (Supabase)
- **Profiles Table:** Speichert User-Metadaten und RBAC-Rollen.
- **Media_Items Table:** Globale Bibliothek mit User-Besitz-Logik.
- **Custom_Lists Table:** Realtime-Listen mit Shared-User Arrays.

---

## 3. RFC-Historie (Change Management)

| ID | Status | Titel | Beschreibung |
|:---|:---|:---|:---|
| **RFC-001** | Approved | Initial Setup | Deployment-Basis, Supabase Tabellen (Profiles, Media_Items). |
| **RFC-010** | Approved | AI Core | Integration von Gemini Flash für Empfehlungen und Vision-Suche. |
| **RFC-012** | Approved | Mobile Navigation | Einführung der schwebenden Such-Aktion und Bottom-Sheet Menüs. |
| **RFC-015** | Approved | Stitch Design | Umstellung auf Deep-Navy Theme mit Spotlight-Interaktion. |
| **RFC-020** | Approved | Shared Lists | Implementierung der Custom_Lists Tabelle und Share-Logik. |
| **RFC-021** | **Frozen** | **Baseline v2.1.0** | Admin-Security Lockdown, Mobile-Nav Fixes & ITIL-Lokalisation. |

---

## 4. Service Design Richtlinien

### 4.1 UI Proportionen
- **Container-Konzept:** Die Detailansicht nutzt `max-w-5xl` für optimale Lesbarkeit auf Desktop-Systemen.
- **Kompakte Typografie:** Überschriften sind auf Desktop `text-5xl` und auf Mobile `text-3xl`.
- **Trailer-Integrität:** Video-Inhalte werden ausschließlich in der dedizierten Poster-Säule gerendert.

### 4.2 Wartung & Compliance
- **Daten-Integrität:** Vor jedem Item-Rendering muss eine Prüfung auf Null-Werte erfolgen (`selectedItem && ...`).
- **Checkliste für Updates:**
    1. Neue Sprachschlüssel in `LanguageContext.tsx` für DE und EN spiegeln.
    2. CSS-Änderungen müssen die `glass-panel` Utility-Klasse respektieren.
    3. Admin-Zutrittsberechtigungen in `App.tsx` dürfen nicht ohne Security-Review geändert werden.

---
*Dokumentation nach ITIL v4 Standard gesichert am: 12.05.2024*
