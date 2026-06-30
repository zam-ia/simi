ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read clients" ON clients;
CREATE POLICY "Public can read clients"
ON clients
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated can insert clients" ON clients;
CREATE POLICY "Authenticated can insert clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update clients" ON clients;
CREATE POLICY "Authenticated can update clients"
ON clients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete clients" ON clients;
CREATE POLICY "Authenticated can delete clients"
ON clients
FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Public can read menu categories" ON menu_categories;
CREATE POLICY "Public can read menu categories"
ON menu_categories
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated can insert menu categories" ON menu_categories;
CREATE POLICY "Authenticated can insert menu categories"
ON menu_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update menu categories" ON menu_categories;
CREATE POLICY "Authenticated can update menu categories"
ON menu_categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete menu categories" ON menu_categories;
CREATE POLICY "Authenticated can delete menu categories"
ON menu_categories
FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Public can read menu items" ON menu_items;
CREATE POLICY "Public can read menu items"
ON menu_items
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated can insert menu items" ON menu_items;
CREATE POLICY "Authenticated can insert menu items"
ON menu_items
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update menu items" ON menu_items;
CREATE POLICY "Authenticated can update menu items"
ON menu_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete menu items" ON menu_items;
CREATE POLICY "Authenticated can delete menu items"
ON menu_items
FOR DELETE
TO authenticated
USING (true);
