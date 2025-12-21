 1 -- Erstellt die Tabelle für Admin-Benachrichtigungen
    2 CREATE TABLE admin_notifications (
    3   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    4   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    5   type TEXT NOT NULL, -- 'login' oder 'register'
    6   message TEXT NOT NULL,
    7   is_read BOOLEAN NOT NULL DEFAULT false,
    8   user_id UUID -- Kann NULL sein, wenn es eine Systemnachricht ist oder der Benutzer noch nicht
      'profiles' ist
    9 );
   10
   11 -- Aktiviert Row Level Security (RLS)
   12 ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
   13
   14 -- Richtlinie: Admins können alle Benachrichtigungen lesen
   15 CREATE POLICY "Allow admin to read all notifications"
   16 ON admin_notifications FOR SELECT USING (
   17   (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
   18 );
   19
   20 -- Richtlinie: Admins können Benachrichtigungen aktualisieren (z.B. als gelesen markieren)
   21 CREATE POLICY "Allow admin to update notifications"
   22 ON admin_notifications FOR UPDATE USING (
   23   (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
   24 );
   25
   26 -- Richtlinie: Authentifizierte Benutzer (d.h. die App selbst) können Benachrichtigungen
      hinzufügen.
   27 -- Diese Policy ist nötig, damit `addAdminNotification` funktioniert, wenn es clientseitig
      aufgerufen wird.
   28 -- Idealerweise würde dies über eine Supabase Function mit Service Role Key geschehen,
   29 -- aber für dieses Projekt reicht es so.
   30 CREATE POLICY "Allow authenticated users to insert notifications"
   31 ON admin_notifications FOR INSERT WITH CHECK (true);
   
   
   
    SELECT
      id,
      title,
      imdb_id,
      rt_score
    FROM
      public.media_items
    WHERE
      imdb_id IS NULL OR rt_score IS NULL;