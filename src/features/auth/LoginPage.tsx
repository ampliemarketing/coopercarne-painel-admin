import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../store/AuthContext';

const FEATURES = [
  'Gestão de Cooperados & Terceiros',
  'Agendamento de Abate',
  'Monitoramento da Câmara Fria',
];

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
    <div className="min-h-screen w-full flex font-sans bg-white">
      {/* Painel esquerdo - identidade de marca (a partir de lg) */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[600px] flex-shrink-0 relative flex-col justify-center px-14 py-16 overflow-hidden bg-gradient-to-br from-[#a81618] via-[#c51d1f] to-[#8f1214]">
        <div className="absolute -top-32 -right-28 w-96 h-96 rounded-full bg-white/[0.07]" />
        <div className="absolute -bottom-44 -left-32 w-[440px] h-[440px] rounded-full bg-black/[0.14]" />
        <div
          className="absolute inset-0 opacity-50"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />

        <div className="relative z-10">
          <h2 className="text-[33px] leading-[1.24] font-extrabold text-white tracking-tight mb-4">
            Gestão completa da sua cooperativa em um só lugar
          </h2>
          <p className="text-white/80 text-[14.5px] leading-relaxed font-medium max-w-[410px] mb-7">
            Acompanhe cooperados, agendamentos de abate e câmara fria com um painel feito para o dia a dia do frigorífico.
          </p>

          <div className="flex flex-col gap-3.5">
            {FEATURES.map((label) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-[30px] h-[30px] rounded-[9px] bg-white/[0.14] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[13.5px] font-semibold text-white">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute left-14 bottom-14 z-10 text-xs font-semibold text-white/60 tracking-wide">
          COOPERCARNE Frigorífico · Painel Administrativo
        </div>
      </div>

      {/* Painel direito - formulário */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:p-6">
        <div className="w-full max-w-[400px]">
          {/* Logo & Identidade */}
          <div className="flex flex-col items-center text-center mb-7">
            <img
              src="/COOPERCARNE---LOGO-COR.png"
              alt="COOPERCARNE"
              className="h-20 sm:h-[92px] w-auto object-contain mb-5 drop-shadow-sm"
            />
            <span className="inline-block text-[10.5px] font-extrabold tracking-widest uppercase text-[#c51d1f] bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
              Painel Administrativo
            </span>
            <h1 className="mt-4 mb-1.5 text-2xl font-extrabold text-slate-900 tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="text-[13px] text-slate-500 font-medium">
              Entre com suas credenciais de acesso ao sistema.
            </p>
          </div>

          {/* Alerta de Erro */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200/90 text-red-800 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  CNPJ ou E-mail de Acesso
                </label>
                {showCnpjSuggestion && (
                  <span className="text-[9.5px] font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 animate-pulse">
                    Autocompletando com @email.com
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-[17px] h-[17px] absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="00.000.000/0001-00 ou admin@coopercarne.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  disabled={submitting}
                  className="w-full h-[50px] bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:bg-white focus:outline-none focus:border-[#c51d1f] focus:ring-4 focus:ring-red-500/15 transition-all"
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
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-[17px] h-[17px] absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full h-[50px] bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:bg-white focus:outline-none focus:border-[#c51d1f] focus:ring-4 focus:ring-red-500/15 transition-all"
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

            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-[52px] bg-gradient-to-br from-[#c51d1f] to-[#a81618] hover:from-[#a81618] hover:to-[#8f1214] active:from-[#8f1214] active:to-[#8f1214] text-white font-extrabold rounded-2xl text-[12.5px] uppercase tracking-wider shadow-lg shadow-red-900/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
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

            <p className="text-center text-[11px] text-slate-400 font-semibold">
              Ambiente seguro · Conexão criptografada
            </p>
          </form>

          {/* Rodapé (visível apenas quando o painel de marca está oculto) */}
          <p className="text-center mt-6 text-xs text-slate-500 font-medium lg:hidden">
            COOPERCARNE Frigorífico • Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
