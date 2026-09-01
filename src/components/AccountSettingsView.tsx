import React, { useState } from 'react';
import { UserPreferences, UserProfile } from '../types';
import { translations } from '../utils/i18n';

interface AccountSettingsViewProps {
  user: UserProfile;
  preferences: UserPreferences;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  onBack: () => void;
  onLogout: () => void;
  onShowToast: (message: string) => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({
  user,
  preferences,
  onUpdateProfile,
  onUpdatePreferences,
  onBack,
  onLogout,
  onShowToast,
}) => {
  const t = translations[preferences.language];

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [purchaseReminders, setPurchaseReminders] = useState(preferences.purchaseReminders);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setAvatarUrl(result);
        onUpdateProfile({ avatarUrl: result });
        onShowToast('Foto de perfil actualizada');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSavingProfile(true);
    setTimeout(() => {
      const initials = name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      onUpdateProfile({
        name: name.trim(),
        email: email.trim(),
        initials,
        avatarUrl,
      });

      setIsSavingProfile(false);
      onShowToast(t.account.savedToast);
    }, 400);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      onShowToast(t.account.passwordUpdated);
    }, 600);
  };

  const handleToggleExpiryAlerts = () => {
    const nextVal = !expiryAlerts;
    setExpiryAlerts(nextVal);
    onShowToast(nextVal ? 'Alertas de caducidad activadas' : 'Alertas desactivadas');
  };

  const handleTogglePurchaseReminders = () => {
    const nextVal = !purchaseReminders;
    setPurchaseReminders(nextVal);
    onUpdatePreferences({ purchaseReminders: nextVal });
    onShowToast(nextVal ? 'Recordatorios de compra activados' : 'Recordatorios desactivados');
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      {/* Header and Back */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135] transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#191c20] dark:text-[#f8f9ff]">
            {t.account.title}
          </h2>
          <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
            {t.account.subtitle}
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-[#1e2124] rounded-2xl p-5 shadow-sm border border-[#bfc9bd]/60 dark:border-[#404940]">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#e1e2e8] dark:border-[#2e3135]">
            <div className="flex items-center gap-3.5">
              {/* Avatar with Upload trigger */}
              <div className="relative group cursor-pointer">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#003d87] text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.initials || 'J'}</span>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#004a21] text-white rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#096430] border-2 border-white dark:border-[#1e2124]">
                  <span className="material-symbols-outlined text-[13px]">edit</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <h3 className="font-bold text-base text-[#191c20] dark:text-[#f8f9ff]">
                  {name || user.name}
                </h3>
                <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
                  {email || user.email}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="text-[#004a21] dark:text-[#87d897] hover:bg-[#096430]/10 rounded-lg py-1.5 px-3 transition-colors text-xs font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSavingProfile ? 'sync' : 'save'}
              </span>
              <span>{isSavingProfile ? 'Guardando...' : t.account.save}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd]">
                {t.account.fullName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] dark:bg-[#2e3135] border border-[#bfc9bd] dark:border-[#404940] rounded-lg text-xs text-[#191c20] dark:text-white focus:outline-none focus:border-[#003d87]"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd]">
                {t.account.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] dark:bg-[#2e3135] border border-[#bfc9bd] dark:border-[#404940] rounded-lg text-xs text-[#191c20] dark:text-white focus:outline-none focus:border-[#003d87]"
                required
              />
            </div>
          </div>
        </form>
      </div>

      {/* Seguridad Card */}
      <div className="bg-white dark:bg-[#1e2124] rounded-2xl p-5 shadow-sm border border-[#bfc9bd]/60 dark:border-[#404940]">
        <div className="flex items-center gap-2 mb-3.5 text-[#191c20] dark:text-[#f8f9ff]">
          <span className="material-symbols-outlined text-[22px]">lock</span>
          <h3 className="font-semibold text-sm">{t.account.security}</h3>
        </div>

        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd]">
                {t.account.currentPassword}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] dark:bg-[#2e3135] border border-[#bfc9bd] dark:border-[#404940] rounded-lg text-xs text-[#191c20] dark:text-white focus:outline-none focus:border-[#003d87]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd]">
                {t.account.newPassword}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa nueva contraseña"
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] dark:bg-[#2e3135] border border-[#bfc9bd] dark:border-[#404940] rounded-lg text-xs text-[#191c20] dark:text-white focus:outline-none focus:border-[#003d87]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword || !newPassword}
            className="w-full py-3 bg-[#004a21] hover:bg-[#096430] disabled:opacity-50 text-white rounded-full text-xs font-semibold transition-all shadow-sm active:scale-98 mt-1"
          >
            {isUpdatingPassword ? 'Actualizando...' : t.account.updatePassword}
          </button>
        </form>
      </div>

      {/* Notifications Card */}
      <div className="bg-white dark:bg-[#1e2124] rounded-2xl p-5 shadow-sm border border-[#bfc9bd]/60 dark:border-[#404940]">
        <div className="flex items-center gap-2 mb-3.5 text-[#191c20] dark:text-[#f8f9ff]">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <h3 className="font-semibold text-sm">{t.account.notifications}</h3>
        </div>

        <div className="flex flex-col gap-3 divide-y divide-[#e1e2e8] dark:divide-[#2e3135]">
          {/* Toggle 1 */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-semibold text-[#191c20] dark:text-[#f8f9ff]">
                {t.account.expiryAlerts}
              </p>
              <p className="text-[11px] text-[#707a6f] dark:text-[#bfc9bd]">
                {t.account.expiryAlertsDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleExpiryAlerts}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                expiryAlerts
                  ? 'bg-[#004a21] text-white'
                  : 'border border-[#707a6f] text-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
            </button>
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-xs font-semibold text-[#191c20] dark:text-[#f8f9ff]">
                {t.account.purchaseReminders}
              </p>
              <p className="text-[11px] text-[#707a6f] dark:text-[#bfc9bd]">
                {t.account.purchaseRemindersDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={handleTogglePurchaseReminders}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                purchaseReminders
                  ? 'bg-[#004a21] text-white'
                  : 'border border-[#707a6f] text-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <div className="flex justify-end pt-1">
        {!isConfirmingLogout ? (
          <button
            type="button"
            onClick={() => setIsConfirmingLogout(true)}
            className="px-6 py-2.5 bg-transparent border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/30 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>{t.profile.logout}</span>
          </button>
        ) : (
          <div className="p-3 bg-[#ffdad6]/60 dark:bg-[#93000a]/20 border border-[#ba1a1a]/40 rounded-xl flex items-center gap-3">
            <span className="text-xs text-[#ba1a1a] dark:text-[#ffb4ab] font-medium">
              {t.profile.logoutConfirm}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingLogout(false)}
                className="px-3 py-1.5 bg-white dark:bg-[#2e3135] text-[#191c20] dark:text-white rounded-lg text-xs font-semibold border border-[#bfc9bd] dark:border-[#404940]"
              >
                {translations[preferences.language].dashboard.cancelAction}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingLogout(false);
                  onLogout();
                }}
                className="px-3 py-1.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg text-xs font-semibold"
              >
                {t.profile.logout}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
