import React from 'react';
import { NavigationTab, UserPreferences } from '../types';
import { translations } from '../utils/i18n';

export type TabType = NavigationTab;

interface BottomNavBarProps {
  activeTab: NavigationTab;
  onChangeTab?: (tab: NavigationTab) => void;
  onTabChange?: (tab: NavigationTab) => void;
  preferences: UserPreferences;
  shoppingItemsCount?: number;
  shoppingCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
  onTabChange,
  preferences,
  shoppingItemsCount = 0,
  shoppingCount = 0,
}) => {
  const t = translations[preferences?.language || 'es'];
  const count = shoppingCount || shoppingItemsCount || 0;

  const handleSelectTab = (tab: NavigationTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (onChangeTab) {
      onChangeTab(tab);
    }
  };

  // Determine which main tab is active if sub-views (household, preferences, account) are active
  const isDashboardActive = activeTab === 'dashboard';
  const isShoppingActive = activeTab === 'shopping';
  const isAIActive = activeTab === 'ai-insights';
  const isProfileActive = activeTab === 'profile' || activeTab === 'preferences' || activeTab === 'household' || activeTab === 'account';

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-40 bg-[#f8f9ff] dark:bg-[#191c20] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] border-t border-[#e1e2e8]/80 dark:border-[#2e3135] h-[72px] pb-[env(safe-area-inset-bottom,0px)] flex items-center justify-around px-2">
      {/* Dashboard */}
      <button
        onClick={() => handleSelectTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl w-20 transition-all duration-200 active:scale-90 ${
          isDashboardActive
            ? 'bg-[#096430] dark:bg-[#004a21] text-[#8dde9d] dark:text-[#a2f5b2] shadow-sm font-semibold'
            : 'text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135]'
        }`}
      >
        <span
          className={`material-symbols-outlined mb-0.5 text-[24px] ${
            isDashboardActive ? 'fill-icon' : ''
          }`}
          data-icon="dashboard"
        >
          dashboard
        </span>
        <span className="text-[11px] leading-tight font-medium">
          {t.nav.dashboard}
        </span>
      </button>

      {/* Compras */}
      <button
        onClick={() => handleSelectTab('shopping')}
        className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl w-20 transition-all duration-200 active:scale-90 ${
          isShoppingActive
            ? 'bg-[#096430] dark:bg-[#004a21] text-[#8dde9d] dark:text-[#a2f5b2] shadow-sm font-semibold'
            : 'text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135]'
        }`}
      >
        <span
          className={`material-symbols-outlined mb-0.5 text-[24px] ${
            isShoppingActive ? 'fill-icon' : ''
          }`}
          data-icon="shopping_cart"
        >
          shopping_cart
        </span>
        <span className="text-[11px] leading-tight font-medium">
          {t.nav.shopping}
        </span>
        {count > 0 && !isShoppingActive && (
          <span className="absolute top-1 right-3 w-4 h-4 bg-[#ff7a2b] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Chef & Recetas IA */}
      <button
        onClick={() => handleSelectTab('ai-insights')}
        className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl w-20 transition-all duration-200 active:scale-90 ${
          isAIActive
            ? 'bg-[#096430] dark:bg-[#004a21] text-[#8dde9d] dark:text-[#a2f5b2] shadow-sm font-semibold'
            : 'text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135]'
        }`}
      >
        <span
          className={`material-symbols-outlined mb-0.5 text-[24px] ${
            isAIActive ? 'fill-icon' : ''
          }`}
          data-icon="skillet"
        >
          skillet
        </span>
        <span className="text-[11px] leading-tight font-medium truncate max-w-full">
          {t.nav.aiInsights}
        </span>
        <span className="absolute -top-0.5 right-2 px-1 py-0.2 bg-[#003d87] dark:bg-[#a8c7fa] text-white dark:text-[#003d87] text-[8px] font-bold rounded-full uppercase">
          Chef
        </span>
      </button>

      {/* Perfil */}
      <button
        onClick={() => handleSelectTab('profile')}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl w-20 transition-all duration-200 active:scale-90 ${
          isProfileActive
            ? 'bg-[#096430] dark:bg-[#004a21] text-[#8dde9d] dark:text-[#a2f5b2] shadow-sm font-semibold'
            : 'text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135]'
        }`}
      >
        <span
          className={`material-symbols-outlined mb-0.5 text-[24px] ${
            isProfileActive ? 'fill-icon' : ''
          }`}
          data-icon="person"
        >
          person
        </span>
        <span className="text-[11px] leading-tight font-medium">
          {t.nav.profile}
        </span>
      </button>
    </nav>
  );
};

