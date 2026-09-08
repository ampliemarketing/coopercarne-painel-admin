SELECT
  user_id,
  provider_id,
  provider,
  identity_data,
  email,
  id
FROM auth.identities
WHERE email IN ('admin@coopercarne.com.br', '03044201003285@email.com');
