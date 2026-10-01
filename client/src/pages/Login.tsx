import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Leaf, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { trpc } from '@/lib/trpc';

const AMAZON_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663744625581/CVtXgzSxcBQ2arrxztUU7x/amazon-background-7xB5drQftciox5aHU4LKbP.webp';

interface LoginProps {
  onLogin: (email: string) => void;
  onVoltarSite?: () => void;
}

type Step = 'login' | 'forgot-password' | 'reset-code' | 'new-password' | 'success';

export function Login({ onLogin, onVoltarSite }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<Step>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.loginManual.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      onLogin(email);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'E-mail ou senha inválidos.');
    },
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    loginMutation.mutate({ email, senha: password });
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('reset-code');
  };

  const handleResetCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode.length === 6) {
      setStep('new-password');
    } else {
      alert('Digite um código válido de 6 dígitos');
    }
  };

  const handleNewPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword === confirmPassword && newPassword.length >= 8) {
      setStep('success');
      setTimeout(() => {
        setStep('login');
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2500);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url('${AMAZON_BG}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/55" />

      <div className="w-full max-w-md relative z-10">
        {/* Link voltar ao site */}
        {onVoltarSite && (
          <button
            type="button"
            onClick={onVoltarSite}
            className="flex items-center gap-1.5 mb-4 text-sm text-white/80 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Voltar ao site
          </button>
        )}
        <div className="bg-white/97 backdrop-blur-sm rounded-2xl shadow-2xl p-8" style={{ border: '1px solid oklch(0.88 0.02 90)' }}>

          {/* Logo e título */}
          <div className="flex flex-col items-center mb-8">
            <img
              src="/manus-storage/logo_mifature_78bd4714.png"
              alt="MIFATURE"
              className="h-28 w-auto object-contain mb-2"
            />
            <div
              className="w-full h-px mt-2 mb-3"
              style={{ background: 'linear-gradient(to right, transparent, oklch(0.70 0.09 75 / 0.4), transparent)' }}
            />
            <p
              className="text-xs text-center tracking-widest uppercase"
              style={{ color: 'oklch(0.55 0.05 75)', letterSpacing: '0.1em' }}
            >
              Acesse sua conta
            </p>
          </div>

          {/* ── TELA PRINCIPAL DE LOGIN ── */}
          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 border-gray-200 focus:border-green-600 focus:ring-green-500"
                    required
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
                    Senha
                  </Label>
                  <button
                    type="button"
                    onClick={() => { setStep('forgot-password'); setResetEmail(email); setErrorMsg(''); }}
                    className="text-xs text-green-700 hover:text-green-800 hover:underline font-medium transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 border-gray-200 focus:border-green-600 focus:ring-green-500"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                className={`w-full text-white font-semibold shadow-lg h-11 text-base transition-all duration-200 active:scale-[0.97] relative overflow-hidden ${
                  loginMutation.isPending
                    ? 'cursor-not-allowed opacity-90'
                    : ''
                }`}
                style={{
                  background: loginMutation.isPending
                    ? 'oklch(0.38 0.07 130)'
                    : 'oklch(0.34 0.07 130)',
                }}
                onMouseEnter={e => {
                  if (!loginMutation.isPending)
                    (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.28 0.06 130)';
                }}
                onMouseLeave={e => {
                  if (!loginMutation.isPending)
                    (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.34 0.07 130)';
                }}
                disabled={loginMutation.isPending}
              >
                {/* Barra de progresso animada no fundo do botão */}
                {loginMutation.isPending && (
                  <span
                    className="absolute inset-0 bg-white/10"
                    style={{
                      animation: 'shimmer 1.2s ease-in-out infinite',
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                    }}
                  />
                )}
                <span
                  className="relative flex items-center justify-center gap-2"
                  style={{ transition: 'opacity 150ms ease' }}
                >
                  {loginMutation.isPending ? (
                    <>
                      {/* Spinner de três pontos pulsantes */}
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      <span className="text-sm">Validando credenciais...</span>
                    </>
                  ) : (
                    'Entrar'
                  )}
                </span>
              </Button>
            </form>
          )}

          {/* ── RECUPERAÇÃO DE SENHA ── */}
          {step === 'forgot-password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Mail className="w-7 h-7 text-green-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Recuperar Senha</h2>
                <p className="text-sm text-gray-500">Informe seu e-mail para receber o código de redefinição</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-gray-700 font-semibold text-sm">E-mail</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="border-gray-200 focus:border-green-600 focus:ring-green-500"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 text-white font-semibold shadow-lg h-11">
                Enviar Código
              </Button>
              <Button type="button" variant="ghost" className="w-full text-green-700 hover:text-green-800 hover:bg-green-50" onClick={() => setStep('login')}>
                Voltar ao Login
              </Button>
            </form>
          )}

          {/* ── CÓDIGO DE VERIFICAÇÃO ── */}
          {step === 'reset-code' && (
            <form onSubmit={handleResetCodeSubmit} className="space-y-4">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-lime-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Lock className="w-7 h-7 text-green-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Verificar Código</h2>
                <p className="text-sm text-gray-500">Código enviado para <span className="font-semibold text-gray-700">{resetEmail}</span></p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-code" className="text-gray-700 font-semibold text-sm">Código de 6 dígitos</Label>
                <Input
                  id="reset-code"
                  type="text"
                  placeholder="000000"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono border-gray-200 focus:border-green-600 focus:ring-green-500"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 text-white font-semibold shadow-lg h-11">
                Verificar
              </Button>
              <Button type="button" variant="ghost" className="w-full text-sm text-green-700 hover:text-green-800 hover:bg-green-50" onClick={() => alert('Código reenviado para ' + resetEmail)}>
                Não recebeu? Reenviar código
              </Button>
              <Button type="button" variant="ghost" className="w-full text-green-700 hover:text-green-800 hover:bg-green-50" onClick={() => { setStep('forgot-password'); setResetCode(''); }}>
                Voltar
              </Button>
            </form>
          )}

          {/* ── NOVA SENHA ── */}
          {step === 'new-password' && (
            <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-lime-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Lock className="w-7 h-7 text-lime-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Nova Senha</h2>
                <p className="text-sm text-gray-500">Crie uma senha segura para sua conta</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-gray-700 font-semibold text-sm">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border-gray-200 focus:border-green-600 focus:ring-green-500"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400">Mínimo 8 caracteres</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-gray-700 font-semibold text-sm">Confirmar Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-gray-200 focus:border-green-600 focus:ring-green-500"
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">As senhas não coincidem</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 text-white font-semibold shadow-lg h-11"
                disabled={newPassword !== confirmPassword || newPassword.length < 8}
              >
                Redefinir Senha
              </Button>
            </form>
          )}

          {/* ── SUCESSO ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center shadow-md">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Senha redefinida!</h2>
              <p className="text-sm text-gray-500 text-center">Sua senha foi atualizada com sucesso. Redirecionando para o login...</p>
            </div>
          )}

          {/* Rodapé */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} MIFATURE · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
