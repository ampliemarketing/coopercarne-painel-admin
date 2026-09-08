UPDATE auth.users
SET
  encrypted_password = crypt('Coopercarne123@', gen_salt('bf', 10)),
  raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
    'email', email,
    'email_verified', true,
    'phone_verified', false,
    'sub', id::text
  )
WHERE email LIKE '%@email.com';
