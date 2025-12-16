BEGIN;

-- ==========================================
-- 1. TABELLE: profiles
-- ==========================================

-- Alte Policies aufräumen
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Neue Policies
-- Info: id in profiles ist uuid, auth.uid() ist uuid. Hier kein Cast nötig.
CREATE POLICY "Users can insert their own profile."
ON public.profiles
FOR INSERT
WITH CHECK ( (select auth.uid()) = id );

CREATE POLICY "Users can update own profile."
ON public.profiles
FOR UPDATE
USING ( (select auth.uid()) = id );


-- ==========================================
-- 2. TABELLE: custom_lists
-- ==========================================

-- Alte Policies aufräumen
DROP POLICY IF EXISTS "Users can see own lists." ON public.custom_lists;
DROP POLICY IF EXISTS "Allow shared lists" ON public.custom_lists;
DROP POLICY IF EXISTS "Users can insert own lists." ON public.custom_lists;
DROP POLICY IF EXISTS "Users can update own lists." ON public.custom_lists;
DROP POLICY IF EXISTS "Users can delete own lists." ON public.custom_lists;
-- Falls das fehlerhafte Skript teilweise lief, auch die neue löschen:
DROP POLICY IF EXISTS "Users can see own or shared lists" ON public.custom_lists;
DROP POLICY IF EXISTS "Users can insert own lists" ON public.custom_lists;
DROP POLICY IF EXISTS "Users can update own lists" ON public.custom_lists;
DROP POLICY IF EXISTS "Users can delete own lists" ON public.custom_lists;

-- Neue SELECT Policy
-- FIX: (select auth.uid())::text castet die UUID zu Text für den Array-Vergleich
CREATE POLICY "Users can see own or shared lists"
ON public.custom_lists
FOR SELECT
USING (
  owner_id = (select auth.uid())
  OR
  (select auth.uid())::text = ANY(shared_with)
);

-- Schreib-Policies
CREATE POLICY "Users can insert own lists"
ON public.custom_lists
FOR INSERT
WITH CHECK ( owner_id = (select auth.uid()) );

CREATE POLICY "Users can update own lists"
ON public.custom_lists
FOR UPDATE
USING ( owner_id = (select auth.uid()) );

CREATE POLICY "Users can delete own lists"
ON public.custom_lists
FOR DELETE
USING ( owner_id = (select auth.uid()) );


-- ==========================================
-- 3. TABELLE: media_items
-- ==========================================

-- Alte Policies aufräumen
DROP POLICY IF EXISTS "Users can see own items." ON public.media_items;
DROP POLICY IF EXISTS "Allow viewing shared list items" ON public.media_items;
DROP POLICY IF EXISTS "Users can insert own items." ON public.media_items;
DROP POLICY IF EXISTS "Users can update own items." ON public.media_items;
DROP POLICY IF EXISTS "Users can delete own items." ON public.media_items;
-- Falls das fehlerhafte Skript teilweise lief:
DROP POLICY IF EXISTS "Users can see own or shared items" ON public.media_items;
DROP POLICY IF EXISTS "Users can insert own items" ON public.media_items;
DROP POLICY IF EXISTS "Users can update own items" ON public.media_items;
DROP POLICY IF EXISTS "Users can delete own items" ON public.media_items;

-- Neue SELECT Policy
CREATE POLICY "Users can see own or shared items"
ON public.media_items
FOR SELECT
USING (
  user_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.custom_lists cl
    WHERE (select auth.uid())::text = ANY(cl.shared_with) -- FIX: Cast zu Text
    AND public.media_items.id::text = ANY(cl.items)       -- FIX: Cast zu Text
  )
);

-- Schreib-Policies
CREATE POLICY "Users can insert own items"
ON public.media_items
FOR INSERT
WITH CHECK ( user_id = (select auth.uid()) );

CREATE POLICY "Users can update own items"
ON public.media_items
FOR UPDATE
USING ( user_id = (select auth.uid()) );

CREATE POLICY "Users can delete own items"
ON public.media_items
FOR DELETE
USING ( user_id = (select auth.uid()) );

COMMIT;