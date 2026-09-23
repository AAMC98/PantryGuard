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
  const isSpanish = preferences?.language !== 'en';
  const count = shoppingCount || shoppingItemsCount || 0;

  const handleSelectTab = (tab: NavigationTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (onChangeTab) {
      onChangeTab(tab);
    }
  };

  const isDashboardActive = activeTab === 'dashboard';
  const isShoppingActive = activeTab === 'shopping';
  const isAIActive = activeTab === 'ai-insights';
  const isProfileActive =
    activeTab === 'profile' ||
    activeTab === 'preferences' ||
    activeTab === 'household' ||
    activeTab === 'account';

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-40 bg-white/90 dark:bg-[#16181b]/92 backdrop-blur-xl border-t border-[#e1e2e8]/80 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)] pb-[env(safe-area-inset-bottom,4px)] transition-all">
      <div className="w-full max-w-lg mx-auto flex items-center justify-around px-2 py-1.5 h-16">
        {/* Despensa */}
        <button
          type="button"
          onClick={() => handleSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
            isDashboardActive
              ? 'text-[#004a21] dark:text-[#87d897] font-bold'
              : 'text-[#707a6f] dark:text-[#9ea79e] hover:text-[#191c20] dark:hover:text-white'
          }`}
        >
          <div
            className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${
              isDashboardActive ? 'bg-[#004a21]/12 dark:bg-[#87d897]/18' : 'bg-transparent'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] transition-transform ${
                isDashboardActive ? 'scale-110 font-bold' : ''
              }`}
            >
              grid_view
            </span>
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {isSpanish ? 'Despensa' : 'Pantry'}
          </span>
        </button>

        {/* Compras */}
        <button
          type="button"
          onClick={() => handleSelectTab('shopping')}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
            isShoppingActive
              ? 'text-[#004a21] dark:text-[#87d897] font-bold'
              : 'text-[#707a6f] dark:text-[#9ea79e] hover:text-[#191c20] dark:hover:text-white'
          }`}
        >
          <div
            className={`w-10 h-7 rounded-full flex items-center justify-center relative transition-all ${
              isShoppingActive ? 'bg-[#004a21]/12 dark:bg-[#87d897]/18' : 'bg-transparent'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] transition-transform ${
                isShoppingActive ? 'scale-110 font-bold' : ''
              }`}
            >
              shopping_bag
            </span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff7a2b] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {isSpanish ? 'Compras' : 'Shopping'}
          </span>
        </button>

        {/* Chef IA (Recetas) */}
        <button
          type="button"
          onClick={() => handleSelectTab('ai-insights')}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
            isAIActive
              ? 'text-[#004a21] dark:text-[#87d897] font-bold'
              : 'text-[#707a6f] dark:text-[#9ea79e] hover:text-[#191c20] dark:hover:text-white'
          }`}
        >
          <div
            className={`w-10 h-7 rounded-full flex items-center justify-center relative transition-all ${
              isAIActive ? 'bg-[#004a21]/12 dark:bg-[#87d897]/18' : 'bg-transparent'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] transition-transform ${
                isAIActive ? 'scale-110 font-bold' : ''
              }`}
            >
              skillet
            </span>
            <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-gradient-to-r from-[#004a21] to-[#003d87] text-[#87d897] text-[8px] font-black rounded-full shadow-sm">
              IA
            </span>
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {isSpanish ? 'Chef IA' : 'Chef AI'}
          </span>
        </button>

        {/* Perfil */}
        <button
          type="button"
          onClick={() => handleSelectTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
            isProfileActive
              ? 'text-[#004a21] dark:text-[#87d897] font-bold'
              : 'text-[#707a6f] dark:text-[#9ea79e] hover:text-[#191c20] dark:hover:text-white'
          }`}
        >
          <div
            className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${
              isProfileActive ? 'bg-[#004a21]/12 dark:bg-[#87d897]/18' : 'bg-transparent'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] transition-transform ${
                isProfileActive ? 'scale-110 font-bold' : ''
              }`}
            >
              person
            </span>
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {isSpanish ? 'Perfil' : 'Profile'}
          </span>
        </button>
      </div>
    </nav>
  );
};
