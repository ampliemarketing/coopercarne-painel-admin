UPDATE auth.users
SET
  encrypted_password = crypt('Coopercarne123@', gen_salt('bf', 10)),
  confirmation_token = '',
  recovery_token = '',
  email_change = '',
  email_change_token_new = '',
  email_change_token_current = '',
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'admin@coopercarne.com.br';
