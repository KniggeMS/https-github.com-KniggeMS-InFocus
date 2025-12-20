InFocus CineLog - Service Design Package (SDP)

Dokumentations-Standard: ITIL v4
Status: Operational / Stable Baseline
Version: 2.1.0 ("The Perfect State")

1. Release Notes (v2.1.0)
Dieser Zustand wurde als "perfekt" markiert und dient als Referenzpunkt für alle zukünftigen Entwicklungen.

1.1 Kritische Korrekturen (Stability Fixes)
- Mobile Blue-Screen Fix: Das Rendering der DetailView in der App.tsx wurde auf "Conditional Rendering" umgestellt (selectedItem && ...). Dies verhindert Absturze beim App-Start auf Mobilgeräten.
- Translation Keys: Korrektur der Status-Label und UI-Strings (forgot_password, email, etc.) zur Vermeidung von Platzhaltern in der Vorschau.
- Sidebar Persistence: Die Sektion "Geteilte Listen" wurde fest in die Sidebar-Logik integriert.

1.2 Design-Philosophie (Proportionen)
- Container-Konzept: Die Detailansicht nutzt ein zentriertes Container-Layout (max-w-5xl) anstelle eines Fullscreen-Ansatzes, um die Lesbarkeit auf großen Monitoren zu wahren.
- Kompakte Typografie: Überschriften wurden für eine edlere Ästhetik von 6xl auf 5xl (Desktop) und 3xl (Mobile) reduziert.
- Trailer-Integrität: Der Trailer wird ausschließlich in der linken Poster-Säule gerendert, um den Lesefluss der Informationen rechts nicht zu unterbrechen.

2. Technische Architektur
2.1 Frontend Stack
- Framework: React 19 (Strict Mode)
- Styling: Tailwind CSS (Stitch & Glass Fusion)
- Icons: Lucide React
- AI: Google Gemini 3 Flash (Text & Vision)

2.2 Datenhaltung (Supabase)
- Profiles: Benutzerdaten & Rollen (RBAC)
- Media_Items: Globale Liste aller Einträge mit User-Zuordnung.
- Custom_Lists: Eigene Sammlungen mit Realtime-Sharing Funktionalität.

3. Wartung & API Management
Die App nutzt eine hybride Key-Strategie:
- System-Keys: Werden über Vercel Environment Variables (API_KEY, etc.) injiziert.
- User-Overrides: Nutzer können in den Einstellungen eigene Keys hinterlegen, die im LocalStorage gespeichert werden.

Checkliste für Updates:
1. Immer selectedItem auf Null-Werte prüfen.
2. Neue Sprachschlüssel müssen in LanguageContext.tsx für DE und EN hinterlegt werden.
3. CSS-Änderungen sollten die glass-panel Utility nutzen.

Dokumentation gesichert am: 12.05.2024