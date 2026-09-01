import React from 'react';
import { UserPreferences, UserProfile, PantryNotification, NavigationTab } from '../types';
import { translations } from '../utils/i18n';

interface TopAppBarProps {
  user: UserProfile;
  preferences: UserPreferences;
  notifications?: PantryNotification[];
  unreadCount?: number;
  onOpenNotifications: () => void;
  onShare?: () => void;
  onOpenScanner?: () => void;
  onNavigateHome?: () => void;
  onNavigate?: (tab: NavigationTab) => void;
  currentTab?: NavigationTab;
  onBack?: () => void;
  title?: string;
  showBack?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  user,
  preferences,
  notifications = [],
  unreadCount: explicitUnreadCount,
  onOpenNotifications,
  onShare,
  onOpenScanner,
  onNavigateHome,
  onNavigate,
  onBack,
  title,
  showBack = false,
}) => {
  const t = translations[preferences?.language || 'es'];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const computedUnread = safeNotifications.filter((n) => !n.read).length;
  const count = typeof explicitUnreadCount === 'number' ? explicitUnreadCount : computedUnread;

  const handleHomeClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  const handleDefaultShare = () => {
    if (onShare) {
      onShare();
      return;
    }
    if (navigator.share) {
      navigator.share({
        title: 'Pantry Guard',
        text: `${user.householdName} - Pantry Guard Despensa Inteligente`,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-40 bg-[#f8f9ff]/95 dark:bg-[#191c20]/95 backdrop-blur-md shadow-sm border-b border-[#e1e2e8]/80 dark:border-[#2e3135] transition-colors duration-200 pt-[env(safe-area-inset-top,0px)]">
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center px-3 sm:px-6 h-16">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              aria-label="Volver"
              className="w-9 h-9 sm:w-10 sm:h-10 -ml-1 sm:-ml-2 rounded-full flex items-center justify-center text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135] transition-colors shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined text-[22px] sm:text-[24px]">arrow_back</span>
            </button>
          ) : null}

          {/* Logo Shield Brand */}
          <button
            onClick={handleHomeClick}
            className="flex items-center gap-2 sm:gap-2.5 text-left group transition-transform active:scale-98 min-w-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#096430] text-[#a2f5b2] flex items-center justify-center shadow-sm overflow-hidden shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM18 16.59C18 18.5 15.34 19.5 12 19.5C8.66 19.5 6 18.5 6 16.59C6 14.7 8.66 13.7 12 13.7C15.34 13.7 18 14.7 18 16.59Z" />
              </svg>
            </div>
            <h1 className="font-bold text-base sm:text-lg text-[#004a21] dark:text-[#87d897] tracking-tight group-hover:opacity-90 truncate">
              {title || t.appName}
            </h1>
          </button>
        </div>

        {/* Right Actions: Scanner, Notifications & Share */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              aria-label="Escanear"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135] transition-colors active:scale-95"
              title="Escanear código de barras"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">barcode_scanner</span>
            </button>
          )}

          <button
            onClick={onOpenNotifications}
            aria-label="Notificaciones"
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135] transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">notifications</span>
            {count > 0 && (
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 bg-[#ba1a1a] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#f8f9ff] dark:ring-[#191c20]">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          <button
            onClick={handleDefaultShare}
            aria-label="Compartir"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135] transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]" data-icon="share">
              share
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

