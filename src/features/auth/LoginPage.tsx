import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../store/AuthContext';

export function LoginPage() {
  const { signInWithPassword, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Destino após login bem-sucedido
  const from = (location.state as any)?.from?.pathname || '/';

  // Se já estiver logado, redireciona para a home
  if (user && !authLoading) {
    return <Navigate to={from} replace />;
  }

  const handleEmailBlur = () => {
    const rawInput = email.trim();
    const digitsOnly = rawInput.replace(/\D/g, '');

    // Se digitou CNPJ (ou CPF) sem @, autocompleta automaticamente para [cnpj]@email.com
    if (!rawInput.includes('@') && digitsOnly.length >= 11) {
      setEmail(`${digitsOnly}@email.com`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawInput = email.trim();
    if (!rawInput || !password) {
      toast.error('Informe seu CNPJ ou e-mail de acesso e a senha.');
      return;
    }

    // Normaliza CNPJ para o formato de login do sistema ([cnpj]@email.com)
    let emailToAuth = rawInput;
    const digitsOnly = rawInput.replace(/\D/g, '');

    if (rawInput.includes('@')) {
      emailToAuth = rawInput.toLowerCase();
    } else if (digitsOnly.length >= 11) {
      emailToAuth = `${digitsOnly}@email.com`;
      setEmail(emailToAuth); // Atualiza o campo na interface também
    }

    setSubmitting(true);

    try {
      const { error } = await signInWithPassword(emailToAuth, password);

      if (error) {
        let msg = 'CNPJ/E-mail ou senha incorretos.';
        if (error.message.includes('Invalid login credentials')) {
          msg = 'Credenciais inválidas. Verifique o CNPJ/E-mail e a senha informada.';
        } else if (error.message.includes('Email not confirmed')) {
          msg = 'Seu e-mail ainda não foi confirmado.';
        } else if (error.message.includes('desativada')) {
          msg = error.message;
        } else {
          msg = error.message || msg;
        }

        setErrorMessage(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }

      toast.success('Login realizado com sucesso! Bem-vindo ao Painel COOPERCARNE.');
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.message || 'Falha ao autenticar. Tente novamente.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Sugestão de autocomplete em tempo real
  const digitsInEmail = email.trim().replace(/\D/g, '');
  const showCnpjSuggestion = !email.includes('@') && digitsInEmail.length >= 11;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[420px] relative z-10 my-auto">
        {/* Card Principal */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-7 sm:p-9">
          {/* Logo & Identidade */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-5 flex items-center justify-center">
              <img
                src="/COOPERCARNE---LOGO-COR.png"
                alt="COOPERCARNE"
                className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-[#c51d1f]">
              Painel Administrativo
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Entre com suas credenciais de acesso
            </p>
          </div>

          {/* Alerta de Erro */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/90 text-red-800 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  CNPJ ou E-mail de Acesso
                </label>
                {showCnpjSuggestion && (
                  <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 animate-pulse">
                    Autocompletando com @email.com
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="00.000.000/0001-00 ou admin@coopercarne.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  disabled={submitting}
                  className="w-full h-12 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:bg-white focus:outline-none focus:border-[#c51d1f] focus:ring-4 focus:ring-red-500/15 transition-all"
                />
              </div>
              {showCnpjSuggestion && (
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-mono">
                  <span className="text-slate-400">↳ Será autenticado como:</span>
                  <strong className="text-slate-800">{digitsInEmail}@email.com</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full h-12 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:bg-white focus:outline-none focus:border-[#c51d1f] focus:ring-4 focus:ring-red-500/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-[#c51d1f] hover:bg-[#a81618] active:bg-[#8f1214] text-white font-bold rounded-xl text-sm uppercase tracking-wider shadow-md shadow-red-900/20 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Entrar no Painel</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Rodapé da Página */}
        <p className="text-center mt-6 text-xs text-slate-500 font-medium">
          COOPERCARNE Frigorífico • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
