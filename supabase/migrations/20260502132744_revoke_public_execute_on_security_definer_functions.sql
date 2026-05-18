/*
  # Виправлення безпеки: обмеження доступу до SECURITY DEFINER функцій

  1. Зміни
    - Відкликано EXECUTE від ролі PUBLIC на обох функціях
      (PUBLIC дає доступ усім ролям, включаючи anon та authenticated)
    - refresh_app_site_stats: доступна тільки postgres та service_role
      (це адміністративна функція оновлення статистики)
    - register_app_visit: доступна anon та authenticated
      (потрібна для підрахунку відвідувань сайту)

  2. Безпека
    - Усуває вразливість "Public Can Execute SECURITY DEFINER Function"
    - Усуває вразливість "Signed-In Users Can Execute SECURITY DEFINER Function"
      для refresh_app_site_stats
*/

-- Відкликаємо EXECUTE від PUBLIC на обох функціях
-- (PUBLIC -- це спеціальна роль, яка автоматично включає всіх користувачів)
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_app_visit() FROM PUBLIC;

-- Для refresh_app_site_stats додатково забираємо у anon та authenticated
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM authenticated;

-- Для register_app_visit залишаємо доступ anon та authenticated
-- (вони потребують цю функцію для реєстрації відвідувань)
GRANT EXECUTE ON FUNCTION public.register_app_visit() TO anon;
GRANT EXECUTE ON FUNCTION public.register_app_visit() TO authenticated;
