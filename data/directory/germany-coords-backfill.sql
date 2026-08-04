UPDATE public.profiles
SET
  service_latitude = 49.8582,
  service_longitude = 8.6415
WHERE is_professional = true
  AND full_name = 'Stark Elektro'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 49.8582
       OR service_longitude IS DISTINCT FROM 8.6415);

UPDATE public.profiles
SET
  service_latitude = 49.8912,
  service_longitude = 8.6408
WHERE is_professional = true
  AND full_name = 'Heinrich Schmid GmbH & Co. KG — Darmstadt'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 49.8912
       OR service_longitude IS DISTINCT FROM 8.6408);

UPDATE public.profiles
SET
  service_latitude = 49.8405,
  service_longitude = 8.6421
WHERE is_professional = true
  AND full_name = 'Patrick Noël Malerhandwerk GmbH'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 49.8405
       OR service_longitude IS DISTINCT FROM 8.6421);

UPDATE public.profiles
SET
  service_latitude = 49.9055,
  service_longitude = 8.6682
WHERE is_professional = true
  AND full_name = 'Kraft GmbH Darmstadt'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 49.9055
       OR service_longitude IS DISTINCT FROM 8.6682);

UPDATE public.profiles
SET
  service_latitude = 49.8458,
  service_longitude = 8.6354
WHERE is_professional = true
  AND full_name = 'Zimmermann & Sohn GmbH'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 49.8458
       OR service_longitude IS DISTINCT FROM 8.6354);

UPDATE public.profiles
SET
  service_latitude = 49.8728,
  service_longitude = 8.6512
WHERE is_professional = true
  AND full_name = 'Domenico Di Santo Malerbetrieb'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 49.8728
       OR service_longitude IS DISTINCT FROM 8.6512);

UPDATE public.profiles
SET
  service_latitude = 49.8785,
  service_longitude = 8.6558
WHERE is_professional = true
  AND full_name = 'B&P Bau'
  AND location ILIKE '%Darmstadt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 49.8785
       OR service_longitude IS DISTINCT FROM 8.6558);

UPDATE public.profiles
SET
  service_latitude = 52.4578,
  service_longitude = 13.3225
WHERE is_professional = true
  AND full_name = 'Kretsch Gebäudetechnik GmbH'
  AND location ILIKE '%Berlin%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 52.4578
       OR service_longitude IS DISTINCT FROM 13.3225);

UPDATE public.profiles
SET
  service_latitude = 52.5438,
  service_longitude = 13.4123
WHERE is_professional = true
  AND full_name = 'Sanitär Strehlow'
  AND location ILIKE '%Berlin%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 52.5438
       OR service_longitude IS DISTINCT FROM 13.4123);

UPDATE public.profiles
SET
  service_latitude = 52.5125,
  service_longitude = 13.2648
WHERE is_professional = true
  AND full_name = 'Stefans Allrounder'
  AND location ILIKE '%Berlin%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 52.5125
       OR service_longitude IS DISTINCT FROM 13.2648);

UPDATE public.profiles
SET
  service_latitude = 53.5955,
  service_longitude = 9.9452
WHERE is_professional = true
  AND full_name = 'ElbHandWerk Sanitär und Heizung GmbH'
  AND location ILIKE '%Hamburg%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 53.5955
       OR service_longitude IS DISTINCT FROM 9.9452);

UPDATE public.profiles
SET
  service_latitude = 48.1235,
  service_longitude = 11.6638
WHERE is_professional = true
  AND full_name = 'Rucker Elektro GmbH'
  AND location ILIKE '%Munich%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 48.1235
       OR service_longitude IS DISTINCT FROM 11.6638);

UPDATE public.profiles
SET
  service_latitude = 48.1088,
  service_longitude = 11.5372
WHERE is_professional = true
  AND full_name = 'Auracher Elektroanlagen'
  AND location ILIKE '%Munich%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 48.1088
       OR service_longitude IS DISTINCT FROM 11.5372);

UPDATE public.profiles
SET
  service_latitude = 48.1412,
  service_longitude = 11.5085
WHERE is_professional = true
  AND full_name = 'Elektro-Meisterbetrieb Dollinger'
  AND location ILIKE '%Munich%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 48.1412
       OR service_longitude IS DISTINCT FROM 11.5085);

UPDATE public.profiles
SET
  service_latitude = 48.1228,
  service_longitude = 11.5554
WHERE is_professional = true
  AND full_name = 'bELEKTRO Meisterbetrieb GmbH'
  AND location ILIKE '%Munich%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 48.1228
       OR service_longitude IS DISTINCT FROM 11.5554);

UPDATE public.profiles
SET
  service_latitude = 48.1351,
  service_longitude = 11.582
WHERE is_professional = true
  AND full_name = 'AC-Elektro UG'
  AND location ILIKE '%Munich%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 48.1351
       OR service_longitude IS DISTINCT FROM 11.582);

UPDATE public.profiles
SET
  service_latitude = 50.0785,
  service_longitude = 8.5752
