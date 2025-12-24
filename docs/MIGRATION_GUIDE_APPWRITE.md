# Migrations-Leitfaden: Supabase zu Appwrite

Dieser Leitfaden beschreibt die notwendigen Schritte, um das Backend von "InFocus CineLog" von Supabase (PostgreSQL) auf Appwrite (Document Store) zu migrieren.

## 1. Architektur-Vergleich

| Konzept | Supabase (Aktuell) | Appwrite (Ziel) | Implikation |
| :--- | :--- | :--- | :--- |
| **Datenbank** | PostgreSQL (Relational) | MariaDB/MongoDB (Document Store) | Keine Joins im klassischen Sinn. Relationen funktionieren anders. |
| **Struktur** | Tabellen & Spalten | Datenbanken & Collections | Tabellen müssen neu angelegt werden. |
| **Sicherheit** | Row Level Security (RLS) via SQL | Permissions (ACL) pro Dokument | Sicherheitslogik muss vom SQL-Code in den App-Code wandern. |
| **IDs** | UUIDs (oft automatisch) | String IDs (via `ID.unique()`) | Code muss IDs explizit generieren. |

## 2. Vorbereitung (Infrastruktur)

1.  **Appwrite Instanz aufsetzen:**
    *   Entweder Appwrite Cloud (Managed) oder Self-Hosted (Docker).
    *   Projekt erstellen ("InFocus").
2.  **Datenbank erstellen:**
    *   DB Name: `cinelog_db`
3.  **Collections anlegen:**
    *   Analog zu den Supabase Tabellen müssen Collections erstellt werden:
        *   `media_items`
        *   `custom_lists`
        *   `profiles` (Optional, Appwrite hat eigene User-Prefs, aber für Zusatzdaten sinnvoll)
    *   **Attribute definieren:** Für jede Spalte in Supabase (z.B. `tmdb_id`, `title`, `rating`) muss in Appwrite ein Attribut (String, Integer, Boolean) angelegt werden. Das ist Fleißarbeit.

## 3. Code-Migration

### A. Setup (`services/appwrite.ts`)
Ersetzen von `supabase.ts`.

```typescript
import { Client, Account, Databases } from 'appwrite';

const client = new Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1') // oder deine IP
    .setProject('DEINE_PROJECT_ID');

export const account = new Account(client);
export const databases = new Databases(client);
export const APPWRITE_DB_ID = '...';
```

### B. Authentifizierung (`contexts/AuthContext.tsx`)

| Supabase | Appwrite |
| :--- | :--- |
| `supabase.auth.signUp({ email, password })` | `account.create(ID.unique(), email, password, name)` |
| `supabase.auth.signInWithPassword(...)` | `account.createEmailSession(email, password)` |
| `supabase.auth.signOut()` | `account.deleteSession('current')` |
| `supabase.auth.getUser()` | `account.get()` |

### C. Datenbank-Logik (`services/db.ts`)

Dies ist der aufwendigste Teil. Jede Funktion muss umgeschrieben werden.

#### Beispiel: `fetchMediaItems`

**Supabase:**
```typescript
export const fetchMediaItems = async () => {
  const { data } = await supabase
    .from('media_items')
    .select('*')
    .order('added_at', { ascending: false });
  return data; // Automatisches Mapping
};
```

**Appwrite:**
```typescript
import { Query } from 'appwrite';

export const fetchMediaItems = async (userId: string) => {
  const response = await databases.listDocuments(
    DB_ID,
    COLLECTION_MEDIA_ITEMS,
    [
      Query.equal('user_id', userId),
      Query.orderDesc('added_at')
    ]
  );
  
  // Manuelles Mapping oft notwendig, da Appwrite Metadaten ($id, $createdAt) liefert
  return response.documents.map(doc => ({
    id: doc.$id,
    title: doc.title,
    // ... alle anderen Felder
  }));
};
```

#### Beispiel: `shareCustomList` (Komplexität durch Permissions)

In Supabase haben wir RLS Policies geschrieben. In Appwrite müssen wir die Berechtigungen direkt am Dokument ändern.

```typescript
import { Permission, Role } from 'appwrite';

export const shareCustomList = async (listId: string, ownerId: string, sharedUserIds: string[]) => {
  // Wir müssen die Permissions neu berechnen
  const permissions = [
    Permission.read(Role.user(ownerId)),
    Permission.update(Role.user(ownerId)),
    Permission.delete(Role.user(ownerId)),
    // Lese-Rechte für geteilte User hinzufügen
    ...sharedUserIds.map(uid => Permission.read(Role.user(uid)))
  ];

  await databases.updateDocument(
    DB_ID,
    COLLECTION_LISTS,
    listId,
    { sharedWith: sharedUserIds }, // Daten update
    permissions // Sicherheits-Update!
  );
};
```

## 4. Daten-Migration (Scripting)

Um die bestehenden Nutzerdaten zu retten:

1.  **Export:** Ein Node.js Skript schreiben, das alle Daten aus Supabase als JSON zieht (`supabase-js` Admin Client).
2.  **Transform:** Datenstruktur anpassen (z.B. `snake_case` zu `camelCase` falls gewünscht, oder Datentypen anpassen).
3.  **Import:** Das Skript iteriert über die JSON-Daten und pusht sie via Appwrite Server SDK in die neuen Collections.

## 5. Fazit & Aufwandsschätzung

*   **Setup & Schema:** ~4 Stunden (Manuelles Anlegen aller Felder in der Appwrite Console).
*   **Auth Refactoring:** ~2 Stunden.
*   **Database Refactoring:** ~8-12 Stunden (Umschreiben aller CRUD-Operationen in `db.ts`).
*   **Testing & Bugfixing:** ~4-6 Stunden.
*   **Gesamt:** Ca. **2-3 Arbeitstage**.

**Empfehlung:**
Nur durchführen, wenn Self-Hosting zwingend erforderlich ist oder die Supabase-Kosten langfristig untragbar sind. Der aktuelle Code-Fix für das Egress-Problem bei Supabase ist die deutlich wirtschaftlichere Lösung (Zeitaufwand: 0 Stunden, da bereits erledigt).
