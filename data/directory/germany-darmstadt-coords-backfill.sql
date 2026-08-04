UPDATE public.profiles
SET service_latitude = 49.8582,
    service_longitude = 8.6415
WHERE is_professional = true
  AND full_name = 'Stark Elektro'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL);

UPDATE public.profiles
SET service_latitude = 49.8912,
    service_longitude = 8.6408
WHERE is_professional = true
  AND full_name = 'Heinrich Schmid GmbH & Co. KG — Darmstadt'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL);

UPDATE public.profiles
SET service_latitude = 49.8405,
    service_longitude = 8.6421
WHERE is_professional = true
  AND full_name = 'Patrick Noël Malerhandwerk GmbH'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL);

UPDATE public.profiles
SET service_latitude = 49.9055,
    service_longitude = 8.6682
WHERE is_professional = true
  AND full_name = 'Kraft GmbH Darmstadt'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL);

UPDATE public.profiles
SET service_latitude = 49.8458,
    service_longitude = 8.6354
WHERE is_professional = true
  AND full_name = 'Zimmermann & Sohn GmbH'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL);

UPDATE public.profiles
SET service_latitude = 49.8728,
    service_longitude = 8.6512
WHERE is_professional = true
  AND full_name = 'Domenico Di Santo Malerbetrieb'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL);

UPDATE public.profiles
SET service_latitude = 49.8785,
    service_longitude = 8.6558
WHERE is_professional = true
  AND full_name = 'B&P Bau'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL);
