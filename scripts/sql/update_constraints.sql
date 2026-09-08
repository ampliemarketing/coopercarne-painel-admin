ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_perfil_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_perfil_check CHECK (perfil = ANY (ARRAY['cooperado'::text, 'comprador'::text, 'gerente'::text, 'admin'::text, 'terceiro'::text, 'nao_cooperado'::text, 'operador_camara'::text]));

ALTER TABLE public.estabelecimentos DROP CONSTRAINT IF EXISTS estabelecimentos_tipo_estabelecimento_check;
ALTER TABLE public.estabelecimentos ADD CONSTRAINT estabelecimentos_tipo_estabelecimento_check CHECK (tipo_estabelecimento = ANY (ARRAY['supermercado'::text, 'atacado'::text, 'acougue'::text, 'restaurante'::text, 'frigorifico'::text, 'produtor'::text, 'outro'::text]));
