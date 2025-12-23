# Plan: Screenshot Feedback Fixes

**Ziel:** Systematische Abarbeitung der visuellen und funktionalen Fehler, die durch die Screenshot-Sammlung (58 Dateien) dokumentiert wurden, sowie neuer Regressionen und UX-Verbesserungen.

## 📝 Priorisierung & Strategie

Ich gruppiere die Fehler in 5 Phasen. Wir arbeiten sie strikt nacheinander ab. Nach jeder Phase erfolgt ein **Verifikations-Check**.

### 🚨 Phase 1: Daten-Integrität & AI (Critical)
Die App wirkt "kaputt", wenn Daten fehlen oder Buttons nichts tun.
- [x] **Fix RT Scores:** Analyse und Fix der Persistenz-Pipeline (DB, TMDB & Import Sync).
- [x] **Fix AI Buttons:** Fehlerbehandlung und Benutzer-Feedback hinzugefügt.
- [x] **Fix Scrolling:** AI Tipp FAB auf Mobile nun korrekt fixiert (`z-100`).
- [x] **Fix DetailView Sync:** Favoriten-Status aktualisiert sich nun sofort in der UI.

### 📐 Phase 2: Profil & Navigation (High)
Das Profilmenü ist zentral für die UX.
- [x] **Refactor Profilmenü:** Menü umstrukturiert und Admin-Tools gruppiert.
- [x] **Cleanup Profil:** Redundante Gamification-Elemente von der Profilseite entfernt.
- [x] **Fix Settings/Import:** Buttons sind im neuen Menü korrekt als Admin-Tools platziert und funktional.
- [x] **Regression Fix: Design Lab Visibility:** "Design Lab" Button ist jetzt für alle Benutzer im Profilmenü sichtbar.
- [x] **Regression Fix: Stats Overlay:** `Stats`-Komponente wird bedingt gerendert, um Überlappung mit dem Profilmenü zu verhindern.

### 🔗 Phase 3: Listen & Teilen (Medium)
Social Features müssen funktionieren.
- [x] **Fix Share Button:** Layout-Problem des Buttons korrigiert.
- [x] **Fix List Management:** `prompt()` durch dediziertes `RenameListModal` ersetzt.
- [x] **UI Polish:** "Teilen" Button Aussehen bei leeren/kleinen Listen verbessert.

### 🎨 Phase 4: UI Polishing (Low)
Visuelle Konsistenz.
- [x] **Matrix Layout:** Abstände und Höhen der MediaCards vereinheitlicht.
- [x] **Login/Register UI:** Anpassen an Mockups (Handbuch-Link, Sprachwahl).
- [x] **Trailer Overlay:** In manuelles Testprotokoll übernommen.
- [x] **Regression Fix: Stats Theming:** `Stats`-Komponente verwendet semantische Theme-Klassen.
- [x] **Enhancement: DetailView 'Facts' Tab:** Erweitert mit zusätzlichen Details (Tagline, Production Status).
- [x] **Enhancement: DetailView 'Analysis' Tab:** AI-Analyse in neuen Tab verschoben.
- [x] **Enhancement: MediaCard Hover Scale:** Skalierung des Hover-Effekts angepasst (oder war bereits korrekt).
- [x] **Enhancement: DetailView Scrolling:** "Mehr anzeigen/Weniger anzeigen" für Plot-Text implementiert.

### 🌍 Phase 5: Übersetzungen (Lowest)
- [x] **Chat:** Chat-Interface übersetzt.
- [x] **Buttons:** Fehlende Labels übersetzt.

## 🧪 Testing Strategy (Conductor Compliant)
Für jeden Fix wird (wo möglich) ein **automatisierter Test** erstellt oder erweitert.
- **RT Scores:** API Mock Test (prüfen ob Score gerendert wird).
- **Buttons:** Playwright Click-Test.
- **Profile Menu Visibility:** Neuer E2E-Test für die Sichtbarkeit des "Design Lab" Buttons für alle Benutzer.
- **Theming:** Bestehende Theming-Tests (`design-lab.spec.ts`) nutzen, um thematische Korrektheit zu prüfen.