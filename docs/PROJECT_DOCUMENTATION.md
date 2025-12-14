
# InFocus CineLog - Service Design Package (SDP)

**Dokumentations-Standard:** ITIL v4  
**Status:** Live / In Operation  
**Version:** 1.9.17

---

## 1. Service Strategy (Strategie)

### 1.1 Business Case & Vision
Das Ziel des Services **"InFocus CineLog"** ist die Bereitstellung einer hochverfügbaren, intelligenten Web-Applikation zur Verwaltung von Medienkonsum (Filme & Serien). Im Gegensatz zu statischen Listen bietet dieser Service durch AI-Integration einen Mehrwert durch Kontextverständnis und personalisierte Empfehlungen.

### 1.2 Service Portfolio
*   **Core Service:** Verwaltung von Watchlists (CRUD) und Status-Tracking.
*   **Enhancing Service:** 
    *   **Vision Search:** Bilderkennung von Filmplakaten via Google Gemini Vision.
    *   **Deep Analysis:** Kontextbezogene Analyse von User-Notizen mittels LLM.
    *   **Social Sync:** Echtzeit-Synchronisation von Listen zwischen Benutzern.
    *   **Rating Aggregation:** Integration von Rotten Tomatoes Scores (via OMDb).
    *   **Community Feed:** Öffentliche Rezensionen und Meinungsaustausch.
    *   **Smart Analytics:** Interaktive Visualisierung von Sehgewohnheiten.
*   **Gamification Service:** XP-System und Achievements zur Steigerung der User-Retention.

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

*   **External Data Sources:**
    *   **Primary:** TMDB API (Metadaten, Bilder, Credits)
    *   **Secondary:** OMDb API (Rotten Tomatoes Ratings & Import-Matching)

### 2.2 Service Level Requirements (SLR)
1.  **Verfügbarkeit:** 99.5% (abhängig von Vercel/Supabase Uptime).
2.  **Performance:**
    *   First Contentful Paint (FCP) < 1.5s.
    *   AI Response Time < 3s (Caching Strategie implementiert).
3.  **Datensicherheit:**
    *   Keine Speicherung von Passwörtern im Klartext (Supabase Auth).
    *   Trennung von User-Daten durch RLS.
    *   **Neu (v1.9.4):** Erzwungene Passwort-Mindestlänge von 8 Zeichen mit visueller Stärke-Anzeige.

### 2.3 Capacity Management & Caching
Um API-Quotas (Google Gemini / TMDB / OMDb) zu schonen und die Latenz zu verringern, wurde eine **Smart Caching Strategie** implementiert:
*   **LocalStorage:** Speicherung von AI-Analysen und Empfehlungen.
*   **Hashing:** User-Notizen werden gehasht; ändert sich die Notiz nicht, wird der Cache verwendet (0 API Calls).
*   **TTL (Time To Live):** Empfehlungen laufen nach 1 Stunde ab.

### 2.4 Configuration Management (CMS)
Verwaltung der externen Schnittstellen-Konfigurationen (Configuration Items - CIs).

| CI Name | Typ | Status | Verantwortlich | Beschreibung |
|:---|:---|:---|:---|:---|
| **CI-TMDB-KEY** | API Key | Active | Admin | Zugriff auf Metadaten. Default Key hinterlegt. |
| **CI-OMDB-KEY** | API Key | Active | Admin | Zugriff auf RT Ratings. Key Endung: `...5dc9`. |
| **CI-GEMINI-KEY** | API Key | Active | User/Env | AI Features. Wird via `.env` oder LocalStorage injiziert. |

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

---

## 4. Service Operation (Betrieb)

### 4.1 SQL Migration für Sharing (WICHTIG!)
Standardmäßig erlaubt Supabase nur den Zugriff auf eigene Daten. Damit das Teilen von Listen funktioniert, muss folgende SQL-Policy im Supabase SQL Editor ausgeführt werden:

#### Schritt 1: Zugriff auf Listen erlauben (Custom Lists)
```sql
drop policy if exists "Allow shared lists" on custom_lists;

create policy "Allow shared lists" on custom_lists
  for select using (
    auth.uid() = owner_id or 
    auth.uid()::text = ANY (shared_with)
  );
```

#### Schritt 2: Zugriff auf die Inhalte der Listen erlauben (Media Items) - **NEU!**
*Dieser Schritt ist notwendig, damit Benutzer die Filme in einer geteilten Liste sehen können, auch wenn sie ihnen nicht gehören.*

```sql
drop policy if exists "Allow viewing shared list items" on media_items;

create policy "Allow viewing shared list items" on media_items
  for select using (
    auth.uid() = user_id -- Eigene Items
    or exists (
      select 1 from custom_lists
      where media_items.id::text = any(custom_lists.items) -- Item ist in Liste (Cast zu Text wichtig!)
      and (
         auth.uid()::text = any(custom_lists.shared_with) -- Liste ist mit mir geteilt
         or custom_lists.owner_id = auth.uid()
      )
    )
  );
```

### 4.2 Incident Management (Fehlerbehandlung)
*   **API Ausfälle (Gemini):** Das System fällt auf einen deterministischen Algorithmus zurück (`generateOfflineAnalysis`), der Metadaten analysiert, ohne die AI zu rufen.
*   **API Ausfälle (TMDB/OMDb):** Fehlermeldungen werden dem User angezeigt. Bestehende Daten kommen aus der Supabase DB (Fallback bei fehlenden Ratings).
*   **Auth Issues:** Token-Refresh wird automatisch durch das Supabase SDK gehandhabt.

### 4.3 Access Management (Rollenkonzept)
Das System unterscheidet drei Rollen, gesteuert über die `profiles` Tabelle:
1.  **USER:** Standardrechte. Kann eigene Listen erstellen, Profil bearbeiten.
2.  **MANAGER:** Kann andere User sehen und moderieren (außer Admins).
3.  **ADMIN:** Voller Zugriff. Kann Rollen zuweisen, API-Keys verwalten (via UI).

### 4.4 Request Fulfillment (User Anfragen)
*   **Passwort Reset:** Self-Service via E-Mail Link (implementiert in `AuthContext` & `RecoveryPage`).
*   **Datenexport:** Aktuell nicht implementiert (Feature Request).

---

## 5. Continual Service Improvement (CSI)

Geplante Verbesserungen für kommende Sprints:

1.  **Push Notifications:** Benachrichtigung bei neuen Filmen in geteilten Listen (via Service Worker).
2.  **Advanced Analytics:** Dashboard für User mit Graphen zum Watch-Verhalten (Genre-Verlauf über Zeit).
3.  **Native App Wrapper:** Verpacken der PWA mittels Capacitor für App Store Release.

---

*Dokumentation aktualisiert: Jetzt (Version 1.9.17) durch Senior Lead Engineer*
