-- Reclassify business-named directory rows and fill published phones.
-- Only public, already-published contacts are filled — no invented phones/emails/locations.

update public.profiles
set user_role = 'company',
    updated_at = now()
where id in (
  'cfea3db8-b754-4e12-81c6-bf04bf9d93c2', -- Reformas Esquivel
  'bba9fff4-e1a5-4c3b-9f75-42541066b1b6', -- Lamin Reformas y Fontanería
  '4e6fd39b-5486-4844-9c3e-013d73b0d180'  -- Malerisch Meisterbetrieb Dirk Reifschneider GmbH
)
and user_role = 'professional';

-- Published tel: / WhatsApp / HQ switchboard numbers from the business's own site.
update public.profiles as p
set phone = v.phone,
    updated_at = now()
from (values
  ('f52fde86-97ff-41b7-a448-42548d2d0d70'::uuid, '+49 6151 5011204'), -- Domenico Di Santo (disanto-domenico.de)
  ('41e720df-5d2d-4fb7-b77a-78d87b4eeab2'::uuid, '+49 172 6399986'),  -- B&P Bau (b-pbau.de)
  ('a63a36f1-596b-4141-b11b-c16b15973387'::uuid, '+34 624 281 936'),  -- Econova Global Service
  ('4e41f10c-0da7-41eb-bed0-d774f82c1c05'::uuid, '+34 981 680 465'),  -- Asesórate Pymes
  ('137da278-5e58-4211-92fb-563ead6dff26'::uuid, '+48 788 931 535'),  -- Hydraf Poznań
  ('243e575a-d249-45f1-b963-0f1f34f3ca95'::uuid, '+34 914 350 398'),  -- Ortiz.Leon Arquitectos
  ('b536b377-9a4b-467c-a938-6864c4a95ada'::uuid, '+49 7024 8040'),    -- Festool Wendlingen
  ('6da5d5cf-2ec1-4fea-a662-44d392f6b376'::uuid, '+41 58 436 6800'),  -- Sika Baar
  ('0ab4834e-af4e-4d96-af8d-8224ffdcd6f2'::uuid, '+49 9252 3590'),    -- REHAU Rehau
  ('2e6bd237-2e65-4f52-a263-15dd4ddc647d'::uuid, '+49 521 7830'),     -- Schüco Bielefeld
  ('e900576c-3900-49b3-936d-27a89f9a6c9d'::uuid, '+32 59 55 81 11'),  -- Daikin Europe Ostend
  ('aaef99a3-bf69-4b7f-a2f2-4071fb32de35'::uuid, '+43 1 60192 0'),    -- Wienerberger Wien HQ
  ('e29b9047-53ca-4e0c-bcb2-aa28857b9d55'::uuid, '+48 33 819 53 00'), -- Aluprof Bielsko-Biała HQ
  ('26808605-c04e-4f75-a683-e8187ba006be'::uuid, '+45 46 56 03 00')   -- ROCKWOOL Hedehusene
) as v(id, phone)
where p.id = v.id
  and (p.phone is null or btrim(p.phone) = '');
