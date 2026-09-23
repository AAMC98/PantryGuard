import React, { useState } from 'react';
import { UserPreferences, UserProfile } from '../types';
import { translations } from '../utils/i18n';

interface ProfileViewProps {
  user: UserProfile;
  preferences: UserPreferences;
  onNavigateToAccount: () => void;
  onNavigateToPreferences: () => void;
  onLogout: () => void;
  onSyncData: () => Promise<void>;
  onShowToast: (message: string) => void;
  onTestNotification?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  preferences,
  onNavigateToAccount,
  onNavigateToPreferences,
  onLogout,
  onSyncData,
  onShowToast,
  onTestNotification,
}) => {
  const t = translations[preferences.language];
  const lang = preferences.language;
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedState, setSyncedState] = useState(false);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await onSyncData();
      setIsSyncing(false);
      setSyncedState(true);
      onShowToast(lang === 'es' ? '¡Datos sincronizados en la nube!' : 'Data synced with cloud!');
      setTimeout(() => setSyncedState(false), 2500);
    } catch {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      {/* Profile Header Area (Glassmorphism & Bento Card) */}
      <section className="w-full bg-white/90 dark:bg-[#1e2124] backdrop-blur-md rounded-[24px] p-6 md:p-8 flex flex-col items-center shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#e1e2e8]/80 dark:border-[#2e3135] relative overflow-hidden text-center">
        {/* Decorative background header gradient */}
        <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-[#096430]/20 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center gap-3.5">
          {/* Circular Avatar */}
          <div className="w-24 h-24 rounded-full bg-[#004a21] dark:bg-[#096430] flex items-center justify-center text-white text-3xl font-bold shadow-[0_8px_16px_rgba(0,74,33,0.2)] border-4 border-white dark:border-[#1e2124] overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user.initials || user.name.charAt(0)}</span>
            )}
          </div>

          {/* User Info */}
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl font-bold text-[#191c20] dark:text-[#f8f9ff]">
              {user.name}
            </h2>
            <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
              {user.email}
            </p>
          </div>

          {/* Cloud Sync Status Badge */}
          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            className="mt-1 bg-[#f2f3f9] dark:bg-[#2e3135] border border-[#bfc9bd]/70 dark:border-[#404940] rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm cursor-pointer hover:bg-[#e1e2e8] dark:hover:bg-[#404940] transition-colors active:scale-95 text-xs font-medium text-[#191c20] dark:text-[#f8f9ff]"
          >
            <span
              className={`material-symbols-outlined text-[18px] text-[#004a21] dark:text-[#87d897] fill-icon ${
                isSyncing ? 'animate-spin' : ''
              }`}
            >
              {isSyncing ? 'sync' : syncedState ? 'check_circle' : 'cloud_done'}
            </span>
            <span>
              {isSyncing
                ? t.profile.syncing
                : syncedState
                ? t.profile.synced
                : t.profile.backedUp}
            </span>
          </button>
        </div>
      </section>

      {/* Navigation Bento Grid Cards */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Account Settings Card */}
        <div
          onClick={onNavigateToAccount}
          className="bg-white dark:bg-[#1e2124] rounded-[20px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all cursor-pointer flex items-center gap-4 border border-[#e1e2e8]/60 dark:border-[#2e3135] active:scale-[0.99] group"
        >
          <div className="w-12 h-12 rounded-full bg-[#003d87]/10 text-[#003d87] dark:text-[#aec6ff] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">
              manage_accounts
            </span>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-sm text-[#191c20] dark:text-[#f8f9ff]">
              {t.profile.accountSettings}
            </h3>
            <p className="text-xs text-[#404940] dark:text-[#bfc9bd] truncate mt-0.5">
              {t.profile.accountSubtitle}
            </p>
          </div>
          <span className="material-symbols-outlined text-[#bfc9bd] group-hover:text-[#191c20] dark:group-hover:text-white transition-colors">
            chevron_right
          </span>
        </div>

        {/* Preferences Card */}
        <div
          onClick={onNavigateToPreferences}
          className="bg-white dark:bg-[#1e2124] rounded-[20px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all cursor-pointer flex items-center gap-4 border border-[#e1e2e8]/60 dark:border-[#2e3135] active:scale-[0.99] group"
        >
          <div className="w-12 h-12 rounded-full bg-[#004a21]/10 text-[#004a21] dark:text-[#87d897] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">tune</span>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-sm text-[#191c20] dark:text-[#f8f9ff]">
              {t.profile.appPreferences}
            </h3>
            <p className="text-xs text-[#404940] dark:text-[#bfc9bd] truncate mt-0.5">
              {t.profile.preferencesSubtitle}
            </p>
          </div>
          <span className="material-symbols-outlined text-[#bfc9bd] group-hover:text-[#191c20] dark:group-hover:text-white transition-colors">
            chevron_right
          </span>
        </div>
      </section>

      {/* Information: Offline Local Storage & Cloud Sync Explanation */}
      <section className="w-full bg-[#f8f9ff] dark:bg-[#14171a] rounded-[20px] p-4.5 border border-[#e1e2e8] dark:border-[#2e3135] flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#096430] dark:text-[#87d897] text-[20px]">
            verified_user
          </span>
          <h4 className="text-xs sm:text-sm font-bold text-[#191c20] dark:text-white">
            {lang === 'es' ? 'Almacenamiento Local & Respaldo en la Nube' : 'Local Storage & Cloud Backup'}
          </h4>
        </div>
        <p className="text-xs text-[#505a50] dark:text-[#bfc9bd] leading-relaxed">
          {lang === 'es'
            ? 'Todos tus productos, listas de compras y recetas se guardan de forma instantánea y segura directamente en tu teléfono. El botón de sincronización confirma el respaldo para que tus datos nunca se pierdan.'
            : 'All your items, shopping lists, and recipes are saved instantly and securely on your device. The sync button confirms cloud backup so you never lose your data.'}
        </p>

        {onTestNotification && (
          <div className="pt-2 border-t border-[#e1e2e8] dark:border-[#282b30] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#191c20] dark:text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#003d87] dark:text-[#a8c7fa]">
                notifications_active
              </span>
              <span>{lang === 'es' ? '¿Cómo funcionan las notificaciones?' : 'How do notifications work?'}</span>
            </span>
            <button
              type="button"
              onClick={onTestNotification}
              className="px-3 py-1.5 rounded-xl bg-[#004a21] hover:bg-[#096430] text-white text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[15px]">send</span>
              <span>{lang === 'es' ? 'Probar Alerta en Vivo' : 'Test Live Alert'}</span>
            </button>
          </div>
        )}
      </section>

      {/* Logout Action */}
      <div className="w-full mt-2 pt-2">
        {!isConfirmingLogout ? (
          <button
            onClick={() => setIsConfirmingLogout(true)}
            className="w-full min-h-[48px] rounded-full border-2 border-[#ba1a1a] text-[#ba1a1a] font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#ffdad6]/30 transition-colors active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>{t.profile.logout}</span>
          </button>
        ) : (
          <div className="p-4 bg-[#ffdad6]/60 dark:bg-[#93000a]/20 border border-[#ba1a1a]/40 rounded-2xl flex flex-col gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-[#ba1a1a] dark:text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="text-xs font-semibold">{t.profile.logoutConfirm}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingLogout(false)}
                className="flex-1 bg-white dark:bg-[#2e3135] text-[#191c20] dark:text-white border border-[#bfc9bd] dark:border-[#404940] rounded-full py-2.5 text-xs font-semibold transition-colors hover:bg-[#e1e2e8]"
              >
                {translations[lang].dashboard.cancelAction}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingLogout(false);
                  onLogout();
                }}
                className="flex-1 bg-[#ba1a1a] hover:bg-[#93000a] active:scale-95 text-white rounded-full py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <span>{t.profile.logout}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
