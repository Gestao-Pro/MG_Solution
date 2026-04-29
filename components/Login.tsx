import React, { useState, useEffect, useRef } from 'react';
import { loginWithEmail, loginWithGoogle, registerWithEmail } from '@/services/authService';
import { useToast } from '@/components/ToastProvider';

interface LoginProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const { addToast } = useToast();

  const [googleInit, setGoogleInit] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [googleErrorCode, setGoogleErrorCode] = useState<'none' | 'missing_env' | 'script' | 'initialize' | 'render' | 'timeout'>('none');
  const initializedRef = useRef(false);
  const renderAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const envClientId = (import.meta as any)?.env?.VITE_GOOGLE_CLIENT_ID;
    const metaClientId = typeof document !== 'undefined'
      ? document.querySelector('meta[name="google-client-id"]')?.getAttribute('content')
      : undefined;
    const clientId = (envClientId ?? metaClientId)?.toString()?.trim();
    try { console.debug('VITE_GOOGLE_CLIENT_ID:', clientId ? '[set]' : '[missing]'); } catch {}
    if (!clientId) {
      setGoogleInit('error');
      setGoogleErrorCode('missing_env');
      return;
    }
    let tries = 0;
    const maxTries = 40;
    const interval = setInterval(() => {
      tries += 1;
      const google = (window as any)?.google;
      const api = google?.accounts?.id;
      if (api && !initializedRef.current) {
        try {
          setGoogleInit('loading');
          api.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              try {
                const idToken = response?.credential;
                if (!idToken) throw new Error('Credencial do Google ausente');
                await loginWithGoogle(idToken);
                addToast('Login com Google realizado.', 'success');
                if (onSuccess) {
                  onSuccess();
                } else {
                  onClose();
                }
              } catch (err: any) {
                addToast(err?.message || 'Falha no login Google.', 'error');
              }
            },
            ux_mode: 'popup'
          });
          initializedRef.current = true;
        } catch {
          setGoogleInit('error');
          setGoogleErrorCode('initialize');
        }
      }
      if (api && initializedRef.current && !renderAttemptedRef.current) {
        const container = document.getElementById('google-signin-btn');
        if (container) {
          try {
            // Configuração moderna para o botão do Google
            api.renderButton(container, { 
              theme: 'filled_black', // Melhor para dark mode
              size: 'large', 
              shape: 'pill', // Formato pílula mais moderno
              text: 'continue_with', // "Continuar com Google" soa mais fluido
              logo_alignment: 'center', // Centraliza logo e texto
              width: container.clientWidth // Força a largura exata do container no momento do render
            });
            
            // Força largura total via CSS no container após render
            const intervalStyle = setInterval(() => {
                const iframe = container.querySelector('iframe');
                if (iframe) {
                    iframe.style.width = '100%';
                    iframe.style.borderRadius = '9999px'; // Força arredondamento se falhar
                    clearInterval(intervalStyle);
                }
            }, 100);

            renderAttemptedRef.current = true;
            setGoogleInit('ready');
            clearInterval(interval);
          } catch {
            setGoogleInit('error');
            setGoogleErrorCode('render');
          }
        }
      }
      if (tries >= maxTries && googleInit !== 'ready') {
        clearInterval(interval);
        if (!initializedRef.current) {
          setGoogleInit('error');
          setGoogleErrorCode(api ? 'timeout' : 'script');
        }
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isOpen, addToast, onClose, onSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
        addToast('Cadastro realizado com sucesso.', 'success');
      } else {
        await loginWithEmail(email, password);
        addToast('Login realizado com sucesso.', 'success');
      }
      try { localStorage.setItem('userEmail', email); } catch {}
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (err: any) {
      addToast(err?.message || (isRegister ? 'Falha no cadastro.' : 'Falha ao autenticar.'), 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-gray-900/80 via-gray-900/80 to-gray-900/70 backdrop-blur-md"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm p-6 m-4 bg-slate-800/30 border border-slate-700 rounded-3xl shadow-2xl shadow-indigo-700/90 ring-1 ring-white/20">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Fechar modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center mb-6">
          <img 
             src="https://i.postimg.cc/sfK9DxF0/Logocerta7.png" 
             alt="GestãoPro Logo" 
             className="h-16 w-auto object-contain brightness-115 contrast-95" 
           />
          <h2 id="modal-title" className="text-xl font-extrabold tracking-tight text-white mt-3">Acesse a GestãoPro</h2>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1.5">Email</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="seuemail@exemplo.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-baseline">
                <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-1.5">Senha</label>
                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">Esqueceu a senha?</a>
            </div>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900">
              {isRegister ? 'Cadastrar' : 'Entrar'}
            </button>
          </div>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-slate-900 text-gray-400 uppercase tracking-widest">OU</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Container flexível que centraliza o botão do Google independentemente da largura dele */}
          <div id="google-signin-btn" className="flex flex-col items-center justify-center w-full min-h-[44px]"></div>
          {googleInit === 'loading' && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 animate-pulse">
               <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               Carregando Google...
            </div>
          )}
          {googleInit === 'error' && (
            <div className="text-center text-sm text-red-400">
              {googleErrorCode === 'missing_env' && (
                <>Opção de login com Google indisponível. Verifique <code>VITE_GOOGLE_CLIENT_ID</code>.</>
              )}
              {googleErrorCode === 'script' && (
                <>Falha ao carregar script do Google. Confirme o acesso a <code>https://accounts.google.com/gsi/client</code> e sua política de conteúdo (CSP).</>
              )}
              {googleErrorCode === 'initialize' && (
                <>Falha ao inicializar Google Sign-In. Verifique o Client ID e domínios autorizados.</>
              )}
              {googleErrorCode === 'render' && (
                <>Falha ao exibir o botão do Google. Verifique a configuração do container.</>
              )}
              {googleErrorCode === 'timeout' && (
                <>Tempo esgotado ao ativar o Google Sign-In. Recarregue a página e confirme seu Client ID.</>
              )}
            </div>
          )}
          {googleInit !== 'ready' && !['missing_env','script'].includes(googleErrorCode) && (
            <div className="flex justify-center w-full">
              <button
                type="button"
                onClick={() => {
                  try {
                    const api = (window as any)?.google?.accounts?.id;
                    if (!api) {
                      setGoogleInit('error');
                      setGoogleErrorCode('script');
                      return;
                    }
                    api.prompt();
                  } catch (e) {
                    addToast('Não foi possível iniciar o Google Sign-In.', 'error');
                    setGoogleInit('error');
                    setGoogleErrorCode('initialize');
                  }
                }}
                className="relative w-full group flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-full border border-white/10 shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="bg-white p-1 rounded-full">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.5-5.1 3.5-3.1 0-5.6-2.6-5.6-5.7s2.5-5.7 5.6-5.7c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.9 3.7 14.7 2.8 12 2.8 6.9 2.8 2.7 7 2.7 12s4.2 9.2 9.3 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.6H12z"/>
                    <path fill="#4285F4" d="M23.5 12.2c0-.6-.1-1.1-.2-1.6H12v3.6h6.5c-.3 1.7-1.3 3-2.8 3.9l2.3 1.8c2.1-1.9 3.5-4.7 3.5-7.7z"/>
                    <path fill="#FBBC05" d="M6.9 14.5c-.4-1.1-.4-2.4 0-3.5l-2.7-2.1c-1.2 2.4-1.2 5.3 0 7.7l2.7-2.1z"/>
                    <path fill="#34A853" d="M12 21.2c2.7 0 5-1 6.7-2.7l-2.3-1.8c-1 .7-2.3 1.2-3.7 1.2-3.6 0-6.6-2.4-7.6-5.7l-2.7 2.1C4.9 18.6 8.2 21.2 12 21.2z"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold tracking-wide">Continuar com Google</span>
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="font-semibold text-indigo-400 hover:text-indigo-300 bg-transparent border-none cursor-pointer p-0"
          >
            {isRegister ? 'Entre agora' : 'Crie uma agora'}
          </button>
        </p>

      </div>
    </div>
  );
};

export default Login;
