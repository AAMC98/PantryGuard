import React from 'react';

export interface PickerOption {
  value: string;
  label: string;
  icon?: string;
  subtitle?: string;
  badge?: string;
}

interface CustomPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: PickerOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export const CustomPickerModal: React.FC<CustomPickerModalProps> = ({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}) => {
  if (!isOpen) return null;

  const handleSelectOption = (value: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    } catch {}
    onSelect(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-[3px] animate-in fade-in duration-200">
      {/* Backdrop overlay touch to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Picker Bottom Sheet / Dialog */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#1a1d21] rounded-t-[28px] sm:rounded-[28px] shadow-[0_-8px_32px_rgba(0,0,0,0.3)] sm:shadow-2xl border-t sm:border border-[#e1e2e8] dark:border-[#2e3135] max-h-[82vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Grab indicator handle on mobile */}
        <div className="w-12 h-1.5 bg-[#bfc9bd] dark:bg-[#404940] rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#e1e2e8] dark:border-[#2e3135] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#191c20] dark:text-[#f8f9ff]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#707a6f] dark:text-[#bfc9bd] hover:bg-[#f2f3f9] dark:hover:bg-[#2e3135] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Options List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex flex-col gap-1.5 no-scrollbar pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          {options.map((opt) => {
            const isSelected = opt.value === selectedValue;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectOption(opt.value)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#096430]/10 dark:bg-[#87d897]/15 border-2 border-[#004a21] dark:border-[#87d897] font-semibold text-[#004a21] dark:text-[#87d897]'
                    : 'bg-[#f8f9ff] dark:bg-[#24272c] border border-transparent hover:bg-[#eef1f6] dark:hover:bg-[#2b3036] text-[#191c20] dark:text-[#f8f9ff]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {opt.icon && (
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#004a21] text-[#a2f5b2]'
                          : 'bg-white dark:bg-[#1a1d21] text-[#404940] dark:text-[#bfc9bd] shadow-xs'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {opt.icon}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate leading-tight">
                      {opt.label}
                    </span>
                    {opt.subtitle && (
                      <span className="text-[11px] text-[#707a6f] dark:text-[#bfc9bd] truncate mt-0.5">
                        {opt.subtitle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {opt.badge && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#505a50] dark:text-[#a0aaa0]">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected ? (
                    <span className="material-symbols-outlined text-[22px] text-[#004a21] dark:text-[#87d897]">
                      check_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px] text-transparent">
                      radio_button_unchecked
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
