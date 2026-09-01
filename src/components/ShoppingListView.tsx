import React, { useState } from 'react';
import { ProductCategory, ShoppingItem, UnitType, UserPreferences, UserProfile } from '../types';
import { translations } from '../utils/i18n';
import { exportShoppingListPDF } from '../utils/pdfExport';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onAddItem: (item: Omit<ShoppingItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
  user: UserProfile;
  preferences: UserPreferences;
  onShowToast: (message: string) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items = [],
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onClearCompleted,
  user,
  preferences,
  onShowToast,
}) => {
  const t = translations[preferences?.language || 'es'];
  const lang = preferences?.language || 'es';
  const safeItems = Array.isArray(items) ? items : [];

  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [newCustomItemName, setNewCustomItemName] = useState('');
  const [newCustomCategory, setNewCustomCategory] = useState<ProductCategory>('otros');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const categories: (ProductCategory | 'all')[] = [
    'all',
    'lacteos',
    'frutas',
    'proteinas',
    'granos',
    'verduras',
    'bebidas',
  ];

  const filteredItems = safeItems.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomItemName.trim()) return;

    onAddItem({
      name: newCustomItemName.trim(),
      category: newCustomCategory,
      quantity: 1,
      unit: 'unidades',
      checked: true,
      reason: 'manual',
    });

    setNewCustomItemName('');
    onShowToast(lang === 'es' ? '¡Producto añadido a la lista!' : 'Product added to list!');
  };

  const handleDeleteItem = (id: string, name: string) => {
    onRemoveItem(id);
    onShowToast(lang === 'es' ? `"${name}" eliminado de la lista` : `"${name}" removed from shopping list`);
  };

  const handleExportPDF = () => {
    exportShoppingListPDF(items, user, preferences);
    onShowToast(lang === 'es' ? 'Descargando lista de compras en PDF...' : 'Downloading shopping list PDF...');
  };

  const handleShareList = () => {
    const textList = items
      .map((it) => `${it.checked ? '✅' : '⬜'} ${it.name} - ${it.quantity} ${t.units[it.unit] || it.unit}`)
      .join('\n');

    if (navigator.share) {
      navigator
        .share({
          title: 'Pantry Guard - Lista de Compras',
          text: `Lista de Compras de ${user.householdName}:\n\n${textList}`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(textList);
      onShowToast(lang === 'es' ? 'Lista copiada al portapapeles' : 'List copied to clipboard');
    }
  };

  const getItemIcon = (item: ShoppingItem) => {
    if (item.reason === 'expired') return 'warning';
    if (item.name.toLowerCase().includes('huevo') || item.name.toLowerCase().includes('egg')) return 'egg';
    if (item.name.toLowerCase().includes('manzana') || item.name.toLowerCase().includes('apple')) return 'schedule';
    if (item.name.toLowerCase().includes('leche') || item.name.toLowerCase().includes('milk')) return 'warning';
    if (item.name.toLowerCase().includes('arroz') || item.name.toLowerCase().includes('rice')) return 'rice_bowl';
    if (item.name.toLowerCase().includes('avena') || item.name.toLowerCase().includes('oat')) return 'shopping_basket';
    if (item.category === 'frutas') return 'nutrition';
    if (item.category === 'lacteos') return 'lunch_dining';
    if (item.category === 'verduras') return 'eco';
    return 'shopping_basket';
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      {/* Header Context */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-[#191c20] dark:text-[#f8f9ff]">
          {t.shopping.title}
        </h2>
        <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
          {t.shopping.subtitle}
        </p>
      </div>

      {/* Filter / Chips Row */}
      <div className="relative -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {categories.map((cat) => {
            const label = cat === 'all' ? t.shopping.allTab : t.categories[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#004a21] text-white shadow-sm'
                    : 'bg-[#eceef3] dark:bg-[#1e2124] text-[#404940] dark:text-[#bfc9bd] border border-[#bfc9bd]/60 dark:border-[#404940] hover:bg-[#e1e2e8]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shopping List Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5" id="shopping-list">
        {filteredItems.map((item) => {
          const isExpired = item.reason === 'expired';
          const isExpiring = item.reason === 'expiring' || item.reason === 'low_stock';
          const isChecked = item.checked;

          const borderLeftColor = isExpired
            ? 'border-[#ba1a1a]'
            : isExpiring
            ? 'border-[#ff7a2b]'
            : 'border-[#004a21]';

          const iconContainerBg = isExpired
            ? 'bg-[#ffdad6] text-[#ba1a1a]'
            : isExpiring
            ? 'bg-[#ffdbcb] text-[#9f4200]'
            : 'bg-[#eceef3] dark:bg-[#2e3135] text-[#004a21] dark:text-[#87d897]';

          const statusTextColor = isExpired
            ? 'text-[#ba1a1a]'
            : isExpiring
            ? 'text-[#9f4200]'
            : 'text-[#004a21] dark:text-[#87d897]';

          const statusText =
            item.reason === 'expired'
              ? t.shopping.expiredReason
              : item.reason === 'expiring'
              ? t.shopping.expiringReason
              : item.reason === 'low_stock'
              ? t.shopping.lowStockReason
              : t.shopping.addedStatus;

          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-[#1e2124] rounded-xl border-l-4 ${borderLeftColor} shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-3.5 flex items-center justify-between relative overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {/* Icon Container */}
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${iconContainerBg}`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {getItemIcon(item)}
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <h3
                    className={`font-semibold text-sm text-[#191c20] dark:text-[#f8f9ff] truncate ${
                      isChecked ? 'line-through opacity-80' : ''
                    }`}
                  >
                    {item.name}
                  </h3>
                  <p className={`text-[11px] font-medium flex items-center gap-1 mt-0.5 ${statusTextColor}`}>
                    <span className="material-symbols-outlined text-[13px]">
                      {isExpired ? 'error' : isExpiring ? 'update' : 'add_shopping_cart'}
                    </span>
                    <span>{statusText}</span>
                  </p>
                </div>
              </div>

              {/* Quantity & Actions (Check & Delete) */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-xs font-semibold text-[#191c20] dark:text-white bg-[#eceef3] dark:bg-[#2e3135] px-2.5 py-0.5 rounded-md">
                  {item.quantity} {t.units[item.unit] || item.unit}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    aria-label={t.shopping.deleteItem}
                    title={t.shopping.deleteItem}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#ba1a1a]/70 hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 dark:hover:bg-[#93000a]/20 transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                  </button>

                  <button
                    onClick={() => onToggleItem(item.id)}
                    aria-label={isChecked ? 'Comprado' : 'Añadir'}
                    title={isChecked ? 'Marcar pendiente' : 'Marcar comprado'}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                      isChecked
                        ? 'bg-[#004a21] text-white shadow-sm'
                        : 'border border-[#bfc9bd] text-[#707a6f] dark:text-[#bfc9bd] hover:border-[#004a21] hover:text-[#004a21]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isChecked ? 'check' : 'add'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 py-8 px-4 flex flex-col items-center justify-center text-center bg-white dark:bg-[#1e2124] rounded-xl border border-dashed border-[#bfc9bd] dark:border-[#404940]">
            <div className="w-12 h-12 rounded-full bg-[#f2f3f9] dark:bg-[#2e3135] flex items-center justify-center text-[#707a6f] dark:text-[#bfc9bd] mb-2">
              <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            </div>
            <p className="text-xs text-[#404940] dark:text-[#bfc9bd]">
              {t.shopping.emptyList}
            </p>
          </div>
        )}

        {/* Add Custom Item Input Section */}
        <div className="bg-[#eceef3] dark:bg-[#1e2124] rounded-xl p-3 border border-dashed border-[#bfc9bd] dark:border-[#404940] md:col-span-2 lg:col-span-3 mt-1 shadow-sm">
          <form onSubmit={handleAddCustom} className="flex flex-col sm:flex-row items-stretch sm:items-center w-full gap-2.5">
            <div className="flex items-center flex-1 min-w-0 bg-white dark:bg-[#2e3135] rounded-lg px-2.5 py-1.5 border border-[#bfc9bd]/80 dark:border-[#404940] focus-within:border-[#003d87] transition-colors">
              <span className="material-symbols-outlined text-[#707a6f] text-[20px] mr-1.5 shrink-0">
                add_shopping_cart
              </span>
              <input
                type="text"
                value={newCustomItemName}
                onChange={(e) => setNewCustomItemName(e.target.value)}
                placeholder={t.shopping.addItemPlaceholder}
                className="w-full bg-transparent border-none text-xs sm:text-sm text-[#191c20] dark:text-white placeholder:text-[#707a6f] focus:outline-none min-w-0"
              />
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={newCustomCategory}
                onChange={(e) => setNewCustomCategory(e.target.value as ProductCategory)}
                className="text-xs bg-white dark:bg-[#2e3135] text-[#191c20] dark:text-white border border-[#bfc9bd]/80 dark:border-[#404940] rounded-lg px-2.5 py-2 focus:outline-none flex-1 sm:flex-none cursor-pointer"
              >
                <option value="lacteos">{t.categories.lacteos}</option>
                <option value="frutas">{t.categories.frutas}</option>
                <option value="proteinas">{t.categories.proteinas}</option>
                <option value="granos">{t.categories.granos}</option>
                <option value="verduras">{t.categories.verduras}</option>
                <option value="bebidas">{t.categories.bebidas}</option>
                <option value="otros">{t.categories.otros}</option>
              </select>
              
              <button
                type="submit"
                disabled={!newCustomItemName.trim()}
                className="bg-[#003d87] hover:bg-[#0353b3] active:scale-95 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all shrink-0 flex items-center justify-center gap-1 min-w-[78px]"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>{t.shopping.addButton}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Toolbar: Generate List Modal, Export PDF, Clear Completed */}
      <div className="flex flex-wrap gap-2 justify-between items-center mt-2 pt-2 border-t border-[#e1e2e8] dark:border-[#2e3135]">
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-white dark:bg-[#1e2124] hover:bg-[#e1e2e8] border border-[#bfc9bd] rounded-full text-xs font-semibold text-[#004a21] dark:text-[#87d897] flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          <span>{t.shopping.exportPdf}</span>
        </button>

        <div className="flex gap-2">
          {items.some((it) => it.checked) && (
            <button
              onClick={onClearCompleted}
              className="px-3.5 py-2 text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-full font-medium transition-colors"
            >
              {t.shopping.clearCompleted}
            </button>
          )}

          <button
            onClick={() => setIsSuccessModalOpen(true)}
            className="px-5 py-2 bg-[#004a21] hover:bg-[#096430] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">post_add</span>
            <span>{t.shopping.generateList}</span>
          </button>
        </div>
      </div>

      {/* FAB (Mobile action button) */}
      <button
        onClick={() => setIsSuccessModalOpen(true)}
        aria-label={t.shopping.generateList}
        className="fixed right-4 bottom-[88px] w-14 h-14 bg-[#004a21] hover:bg-[#096430] text-white rounded-2xl shadow-[0_4px_18px_rgba(0,74,33,0.35)] flex items-center justify-center z-30 transition-transform active:scale-90 md:hidden"
      >
        <span className="material-symbols-outlined text-[24px]">post_add</span>
      </button>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1e2124] rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-[#e1e2e8] dark:border-[#404940] flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#096430] flex items-center justify-center text-[#8dde9d] mb-1 shadow-sm">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>

            <h3 className="text-xl font-bold text-[#191c20] dark:text-[#f8f9ff]">
              {t.shopping.listGeneratedTitle}
            </h3>

            <p className="text-xs text-[#404940] dark:text-[#bfc9bd] leading-relaxed">
              {t.shopping.listGeneratedDesc}
            </p>

            <div className="flex flex-col gap-2 w-full mt-3">
              <button
                onClick={handleExportPDF}
                className="w-full py-3 bg-[#004a21] hover:bg-[#096430] text-white text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                <span>{t.shopping.exportPdf}</span>
              </button>

              <button
                onClick={handleShareList}
                className="w-full py-2.5 bg-[#eceef3] dark:bg-[#2e3135] hover:bg-[#e1e2e8] text-[#191c20] dark:text-white text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>Compartir / Copiar</span>
              </button>

              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full py-2 text-xs font-medium text-[#707a6f] hover:text-[#191c20] dark:hover:text-white"
              >
                {t.shopping.acceptButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
