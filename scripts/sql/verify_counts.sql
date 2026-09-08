SELECT 'auth.users (cooperados)' as tabela, count(*)::int as total FROM auth.users WHERE email LIKE '%@email.com'
UNION ALL
SELECT 'auth.users (admin)' as tabela, count(*)::int as total FROM auth.users WHERE email = 'admin@coopercarne.com.br'
UNION ALL
SELECT 'public.profiles (cooperados)' as tabela, count(*)::int as total FROM public.profiles WHERE perfil = 'cooperado'
UNION ALL
SELECT 'public.estabelecimentos' as tabela, count(*)::int as total FROM public.estabelecimentos
UNION ALL
SELECT 'public.user_private_data' as tabela, count(*)::int as total FROM public.user_private_data
UNION ALL
SELECT 'public.limites_abate' as tabela, count(*)::int as total FROM public.limites_abate;
