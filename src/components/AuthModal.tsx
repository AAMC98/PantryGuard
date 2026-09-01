import React, { useState } from 'react';
import { UserPreferences, UserProfile } from '../types';
import { translations } from '../utils/i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
  preferences: UserPreferences;
  onShowToast: (message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  preferences,
  onShowToast,
}) => {
  const t = translations[preferences.language];
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setTimeout(() => {
      const initials = (name || email.split('@')[0])
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const userProfile: UserProfile = {
        id: `usr-${Date.now()}`,
        name: name.trim() || 'Juan Pérez',
        email: email.trim(),
        initials: initials || 'J',
        lastSyncedAt: new Date().toISOString(),
      };

      onLogin(userProfile);
      setIsLoading(false);
      onShowToast(
        isRegister
          ? '¡Cuenta creada y datos respaldados!'
          : '¡Sesión iniciada con éxito!'
      );
      onClose();
    }, 600);
  };

  const handleQuickDemo = (demoEmail: string, demoName: string) => {
    onLogin({
      id: 'usr-1',
      name: demoName,
      email: demoEmail,
      initials: demoName.charAt(0),
      lastSyncedAt: new Date().toISOString(),
    });
    onShowToast('Sesión activa: ' + demoName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#1e2124] rounded-[24px] p-6 w-full max-w-sm shadow-2xl border border-[#e1e2e8] dark:border-[#404940] flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#004a21] text-[#87d897] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </div>
            <h3 className="text-lg font-bold text-[#191c20] dark:text-[#f8f9ff]">
              {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#707a6f] hover:bg-[#f2f3f9] dark:hover:bg-[#2e3135]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
          {isRegister
            ? 'Guarda tu despensa en la nube y sincroniza con todos tus dispositivos.'
            : 'Inicia sesión para respaldar y sincronizar tus productos.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isRegister && (
            <div>
              <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd] block mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#bfc9bd] dark:border-[#404940] bg-[#f8f9ff] dark:bg-[#2e3135] text-xs text-[#191c20] dark:text-white focus:outline-none focus:border-[#003d87]"
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd] block mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#bfc9bd] dark:border-[#404940] bg-[#f8f9ff] dark:bg-[#2e3135] text-xs text-[#191c20] dark:text-white focus:outline-none focus:border-[#003d87]"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd] block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#bfc9bd] dark:border-[#404940] bg-[#f8f9ff] dark:bg-[#2e3135] text-xs text-[#191c20] dark:text-white focus:outline-none focus:border-[#003d87]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#004a21] hover:bg-[#096430] active:scale-98 text-white rounded-full text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 mt-1"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  sync
                </span>
                <span>Procesando...</span>
              </>
            ) : (
              <span>{isRegister ? 'Registrarse' : 'Iniciar Sesión'}</span>
            )}
          </button>
        </form>

        <div className="flex flex-col gap-2 pt-2 border-t border-[#e1e2e8] dark:border-[#2e3135] text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-[#003d87] dark:text-[#aec6ff] font-semibold hover:underline"
          >
            {isRegister
              ? '¿Ya tienes una cuenta? Inicia sesión aquí'
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('juan@example.com', 'Juan Pérez')}
            className="text-[11px] text-[#707a6f] hover:text-[#191c20] dark:hover:text-white underline mt-1"
          >
            Entrar como usuario Demo (Juan Pérez)
          </button>
        </div>
      </div>
    </div>
  );
};
