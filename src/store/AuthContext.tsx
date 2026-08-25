import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseReady, type Profile } from '../lib/supabase';
import type { AdminRole } from '../types';

export type UserRole = 'admin' | 'operador_camara' | 'cooperado' | 'terceiro' | 'visitante';

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  profile: Profile | null;
  role: AdminRole;
  userRole: UserRole;
  isAdmin: boolean;
  isOperadorCamara: boolean;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Determina a role de administrador/operador com fallback
  const userRole: UserRole = (profile?.perfil as UserRole) || (user?.user_metadata?.perfil as UserRole) || 'admin';
  const role: AdminRole = userRole === 'operador_camara' ? 'operador_camara' : 'admin';
  const isAdmin = role === 'admin';
  const isOperadorCamara = role === 'operador_camara' || isAdmin;

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] Erro ao buscar perfil:', error.message);
        return null;
      }

      if (data) {
        setProfile(data);
        return data;
      }
      return null;
    } catch (err) {
      console.error('[AuthContext] Falha ao consultar perfil:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        if (!isSupabaseReady()) {
          setLoading(false);
          return;
        }

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthContext] Erro ao carregar sessão:', error.message);
        }

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id);
          }
        }
      } catch (e) {
        console.error('[AuthContext] Erro na inicialização:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    // Escuta mudanças no estado de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (currentSession?.user) {
            await fetchProfile(currentSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      setSession(data.session);
      setUser(data.user);

      if (data.user) {
        const fetchedProf = await fetchProfile(data.user.id);
        if (fetchedProf && fetchedProf.ativo === false) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return {
            error: {
              name: 'AuthError',
              message: 'Sua conta está desativada. Entre em contato com a administração.',
              status: 403,
            } as AuthError,
          };
        }
      }

      setLoading(false);
      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return {
        error: {
          name: 'AuthError',
          message: err?.message || 'Erro inesperado durante a autenticação.',
        } as AuthError,
      };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[AuthContext] Erro ao deslogar:', e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        userRole,
        isAdmin,
        isOperadorCamara,
        loading,
        signInWithPassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
