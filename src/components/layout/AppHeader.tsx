import { useState } from 'react';
import { Settings, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../store/AuthContext';

export function AppHeader() {
  const { user, profile, role, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getInitials = () => {
    if (profile?.nome) {
      const parts = profile.nome.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return profile.nome.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return role === 'admin' ? 'AD' : 'OP';
  };

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    toast.info('Encerrando sessão...');
    await signOut();
    toast.success('Sessão finalizada com sucesso.');
  };

  return (
    <header className="bg-[#c51d1f] text-white h-14 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 shadow-md z-40">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="COOPERCARNE" className="h-8 sm:h-9 w-auto object-contain" />
        <div className="hidden sm:block h-5 w-px bg-white/25 my-auto" />
        <span className="text-[11px] sm:text-xs text-white/90 uppercase tracking-widest font-bold">
          Painel Administrativo
        </span>
      </div>

      {/* Perfil & Avatar com Menu Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="flex items-center gap-2 py-1 px-1.5 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
          title="Menu do Usuário"
        >
          <div className="w-9 h-9 rounded-full bg-white text-[#c51d1f] flex items-center justify-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-white/50 transition-all">
            {getInitials()}
          </div>
        </button>

        {/* Dropdown do Usuário */}
        {isProfileMenuOpen && (
          <div
            className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs text-slate-700 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com Dados do Usuário */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="font-bold text-slate-900 text-sm truncate">
                {profile?.nome || user?.email?.split('@')[0] || 'Administrador'}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                {user?.email}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 bg-red-50 text-[#c51d1f] border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  {role === 'admin' ? 'Administrador Geral' : 'Operador Câmara Fria'}
                </span>
              </div>
            </div>

            {/* Ações do Menu */}
            <div className="py-1">
              <button
                onClick={() => {
                  toast.info('Painel de perfil e preferências');
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-4 py-2 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors text-slate-700 font-medium"
              >
                <UserIcon className="w-4 h-4 text-slate-400" /> Meu Perfil
              </button>

              <button
                onClick={() => {
                  toast.info('Configurações do Sistema');
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-4 py-2 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors text-slate-700 font-medium"
              >
                <Settings className="w-4 h-4 text-slate-400" /> Configurações Gerais
              </button>
            </div>

            <div className="border-t border-slate-100 my-1"></div>

            {/* Botão Sair */}
            <div className="px-2 pt-1">
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-red-50 text-red-600 rounded-lg transition-colors font-semibold"
              >
                <LogOut className="w-4 h-4 text-red-500" /> Sair do Sistema
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
