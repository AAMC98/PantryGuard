import React from 'react';
import { PantryNotification, UserPreferences } from '../types';
import { translations } from '../utils/i18n';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PantryNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onSelectProduct?: (productId: string) => void;
  preferences: UserPreferences;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
  onClearAll,
  onSelectProduct,
  preferences,
}) => {
  const t = translations[preferences?.language || 'es'];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] animate-in fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
      ></div>

      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#191c20] h-full shadow-2xl flex flex-col border-l border-[#e1e2e8] dark:border-[#2e3135] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#e1e2e8] dark:border-[#2e3135] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004a21] dark:text-[#87d897]">
              notifications
            </span>
            <h3 className="font-bold text-base text-[#191c20] dark:text-[#f8f9ff]">
              Notificaciones
            </h3>
            <span className="text-xs bg-[#096430] text-[#a2f5b2] px-2 py-0.5 rounded-full font-semibold">
              {safeNotifications.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {safeNotifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-[#ba1a1a] hover:underline px-2 py-1"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#707a6f] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {safeNotifications.length > 0 ? (
            safeNotifications.map((n) => {
              const isError = n.type === 'error';
              const isWarning = n.type === 'warning';

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    onMarkAsRead(n.id);
                    if (n.productId && onSelectProduct) {
                      onSelectProduct(n.productId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-[#f8f9ff] dark:bg-[#1e2124] border-[#e1e2e8] dark:border-[#2e3135] opacity-75'
                      : isError
                      ? 'bg-[#ffdad6]/40 dark:bg-[#93000a]/20 border-[#ba1a1a]/40 shadow-sm'
                      : isWarning
                      ? 'bg-[#ffdbcb]/40 dark:bg-[#612500]/20 border-[#ff7a2b]/40 shadow-sm'
                      : 'bg-white dark:bg-[#1e2124] border-[#004a21]/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${
                        isError
                          ? 'text-[#ba1a1a]'
                          : isWarning
                          ? 'text-[#9f4200]'
                          : 'text-[#004a21] dark:text-[#87d897]'
                      }`}
                    >
                      {isError ? 'warning' : isWarning ? 'schedule' : 'info'}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-semibold text-xs text-[#191c20] dark:text-[#f8f9ff]">
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-[#707a6f] shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#404940] dark:text-[#bfc9bd] mt-0.5 leading-snug">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-[#707a6f]">
              <span className="material-symbols-outlined text-4xl mb-2">
                notifications_none
              </span>
              <p className="text-xs">No tienes notificaciones pendientes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
