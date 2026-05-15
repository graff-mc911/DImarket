/*
  # Переключення register_app_visit на SECURITY INVOKER

  1. Зміни
    - Функція register_app_visit тепер SECURITY INVOKER замість SECURITY DEFINER
    - Це означає, що вона виконується з правами того, хто її викликає,
      а не з правами власника (postgres)
    - Додано RLS-політику UPDATE на таблицю app_site_stats для anon та authenticated,
      щоб вони могли інкрементувати лічильник відвідувань

  2. Безпека
    - Усуває вразливість "Public Can Execute SECURITY DEFINER Function"
    - Усуває вразливість "Signed-In Users Can Execute SECURITY DEFINER Function"
    - Доступ до UPDATE обмежений через RLS тільки рядком id = 1
*/

-- Перестворюємо функцію як SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.register_app_visit()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.app_site_stats
  SET total_visits = total_visits + 1
  WHERE id = 1;
END;
$$;

-- Додаємо RLS-політику, що дозволяє anon та authenticated оновлювати лічильник
CREATE POLICY "Anon and authenticated can increment visit counter"
  ON public.app_site_stats
  FOR UPDATE
  TO anon, authenticated
  USING (id = 1)
  WITH CHECK (id = 1);
