-- Quote builder: equipment line items

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'equipment'
  ) THEN
    ALTER TABLE quotes ADD COLUMN equipment jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Storage for generated quote PDFs (HTML printable docs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quote-pdfs',
  'quote-pdfs',
  true,
  10485760,
  ARRAY['text/html', 'application/pdf', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "quote_pdfs_read" ON storage.objects;
CREATE POLICY "quote_pdfs_read" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'quote-pdfs');

DROP POLICY IF EXISTS "quote_pdfs_upload" ON storage.objects;
CREATE POLICY "quote_pdfs_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'quote-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "quote_pdfs_update" ON storage.objects;
CREATE POLICY "quote_pdfs_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'quote-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
