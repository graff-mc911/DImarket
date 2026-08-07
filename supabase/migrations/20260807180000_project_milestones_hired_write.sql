-- Allow hired professional (and accepted application) to update milestones.
-- Client (author) already had full write access.

DROP POLICY IF EXISTS project_milestones_write ON public.project_milestones;
CREATE POLICY project_milestones_write ON public.project_milestones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (
          l.author_id = auth.uid()
          OR l.hired_professional_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.project_applications pa
            WHERE pa.listing_id = l.id
              AND pa.professional_id = auth.uid()
              AND pa.status = 'accepted'
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (
          l.author_id = auth.uid()
          OR l.hired_professional_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.project_applications pa
            WHERE pa.listing_id = l.id
              AND pa.professional_id = auth.uid()
              AND pa.status = 'accepted'
          )
        )
    )
  );
