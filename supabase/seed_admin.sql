-- ==============================================================================
-- COOPERCARNE - CRIAÇÃO DO USUÁRIO ADMINISTRADOR MASTER
-- Execute DEPOIS de rodar migrations/20260825000000_init_schema.sql no novo projeto.
-- IMPORTANTE: troque a senha abaixo antes de rodar, e troque novamente após o
-- primeiro login em produção.
-- ==============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_email   text := 'admin@coopercarne.com.br';
  v_senha   text := 'Coopercarne123@'; -- TROQUE ANTES DE RODAR EM PRODUÇÃO
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change, email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token,
      is_super_admin, is_sso_user, is_anonymous
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      v_email, crypt(v_senha, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nome', 'Administrador Coopercarne', 'perfil', 'admin'),
      now(), now(), '', '', '', '', '', '', '', '',
      false, false, false
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
      'email', v_user_id::text, now(), now(), now()
    ) ON CONFLICT (provider, provider_id) DO NOTHING;
  END IF;

  INSERT INTO public.profiles (id, nome, email, perfil, ativo, verificado, created_at, updated_at)
  VALUES (v_user_id, 'Administrador Coopercarne', v_email, 'admin', true, true, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    perfil = 'admin', ativo = true, verificado = true, updated_at = now();
END $$;

NOTIFY pgrst, 'reload schema';
