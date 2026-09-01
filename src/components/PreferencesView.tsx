import React, { useEffect, useState } from 'react';
import { Language, UserPreferences } from '../types';
import { translations } from '../utils/i18n';

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
  const t = translations[preferences.language];

  const [lang, setLang] = useState<Language>(preferences.language);
  const [dark, setDark] = useState<boolean>(preferences.darkMode);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLang(preferences.language);
    setDark(preferences.darkMode);
  }, [preferences]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    onUpdatePreferences({ language: newLang });
    onShowToast(
      newLang === 'es' ? 'Idioma cambiado a Español' : 'Language changed to English'
    );
  };

  const handleThemeToggle = (targetDark?: boolean) => {
    const nextDark = typeof targetDark === 'boolean' ? targetDark : !dark;
    setDark(nextDark);
    onUpdatePreferences({ darkMode: nextDark });
    if (nextDark) {
      document.documentElement.classList.add('dark');
      onShowToast(preferences.language === 'es' ? 'Modo Oscuro activado' : 'Dark mode enabled');
    } else {
      document.documentElement.classList.remove('dark');
      onShowToast(preferences.language === 'es' ? 'Modo Claro activado' : 'Light mode enabled');
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onUpdatePreferences({
        language: lang,
        darkMode: dark,
      });
      setIsSaving(false);
      onShowToast(t.preferences.savedToast);
      setTimeout(onBack, 300);
    }, 400);
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      {/* Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135] transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h2 className="text-2xl font-bold text-[#191c20] dark:text-[#f8f9ff]">
          {t.preferences.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language Settings Card */}
        <section className="bg-white dark:bg-[#1e2124] rounded-2xl p-5 shadow-sm border border-[#bfc9bd]/60 dark:border-[#404940] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#004a21] dark:text-[#87d897] text-[26px]">
              language
            </span>
            <h3 className="font-semibold text-base text-[#191c20] dark:text-[#f8f9ff]">
              {t.preferences.languageTitle}
            </h3>
          </div>
          <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
            {t.preferences.languageDesc}
          </p>

          <div className="mt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleLanguageChange('es')}
              className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border text-left ${
                lang === 'es'
                  ? 'bg-[#096430]/10 dark:bg-[#87d897]/15 border-[#004a21] dark:border-[#87d897] font-semibold'
                  : 'bg-[#f8f9ff] dark:bg-[#2e3135] border-transparent hover:bg-[#e1e2e8] dark:hover:bg-[#383c41]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🇲🇽</span>
                <span className="text-sm text-[#191c20] dark:text-[#f8f9ff]">
                  {t.preferences.spanish}
                </span>
              </div>
              <span className={`material-symbols-outlined text-[20px] ${lang === 'es' ? 'text-[#004a21] dark:text-[#87d897]' : 'text-transparent'}`}>
                check_circle
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border text-left ${
                lang === 'en'
                  ? 'bg-[#096430]/10 dark:bg-[#87d897]/15 border-[#004a21] dark:border-[#87d897] font-semibold'
                  : 'bg-[#f8f9ff] dark:bg-[#2e3135] border-transparent hover:bg-[#e1e2e8] dark:hover:bg-[#383c41]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🇺🇸</span>
                <span className="text-sm text-[#191c20] dark:text-[#f8f9ff]">
                  {t.preferences.english}
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
            <span className="material-symbols-outlined text-[#004a21] dark:text-[#87d897] text-[26px]">
              {dark ? 'dark_mode' : 'light_mode'}
            </span>
            <h3 className="font-semibold text-base text-[#191c20] dark:text-[#f8f9ff]">
              {t.preferences.appearanceTitle}
            </h3>
          </div>
          <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
            {t.preferences.appearanceDesc}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => handleThemeToggle(false)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                !dark
                  ? 'bg-[#f8f9ff] border-[#004a21] text-[#004a21] shadow-sm font-semibold ring-2 ring-[#004a21]/20'
                  : 'bg-[#f8f9ff] dark:bg-[#2e3135] border-transparent text-[#707a6f] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#383c41]'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined text-[22px]">wb_sunny</span>
              </div>
              <span className="text-xs sm:text-sm">
                {preferences.language === 'es' ? 'Modo Claro' : 'Light Mode'}
              </span>
              {!dark && (
                <span className="text-[10px] bg-[#004a21] text-white px-2 py-0.5 rounded-full font-medium">
                  {preferences.language === 'es' ? 'Activo' : 'Active'}
                </span>
              )}
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => handleThemeToggle(true)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                dark
                  ? 'bg-[#111318] border-[#87d897] text-[#87d897] shadow-sm font-semibold ring-2 ring-[#87d897]/30'
                  : 'bg-[#f8f9ff] dark:bg-[#2e3135] border-transparent text-[#707a6f] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#383c41]'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-300">
                <span className="material-symbols-outlined text-[22px]">nightlight</span>
              </div>
              <span className="text-xs sm:text-sm">
                {preferences.language === 'es' ? 'Modo Oscuro' : 'Dark Mode'}
              </span>
              {dark && (
                <span className="text-[10px] bg-[#87d897] text-[#00210b] px-2 py-0.5 rounded-full font-bold">
                  {preferences.language === 'es' ? 'Activo' : 'Active'}
                </span>
              )}
            </button>
          </div>
        </section>
        {/* Mobile & PWA Installation Guide for iOS & Android */}
        <section className="bg-white dark:bg-[#191c20] p-5 rounded-2xl border border-[#e1e2e8] dark:border-[#2e3135] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[#004a21] dark:text-[#87d897]">
              smartphone
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#191c20] dark:text-white">
              {preferences.language === 'es' ? 'Instalar en tu Celular (iOS y Android)' : 'Install on Phone (iOS & Android)'}
            </h3>
          </div>
          <p className="text-xs text-[#707a6f] dark:text-[#bfc9bd] mb-3 leading-relaxed">
            {preferences.language === 'es'
              ? 'Puedes usar Pantry Guard a pantalla completa como una aplicación nativa instalándola en tu pantalla de inicio:'
              : 'You can use Pantry Guard in full screen as a native application by adding it to your home screen:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* iOS Instructions */}
            <div className="p-3.5 rounded-xl bg-[#f8f9ff] dark:bg-[#2e3135] border border-[#e1e2e8] dark:border-[#404940] flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#191c20] dark:text-white">
                <span className="material-symbols-outlined text-[#003d87] dark:text-[#87d897] text-[18px]">
                  phone_iphone
                </span>
                <span>iPhone / iPad (Safari)</span>
              </div>
              <ol className="list-decimal list-inside text-[#404940] dark:text-[#bfc9bd] space-y-1 text-[11px] leading-relaxed">
                <li>{preferences.language === 'es' ? 'Toca el botón Compartir en Safari' : 'Tap the Share button in Safari'} <span className="inline-block border border-gray-300 dark:border-gray-600 rounded px-1 text-[10px]">⎋</span></li>
                <li>{preferences.language === 'es' ? 'Desliza y pulsa "Agregar al inicio"' : 'Scroll down & tap "Add to Home Screen"'}</li>
                <li>{preferences.language === 'es' ? '¡Listo! Ábrela como app nativa' : 'Ready! Open it as a native app'}</li>
              </ol>
            </div>

            {/* Android Instructions */}
            <div className="p-3.5 rounded-xl bg-[#f8f9ff] dark:bg-[#2e3135] border border-[#e1e2e8] dark:border-[#404940] flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#191c20] dark:text-white">
                <span className="material-symbols-outlined text-[#004a21] dark:text-[#87d897] text-[18px]">
                  phone_android
                </span>
                <span>Android (Chrome / Edge)</span>
              </div>
              <ol className="list-decimal list-inside text-[#404940] dark:text-[#bfc9bd] space-y-1 text-[11px] leading-relaxed">
                <li>{preferences.language === 'es' ? 'Toca el menú de tres puntos (⋮)' : 'Tap the 3 dots menu (⋮)'}</li>
                <li>{preferences.language === 'es' ? 'Selecciona "Instalar aplicación" o "Agregar a la pantalla principal"' : 'Select "Install app" or "Add to Home Screen"'}</li>
                <li>{preferences.language === 'es' ? 'Disfruta de escaneo rápido y pantalla completa' : 'Enjoy quick scanning and full screen'}</li>
              </ol>
            </div>
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#004a21] hover:bg-[#096430] text-white text-xs font-semibold py-3 px-8 rounded-full shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <span
            className={`material-symbols-outlined text-[18px] ${
              isSaving ? 'animate-spin' : ''
            }`}
          >
            {isSaving ? 'sync' : 'save'}
          </span>
          <span>{isSaving ? (preferences.language === 'es' ? 'Guardando...' : 'Saving...') : t.preferences.saveChanges}</span>
        </button>
      </div>
    </div>
  );
};
