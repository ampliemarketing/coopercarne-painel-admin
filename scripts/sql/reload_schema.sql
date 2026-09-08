NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

GRANT ALL ON SCHEMA auth TO supabase_auth_admin, postgres, dashboard_user;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin, postgres, dashboard_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin, postgres, dashboard_user;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin, postgres, dashboard_user;
