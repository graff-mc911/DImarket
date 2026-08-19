-- Reclassify business-named directory rows that were imported as "professional"
-- (they appear in «Топ майстри» instead of «Топ компанії»).
-- Only public, already-published contacts are filled — no invented phones/emails.

update public.profiles
set user_role = 'company',
    updated_at = now()
where id in (
  'cfea3db8-b754-4e12-81c6-bf04bf9d93c2', -- Reformas Esquivel
  'bba9fff4-e1a5-4c3b-9f75-42541066b1b6', -- Lamin Reformas y Fontanería
  '4e6fd39b-5486-4844-9c3e-013d73b0d180'  -- Malerisch Meisterbetrieb Dirk Reifschneider GmbH
)
and user_role = 'professional';

-- Painter's own site: tel:+4961515011204
update public.profiles
set phone = '+49 6151 5011204',
    updated_at = now()
where id = 'f52fde86-97ff-41b7-a448-42548d2d0d70'
  and (phone is null or btrim(phone) = '');