WHERE is_professional = true
  AND full_name = 'Sanitär + Heizung Peter Röhring'
  AND location ILIKE '%Frankfurt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 50.0785
       OR service_longitude IS DISTINCT FROM 8.5752);

UPDATE public.profiles
SET
  service_latitude = 50.1109,
  service_longitude = 8.6821
WHERE is_professional = true
  AND full_name = 'TSM-Elektro'
  AND location ILIKE '%Frankfurt%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 50.1109
       OR service_longitude IS DISTINCT FROM 8.6821);

UPDATE public.profiles
SET
  service_latitude = 50.9478,
  service_longitude = 6.9525
WHERE is_professional = true
  AND full_name = 'Ahl Malerwerkstätte GmbH'
  AND location ILIKE '%Cologne%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 50.9478
       OR service_longitude IS DISTINCT FROM 6.9525);

UPDATE public.profiles
SET
  service_latitude = 51.0215,
  service_longitude = 6.8912
WHERE is_professional = true
  AND full_name = 'Lüpschen Meisterbetrieb Sanitär + Heizung GmbH'
  AND location ILIKE '%Cologne%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 51.0215
       OR service_longitude IS DISTINCT FROM 6.8912);

UPDATE public.profiles
SET
  service_latitude = 50.8855,
  service_longitude = 7.0852
WHERE is_professional = true
  AND full_name = 'Sanitherm — Peter Schumacher'
  AND location ILIKE '%Cologne%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 50.8855
       OR service_longitude IS DISTINCT FROM 7.0852);

UPDATE public.profiles
SET
  service_latitude = 50.9585,
  service_longitude = 6.8425
WHERE is_professional = true
  AND full_name = 'Malerisch Meisterbetrieb Dirk Reifschneider GmbH'
  AND location ILIKE '%Cologne%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 50.9585
       OR service_longitude IS DISTINCT FROM 6.8425);

UPDATE public.profiles
SET
  service_latitude = 48.7758,
  service_longitude = 9.1829
WHERE is_professional = true
  AND full_name = 'Spiegel Elektrotechnik GmbH'
  AND location ILIKE '%Stuttgart%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 48.7758
       OR service_longitude IS DISTINCT FROM 9.1829);

UPDATE public.profiles
SET
  service_latitude = 51.2658,
  service_longitude = 6.7385
WHERE is_professional = true
  AND full_name = 'E-Technik Schulten GmbH'
  AND location ILIKE '%Düsseldorf%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 51.2658
       OR service_longitude IS DISTINCT FROM 6.7385);

UPDATE public.profiles
SET
  service_latitude = 51.2115,
  service_longitude = 6.7892
WHERE is_professional = true
  AND full_name = 'Angelidis Elektrotechnik GmbH'
  AND location ILIKE '%Düsseldorf%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 51.2115
       OR service_longitude IS DISTINCT FROM 6.7892);

UPDATE public.profiles
SET
  service_latitude = 51.3725,
  service_longitude = 12.3855
WHERE is_professional = true
  AND full_name = 'GHM Elektro- und Schaltanlagen GmbH'
  AND location ILIKE '%Leipzig%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 51.3725
       OR service_longitude IS DISTINCT FROM 12.3855);

UPDATE public.profiles
SET
  service_latitude = 51.0585,
  service_longitude = 13.6652
WHERE is_professional = true
  AND full_name = 'Malerbetrieb Weißbach GmbH'
  AND location ILIKE '%Dresden%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 51.0585
       OR service_longitude IS DISTINCT FROM 13.6652);

UPDATE public.profiles
SET
  service_latitude = 51.0058,
  service_longitude = 13.8025
WHERE is_professional = true
  AND full_name = 'Geßner Haustechnik Dresden'
  AND location ILIKE '%Dresden%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 51.0058
       OR service_longitude IS DISTINCT FROM 13.8025);

UPDATE public.profiles
SET
  service_latitude = 52.3575,
  service_longitude = 9.6958
WHERE is_professional = true
  AND full_name = 'Elektrotechnik Günther GmbH'
  AND location ILIKE '%Hannover%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 52.3575
       OR service_longitude IS DISTINCT FROM 9.6958);

UPDATE public.profiles
SET
  service_latitude = 49.4925,
  service_longitude = 10.9885
WHERE is_professional = true
  AND full_name = 'Malerfachbetrieb Feller & Piontek GbR'
  AND location ILIKE '%Nuremberg%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 49.4925
       OR service_longitude IS DISTINCT FROM 10.9885);

UPDATE public.profiles
SET
  service_latitude = 53.0955,
  service_longitude = 8.7685
WHERE is_professional = true
  AND full_name = 'Böttjer Elektrotechnik GmbH'
  AND location ILIKE '%Bremen%'
  AND (service_latitude IS NULL OR service_longitude IS NULL
       OR service_latitude IS DISTINCT FROM 53.0955
       OR service_longitude IS DISTINCT FROM 8.7685);
