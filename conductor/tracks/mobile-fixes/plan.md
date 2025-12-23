# Plan: Mobile Polishing

**Ziel:** Optimierung der User Experience auf Smartphones (iOS/Android) und Behebung visueller Bugs.

## 📝 Status
- **Startdatum:** 22.12.2025
- **Priorität:** Mittel (Wartet auf Input)

## 📥 Input Needed
- [x] **Fehler-Report:** PDF "Mobil1.pdf" analysiert.

## 📋 To Do
- [x] **Analyse PDF:** Fehler klassifizieren (4 Punkte identifiziert).
- [x] **Fix 1:** Berechtigungen (Smart Import nur für Admins).
- [x] **Fix 2:** AI Tipp Button (Mobile FAB hinzugefügt).
- [x] **Fix 3:** Listen-Button (Bottom Sheet mit Listen-Übersicht implementiert).
- [x] **Fix 4:** App Installieren (PWA Hook `usePwaInstall` integriert).
- [x] **Verification:** Automatisierter Playwright-Test für Benutzer-Berechtigungen & Mobile UI (`e2e/mobile-fixes.spec.ts`, `e2e/permissions.spec.ts`).
- [x] **Bugfix:** Design Lab Modal (Z-Index Fix & Test).

## 📱 Resolved Issues
- "Einstellungen" und "Smart Import" waren für User sichtbar -> Fixed.
- "App installieren" ohne Funktion -> Fixed (Hook).
- "AI Tipp" fehlte mobil -> Fixed (FAB).
- Listen-Button ohne Funktion -> Fixed (BottomSheet).
- Design Lab ließ sich nicht schließen -> Fixed (Z-Index).