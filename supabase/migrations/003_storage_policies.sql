INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can read menu images" ON storage.objects;
CREATE POLICY "Public can read menu images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated can upload menu images" ON storage.objects;
CREATE POLICY "Authenticated can upload menu images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated can update menu images" ON storage.objects;
CREATE POLICY "Authenticated can update menu images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-images')
WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated can delete menu images" ON storage.objects;
CREATE POLICY "Authenticated can delete menu images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images');
