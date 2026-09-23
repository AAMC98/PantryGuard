import React, { useEffect, useState } from 'react';
import { Language, UserPreferences } from '../types';
import { translations } from '../utils/i18n';
import { getCustomBackendUrl, setCustomBackendUrl, testBackendConnection, DEFAULT_BACKEND_URL } from '../utils/apiConfig';

interface PreferencesViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  onBack: () => void;
  onShowToast: (message: string) => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({
  preferences,
  onUpdatePreferences,
  onBack,
  onShowToast,
}) => {
  const t = translations[preferences?.language || 'es'];
  const isSpanish = preferences?.language !== 'en';

  const [lang, setLang] = useState<Language>(preferences?.language || 'es');
  const [dark, setDark] = useState<boolean>(preferences?.darkMode ?? false);
  const [alertDays, setAlertDays] = useState<number>(preferences?.expiryAlertDays || 3);
  const [backendUrl, setBackendUrl] = useState<string>(getCustomBackendUrl() || DEFAULT_BACKEND_URL);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);

  useEffect(() => {
    setLang(preferences?.language || 'es');
    setDark(preferences?.darkMode ?? false);
    setAlertDays(preferences?.expiryAlertDays || 3);
  }, [preferences]);

  const handleTestConnection = async () => {
    setIsTestingServer(true);
    setServerStatus(null);
    try {
      // Temporarily set custom url to test
      setCustomBackendUrl(backendUrl);
      const res = await testBackendConnection();
      setServerStatus(res);
      onShowToast(res.message);
    } catch {
      setServerStatus({ ok: false, message: isSpanish ? 'Error al contactar el servidor' : 'Failed to contact server' });
    } finally {
      setIsTestingServer(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);

    // Save custom backend url
    setCustomBackendUrl(backendUrl === DEFAULT_BACKEND_URL ? null : backendUrl);

    // Update parent preferences
    onUpdatePreferences({
      language: lang,
      darkMode: dark,
      expiryAlertDays: alertDays,
    });

    // Apply dark mode class immediately to <html>
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setTimeout(() => {
      setIsSaving(false);
      onShowToast(isSpanish ? '¡Preferencias guardadas con éxito!' : 'Preferences saved successfully!');
      setTimeout(onBack, 300);
    }, 350);
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      {/* Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135] transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#191c20] dark:text-[#f8f9ff]">
            {t.preferences.title}
          </h2>
          <p className="text-xs text-[#707a6f] dark:text-[#bfc9bd]">
            {isSpanish ? 'Personaliza tu experiencia, alertas y conexión' : 'Customize app experience, alerts & connection'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language Settings Card */}
        <section className="bg-white dark:bg-[#1e2124] rounded-2xl p-5 shadow-sm border border-[#bfc9bd]/60 dark:border-[#404940] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#004a21] dark:text-[#87d897] text-[24px]">
              language
            </span>
            <h3 className="font-semibold text-sm sm:text-base text-[#191c20] dark:text-[#f8f9ff]">
              {t.preferences.languageTitle}
            </h3>
          </div>
          <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
            {t.preferences.languageDesc}
          </p>

          <div className="mt-1 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setLang('es')}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border text-left ${
                lang === 'es'
                  ? 'bg-[#096430]/10 dark:bg-[#87d897]/15 border-[#004a21] dark:border-[#87d897] font-semibold'
                  : 'bg-[#f8f9ff] dark:bg-[#2e3135] border-transparent hover:bg-[#e1e2e8] dark:hover:bg-[#383c41]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🇲🇽</span>
                <span className="text-xs sm:text-sm text-[#191c20] dark:text-[#f8f9ff]">
                  Español (México / Latam)
                </span>
              </div>
              <span className={`material-symbols-outlined text-[20px] ${lang === 'es' ? 'text-[#004a21] dark:text-[#87d897]' : 'text-transparent'}`}>
                check_circle
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLang('en')}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border text-left ${
                lang === 'en'
                  ? 'bg-[#096430]/10 dark:bg-[#87d897]/15 border-[#004a21] dark:border-[#87d897] font-semibold'
                  : 'bg-[#f8f9ff] dark:bg-[#2e3135] border-transparent hover:bg-[#e1e2e8] dark:hover:bg-[#383c41]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🇺🇸</span>
                <span className="text-xs sm:text-sm text-[#191c20] dark:text-[#f8f9ff]">
                  English (United States)
                </span>
              </div>
              <span className={`material-symbols-outlined text-[20px] ${lang === 'en' ? 'text-[#004a21] dark:text-[#87d897]' : 'text-transparent'}`}>
                check_circle
              </span>
            </button>
          </div>
        </section>

        {/* Theme Settings Card (Light / Dark Mode Selector) */}
        <section className="bg-white dark:bg-[#1e2124] rounded-2xl p-5 shadow-sm border border-[#bfc9bd]/60 dark:border-[#404940] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#004a21] dark:text-[#87d897] text-[24px]">
              {dark ? 'dark_mode' : 'light_mode'}
            </span>
            <h3 className="font-semibold text-sm sm:text-base text-[#191c20] dark:text-[#f8f9ff]">
              {t.preferences.appearanceTitle}
            </h3>
          </div>
          <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
            {t.preferences.appearanceDesc}
          </p>

          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDark(false)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                !dark
                  ? 'bg-[#f8f9ff] border-[#004a21] text-[#004a21] shadow-sm font-semibold ring-2 ring-[#004a21]/20'
                  : 'bg-[#f8f9ff] dark:bg-[#2e3135] border-transparent text-[#707a6f] dark:text-[#bfc9bd] hover:bg-[#e1e2e8]'
              }`}
            >
              <span className="material-symbols-outlined text-[24px] text-amber-500">wb_sunny</span>
              <span className="text-xs font-bold">{isSpanish ? 'Modo Claro' : 'Light Mode'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDark(true)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                dark
                  ? 'bg-[#111318] border-[#87d897] text-[#87d897] shadow-sm font-semibold ring-2 ring-[#87d897]/30'
                  : 'bg-[#f8f9ff] dark:bg-[#2e3135] border-transparent text-[#707a6f] dark:text-[#bfc9bd] hover:bg-[#e1e2e8]'
              }`}
            >
              <span className="material-symbols-outlined text-[24px] text-indigo-400">nightlight</span>
              <span className="text-xs font-bold">{isSpanish ? 'Modo Oscuro' : 'Dark Mode'}</span>
            </button>
          </div>
        </section>

        {/* Expiry Alert Days Setting */}
        <section className="bg-white dark:bg-[#1e2124] rounded-2xl p-5 shadow-sm border border-[#bfc9bd]/60 dark:border-[#404940] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#004a21] dark:text-[#87d897] text-[24px]">
              notifications_active
            </span>
            <h3 className="font-semibold text-sm sm:text-base text-[#191c20] dark:text-[#f8f9ff]">
              {isSpanish ? 'Días de Alerta de Caducidad' : 'Expiry Alert Threshold'}
            </h3>
          </div>
          <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
            {isSpanish
              ? '¿Con cuántos días de anticipación marcar un producto en color naranja?'
              : 'How many days before expiration to alert products in orange?'}
          </p>

          <div className="flex items-center gap-2 mt-2">
            {[2, 3, 5, 7].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setAlertDays(days)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  alertDays === days
                    ? 'bg-[#004a21] text-white border-[#004a21] shadow-sm'
                    : 'bg-[#f8f9ff] dark:bg-[#2e3135] text-[#404940] dark:text-[#bfc9bd] border-transparent hover:bg-[#e1e2e8]'
                }`}
              >
                {days} {isSpanish ? 'días' : 'days'}
              </button>
            ))}
          </div>
        </section>

        {/* Backend Cloud Server Connection (Crucial for APK & Web) */}
        <section className="bg-white dark:bg-[#1e2124] rounded-2xl p-5 shadow-sm border border-[#bfc9bd]/60 dark:border-[#404940] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#004a21] dark:text-[#87d897] text-[24px]">
              cloud_sync
            </span>
            <h3 className="font-semibold text-sm sm:text-base text-[#191c20] dark:text-[#f8f9ff]">
              {isSpanish ? 'Servidor Backend de IA' : 'AI Cloud Backend Server'}
            </h3>
          </div>
          <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
            {isSpanish
              ? 'URL del servicio en la nube (Render) para llamadas a Gemini Vision y recetas:'
              : 'Cloud service URL (Render) for Gemini Vision and recipe queries:'}
          </p>

          <div className="flex flex-col gap-2 mt-1">
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="https://pantryguard.onrender.com"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#bfc9bd] dark:border-[#404940] bg-[#f8f9ff] dark:bg-[#2e3135] text-[#191c20] dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#004a21]"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingServer}
                className="flex-1 py-2 px-3 rounded-xl bg-[#f2f3f9] dark:bg-[#2e3135] hover:bg-[#e1e2e8] text-xs font-bold text-[#004a21] dark:text-[#87d897] border border-[#bfc9bd]/60 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span className={`material-symbols-outlined text-[16px] ${isTestingServer ? 'animate-spin' : ''}`}>
                  {isTestingServer ? 'sync' : 'network_check'}
                </span>
                <span>{isTestingServer ? (isSpanish ? 'Probando...' : 'Testing...') : (isSpanish ? 'Probar Conexión' : 'Test Connection')}</span>
              </button>

              <button
                type="button"
                onClick={() => setBackendUrl(DEFAULT_BACKEND_URL)}
                className="py-2 px-3 rounded-xl text-xs font-medium text-[#707a6f] hover:text-[#191c20] dark:hover:text-white"
                title={isSpanish ? 'Restaurar URL oficial' : 'Reset URL'}
              >
                {isSpanish ? 'Restablecer' : 'Reset'}
              </button>
            </div>

            {serverStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
                  serverStatus.ok
                    ? 'bg-[#e8f5e9] text-[#004a21] border border-[#c8e6c9]'
                    : 'bg-[#fff3e0] text-[#9f4200] border border-[#ffe0b2]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {serverStatus.ok ? 'check_circle' : 'info'}
                </span>
                <span className="font-medium">{serverStatus.message}</span>
                {serverStatus.latencyMs !== undefined && (
                  <span className="text-[10px] opacity-75 font-mono ml-auto">({serverStatus.latencyMs}ms)</span>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Save Button (Explicit Action) */}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#004a21] hover:bg-[#096430] active:scale-95 text-white text-xs font-bold py-3.5 px-8 rounded-full shadow-md transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <span
            className={`material-symbols-outlined text-[18px] ${
              isSaving ? 'animate-spin' : ''
            }`}
          >
            {isSaving ? 'sync' : 'save'}
          </span>
          <span>{isSaving ? (isSpanish ? 'Guardando...' : 'Saving...') : (isSpanish ? 'Guardar Preferencias' : 'Save Preferences')}</span>
        </button>
      </div>
    </div>
  );
};
