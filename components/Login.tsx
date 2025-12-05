import React, { useState, useEffect } from 'react';
import { loginWithEmail, loginWithGoogle } from '@/services/authService';
import { useToast } from '@/components/ToastProvider';

interface LoginProps {
  isOpen: boolean;
  onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { addToast } = useToast();

  // Inicializa Google Identity Services e renderiza botão oficial
  useEffect(() => {
    if (!isOpen) return;
    const google = (window as any)?.google;
    const clientId = (import.meta as any)?.env?.VITE_GOOGLE_CLIENT_ID;
    if (!google?.accounts?.id) return;
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID não configurado');
      return;
    }
    try {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            const idToken = response?.credential;
            if (!idToken) throw new Error('Credencial do Google ausente');
            await loginWithGoogle(idToken);
            addToast('Login com Google realizado.', 'success');
            onClose();
          } catch (err: any) {
            addToast(err?.message || 'Falha no login Google.', 'error');
          }
        },
        ux_mode: 'popup'
      });
      const container = document.getElementById('google-signin-btn');
      if (container) {
        google.accounts.id.renderButton(container, { theme: 'filled_blue', size: 'large', text: 'signin_with' });
      }
    } catch (e) {
      console.error('Erro ao inicializar Google Identity:', e);
    }
  }, [isOpen, addToast, onClose]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      try { localStorage.setItem('userEmail', email); } catch {}
      addToast('Login realizado com sucesso.', 'success');
      onClose();
    } catch (err: any) {
      addToast(err?.message || 'Falha ao autenticar.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md p-8 m-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-indigo-900/30">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Fechar modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h2 id="modal-title" className="text-3xl font-bold text-white mb-2">Acesse a GestãoPro</h2>
          <p className="text-gray-400 mb-8">Continue sua jornada para uma gestão mais inteligente.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="seuemail@exemplo.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-baseline">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300">Esqueceu a senha?</a>
            </div>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105">
              Entrar
            </button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-800 text-gray-400">OU</span>
          </div>
        </div>
        
        <div id="google-signin-btn" className="flex justify-center"></div>

        <p className="mt-8 text-center text-sm text-gray-400">
          Não tem uma conta? <a href="#" className="font-semibold text-indigo-400 hover:text-indigo-300">Crie uma agora</a>
        </p>

      </div>
    </div>
  );
};

export default Login;
