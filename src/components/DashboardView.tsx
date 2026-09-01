import React, { useState } from 'react';
import { Product, ProductCategory, StorageLocation, UserPreferences, UserProfile } from '../types';
import { calculateProductStatus } from '../utils/barcodeService';
import { translations } from '../utils/i18n';
import { exportInventoryPDF } from '../utils/pdfExport';

interface DashboardViewProps {
  products: Product[];
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onOpenScanner: () => void;
  onOpenReceiptScanner?: () => void;
  onCookSmartRecipes?: () => void;
  onDeleteProduct?: (id: string) => void;
  user: UserProfile;
  preferences: UserPreferences;
  onShowToast: (message: string) => void;
}

type FilterTab = 'actual' | 'expiring' | 'expired' | 'all';
type SortOption = 'date' | 'name' | 'qty';

export const DashboardView: React.FC<DashboardViewProps> = ({
  products = [],
  onOpenAddModal,
  onOpenEditModal,
  onOpenScanner,
  onOpenReceiptScanner,
  onCookSmartRecipes,
  onDeleteProduct,
  user,
  preferences,
  onShowToast,
}) => {
  const t = translations[preferences?.language || 'es'];
  const lang = preferences?.language || 'es';
  const safeProducts = Array.isArray(products) ? products : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | 'all'>('all');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Helper to pick standard icon for product
  const getProductIcon = (p: Product) => {
    const { status } = calculateProductStatus(p.expiryDate, preferences.expiryAlertDays);
    if (status === 'expired') return 'warning';

    const nameLower = p.name.toLowerCase();
    if (nameLower.includes('leche') || nameLower.includes('agua') || nameLower.includes('jugo') || p.category === 'bebidas') {
      return 'water_drop';
    }
    if (nameLower.includes('huevo') || nameLower.includes('egg')) {
      return 'egg';
    }
    if (nameLower.includes('arroz') || nameLower.includes('rice') || nameLower.includes('sopa')) {
      return 'rice_bowl';
    }
    if (nameLower.includes('avena') || nameLower.includes('cereal') || nameLower.includes('trigo') || p.category === 'granos') {
      return 'grain';
    }
    if (nameLower.includes('manzana') || nameLower.includes('fruta') || p.category === 'frutas') {
      return 'nutrition';
    }
    if (nameLower.includes('yogurt') || nameLower.includes('queso') || p.category === 'lacteos') {
      return 'lunch_dining';
    }
    if (p.category === 'verduras') {
      return 'eco';
    }
    if (p.category === 'proteinas') {
      return 'restaurant';
    }
    return status === 'expiring' ? 'schedule' : 'kitchen';
  };

  // Filter products
  const filteredProducts = safeProducts.filter((p) => {
    const { status } = calculateProductStatus(p.expiryDate, preferences.expiryAlertDays);

    // Tab filter
    if (activeFilterTab === 'actual' && status !== 'fresh') return false;
    if (activeFilterTab === 'expiring' && status !== 'expiring') return false;
    if (activeFilterTab === 'expired' && status !== 'expired') return false;

    // Category filter
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

    // Location filter
    if (selectedLocation !== 'all' && p.location !== selectedLocation) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = (t.categories[p.category] || p.category).toLowerCase().includes(q);
      const matchLoc = (t.locations[p.location] || p.location).toLowerCase().includes(q);
      const matchBarcode = (p.barcode || '').includes(q);
      if (!matchName && !matchCat && !matchLoc && !matchBarcode) return false;
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'qty') {
      return b.quantity - a.quantity;
    }
    // Default 'date' (expiry date soonest / most past first)
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  const handleExportPDF = () => {
    exportInventoryPDF(safeProducts, user, preferences);
    onShowToast(lang === 'es' ? 'Descargando PDF del inventario...' : 'Downloading pantry PDF...');
  };

  const getSectionTitle = () => {
    if (searchQuery.trim()) {
      return `${t.dashboard.searchResultsTitle} ${t.dashboard.productCount(sortedProducts.length)}`;
    }
    if (activeFilterTab === 'actual') {
      return `${t.dashboard.tabs.actual} ${t.dashboard.productCount(sortedProducts.length)}`;
    }
    if (activeFilterTab === 'expiring') {
      return `${t.dashboard.tabs.expiringSoon} ${t.dashboard.productCount(sortedProducts.length)}`;
    }
    if (activeFilterTab === 'expired') {
      return `${t.dashboard.tabs.expired} ${t.dashboard.productCount(sortedProducts.length)}`;
    }
    return `${t.dashboard.tabs.all} ${t.dashboard.productCount(sortedProducts.length)}`;
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      {/* Search Bar & Quick Action */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707a6f] dark:text-[#bfc9bd] pointer-events-none text-[22px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.dashboard.searchPlaceholder}
            className="w-full pl-11 pr-10 py-3 rounded-full border border-[#707a6f]/60 dark:border-[#404940] bg-white dark:bg-[#1e2124] text-[#191c20] dark:text-[#f8f9ff] text-sm focus:outline-none focus:ring-2 focus:ring-[#003d87] focus:border-[#003d87] shadow-sm transition-all h-12"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707a6f] hover:text-[#191c20] dark:hover:text-white p-1"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Real Barcode Scanner Trigger Button */}
        <button
          onClick={onOpenScanner}
          title={t.scanner.title}
          className="h-12 w-12 rounded-full bg-[#004a21] hover:bg-[#096430] active:scale-95 text-white flex items-center justify-center shadow-sm shrink-0 transition-transform"
        >
          <span className="material-symbols-outlined text-[24px]">barcode_scanner</span>
        </button>

        {/* OCR Receipt Scanner Button */}
        {onOpenReceiptScanner && (
          <button
            onClick={onOpenReceiptScanner}
            title={lang === 'es' ? 'Escanear Ticket de Compra' : 'Scan Grocery Receipt'}
            className="h-12 w-12 rounded-full bg-[#87d897] hover:bg-[#68c77b] active:scale-95 text-[#00210b] flex items-center justify-center shadow-sm shrink-0 transition-transform"
          >
            <span className="material-symbols-outlined text-[24px]">receipt_long</span>
          </button>
        )}

        {/* PDF Export Button */}
        <button
          onClick={handleExportPDF}
          title={t.dashboard.exportPdf}
          className="h-12 w-12 rounded-full bg-white dark:bg-[#1e2124] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135] border border-[#707a6f]/40 text-[#004a21] dark:text-[#87d897] flex items-center justify-center shadow-sm shrink-0 transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
        </button>
      </div>

      {/* "Cocina con lo que tienes" Quick Smart Recipe Shortcut Banner */}
      {onCookSmartRecipes && (
        <div className="bg-gradient-to-r from-[#004a21] via-[#096430] to-[#003d87] text-white p-3.5 sm:p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">skillet</span>
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm">
                {lang === 'es' ? '🍳 Cocina con lo que tienes' : '🍳 Cook with what you have'}
              </h3>
              <p className="text-[11px] text-white/80">
                {lang === 'es'
                  ? 'Genera recetas inteligentes al instante con tus productos próximos a caducar'
                  : 'AI recipes tailored to your near-expiry pantry staples'}
              </p>
            </div>
          </div>
          <button
            onClick={onCookSmartRecipes}
            className="self-end sm:self-center px-3.5 py-1.5 rounded-full bg-white text-[#004a21] hover:bg-[#f8f9ff] font-bold text-xs shadow transition-transform active:scale-95 whitespace-nowrap flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span>{lang === 'es' ? 'Ver Recetas' : 'Generate Recipes'}</span>
          </button>
        </div>
      )}

      {/* Horizontal Tabs: Actual | Próximo a Caducar | Caducados | Todos */}
      <div className="relative -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveFilterTab('actual')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
              activeFilterTab === 'actual'
                ? 'bg-[#004a21] text-white border-[#004a21] shadow-sm'
                : 'bg-[#f2f3f9] dark:bg-[#1e2124] text-[#404940] dark:text-[#bfc9bd] border-[#bfc9bd]/70 dark:border-[#404940] hover:bg-[#e1e2e8]'
            }`}
          >
            {t.dashboard.tabs.actual}
          </button>

          <button
            onClick={() => setActiveFilterTab('expiring')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
              activeFilterTab === 'expiring'
                ? 'bg-[#004a21] text-white border-[#004a21] shadow-sm'
                : 'bg-[#f2f3f9] dark:bg-[#1e2124] text-[#404940] dark:text-[#bfc9bd] border-[#bfc9bd]/70 dark:border-[#404940] hover:bg-[#e1e2e8]'
            }`}
          >
            {t.dashboard.tabs.expiringSoon}
          </button>

          <button
            onClick={() => setActiveFilterTab('expired')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
              activeFilterTab === 'expired'
                ? 'bg-[#004a21] text-white border-[#004a21] shadow-sm'
                : 'bg-[#f2f3f9] dark:bg-[#1e2124] text-[#404940] dark:text-[#bfc9bd] border-[#bfc9bd]/70 dark:border-[#404940] hover:bg-[#e1e2e8]'
            }`}
          >
            {t.dashboard.tabs.expired}
          </button>

          <button
            onClick={() => setActiveFilterTab('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
              activeFilterTab === 'all'
                ? 'bg-[#004a21] text-white border-[#004a21] shadow-sm'
                : 'bg-[#f2f3f9] dark:bg-[#1e2124] text-[#404940] dark:text-[#bfc9bd] border-[#bfc9bd]/70 dark:border-[#404940] hover:bg-[#e1e2e8]'
            }`}
          >
            {t.dashboard.tabs.all}
          </button>
        </div>
      </div>

      {/* Section Title and Filter/Sort Menu */}
      <div className="flex justify-between items-center relative pt-1">
        <h2 className="font-bold text-base text-[#191c20] dark:text-[#f8f9ff]">
          {getSectionTitle()}
        </h2>

        <div className="relative">
          <button
            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
            className="text-[#003d87] dark:text-[#aec6ff] text-xs font-semibold hover:underline flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-[#e1e2e8]/50 dark:hover:bg-[#2e3135]"
          >
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            <span>{t.dashboard.filterAndSort}</span>
            <span className="bg-[#003d87] dark:bg-[#0353b3] text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {sortBy === 'date' ? '1' : '2'}
            </span>
          </button>

          {/* Sort Menu Dropdown */}
          {isSortMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsSortMenuOpen(false)}
              ></div>
              <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-[#1e2124] rounded-xl shadow-xl border border-[#bfc9bd] dark:border-[#404940] z-30 overflow-hidden py-1">
                <div className="px-3 py-1.5 text-[11px] font-bold text-[#707a6f] uppercase tracking-wider border-b border-[#e1e2e8] dark:border-[#2e3135]">
                  {lang === 'es' ? 'Ordenar por' : 'Sort by'}
                </div>
                <button
                  onClick={() => {
                    setSortBy('date');
                    setIsSortMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    sortBy === 'date'
                      ? 'bg-[#f2f3f9] dark:bg-[#2e3135] text-[#004a21] dark:text-[#87d897] font-semibold'
                      : 'text-[#191c20] dark:text-[#f8f9ff] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135]'
                  }`}
                >
                  <span>{t.dashboard.sortExpiry}</span>
                  {sortBy === 'date' && (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSortBy('name');
                    setIsSortMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    sortBy === 'name'
                      ? 'bg-[#f2f3f9] dark:bg-[#2e3135] text-[#004a21] dark:text-[#87d897] font-semibold'
                      : 'text-[#191c20] dark:text-[#f8f9ff] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135]'
                  }`}
                >
                  <span>{t.dashboard.sortName}</span>
                  {sortBy === 'name' && (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSortBy('qty');
                    setIsSortMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    sortBy === 'qty'
                      ? 'bg-[#f2f3f9] dark:bg-[#2e3135] text-[#004a21] dark:text-[#87d897] font-semibold'
                      : 'text-[#191c20] dark:text-[#f8f9ff] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135]'
                  }`}
                >
                  <span>{t.dashboard.sortQty}</span>
                  {sortBy === 'qty' && (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bento Grid / Product Cards */}
      {sortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sortedProducts.map((p) => {
            const { status, displayText, borderColor, dotColor, badgeBg, badgeText } =
              calculateProductStatus(p.expiryDate, preferences.expiryAlertDays);

            const iconName = getProductIcon(p);

            return (
              <div
                key={p.id}
                onClick={() => onOpenEditModal(p)}
                className={`bg-white dark:bg-[#1e2124] rounded-xl border-l-4 ${borderColor} shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] p-3.5 flex items-center gap-3.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all cursor-pointer group relative overflow-hidden active:scale-[0.99]`}
              >
                {/* Left Icon Square */}
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${
                    status === 'expired'
                      ? 'bg-[#ffdad6] dark:bg-[#93000a]/30 text-[#ba1a1a] dark:text-[#ffb4ab]'
                      : status === 'expiring'
                      ? 'bg-[#ffdbcb] dark:bg-[#612500]/30 text-[#9f4200] dark:text-[#ffb692]'
                      : 'bg-[#f2f3f9] dark:bg-[#2e3135] text-[#004a21] dark:text-[#87d897]'
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl">
                    {iconName}
                  </span>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-semibold text-base text-[#191c20] dark:text-[#f8f9ff] truncate group-hover:text-[#004a21] dark:group-hover:text-[#87d897] transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-[#404940] dark:text-[#bfc9bd] truncate mt-0.5">
                    {p.quantity} {t.units[p.unit] || p.unit} •{' '}
                    {t.locations[p.location] || p.location}
                  </p>

                  {/* Status indicator row */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0 animate-pulse`}></span>
                    <span className={`text-[11px] font-medium ${badgeText} truncate`}>
                      {displayText[lang]}
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Edit & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditModal(p);
                    }}
                    aria-label="Editar"
                    title={lang === 'es' ? 'Editar producto' : 'Edit product'}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#707a6f] dark:text-[#bfc9bd] hover:bg-[#f2f3f9] dark:hover:bg-[#2e3135] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductToDelete(p);
                    }}
                    aria-label="Eliminar"
                    title={lang === 'es' ? 'Eliminar de la despensa' : 'Delete from pantry'}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#ba1a1a]/70 hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 dark:hover:bg-[#93000a]/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-[#1e2124] rounded-2xl border border-dashed border-[#bfc9bd] dark:border-[#404940] mt-2">
          <div className="w-16 h-16 rounded-full bg-[#f2f3f9] dark:bg-[#2e3135] flex items-center justify-center text-[#707a6f] dark:text-[#bfc9bd] mb-3">
            <span className="material-symbols-outlined text-3xl">inbox</span>
          </div>
          <h3 className="font-semibold text-base text-[#191c20] dark:text-[#f8f9ff] mb-1">
            {t.dashboard.noProducts}
          </h3>
          <p className="text-xs text-[#404940] dark:text-[#bfc9bd] max-w-xs mb-4">
            {searchQuery
              ? 'Prueba con otro término de búsqueda o limpia el filtro.'
              : 'Agrega alimentos escaneando el código de barras o registrándolos manualmente.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-5 py-2.5 bg-[#004a21] hover:bg-[#096430] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>{t.dashboard.addProduct}</span>
          </button>
        </div>
      )}

      {/* Floating Action Button (FAB) for Adding Product */}
      <button
        onClick={onOpenAddModal}
        aria-label={t.dashboard.addProduct}
        className="fixed bottom-[88px] right-4 md:right-8 w-14 h-14 bg-[#004a21] hover:bg-[#096430] active:scale-90 text-white rounded-2xl shadow-[0_4px_18px_rgba(0,74,33,0.35)] flex items-center justify-center z-30 transition-all"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div
          aria-modal="true"
          role="dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setProductToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1e2124] rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-[#e1e2e8] dark:border-[#404940] flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-150"
          >
            <div className="w-14 h-14 rounded-full bg-[#ffdad6] dark:bg-[#93000a]/30 flex items-center justify-center text-[#ba1a1a] dark:text-[#ffb4ab] mb-1">
              <span className="material-symbols-outlined text-[30px]">delete_forever</span>
            </div>

            <h3 className="text-lg font-bold text-[#191c20] dark:text-[#f8f9ff]">
              {t.dashboard.deleteProductTitle}
            </h3>

            <p className="text-xs text-[#404940] dark:text-[#bfc9bd] leading-relaxed">
              {t.dashboard.deleteProductConfirm(productToDelete.name)}
            </p>

            <div className="flex gap-2 w-full mt-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 bg-[#eceef3] dark:bg-[#2e3135] hover:bg-[#e1e2e8] dark:hover:bg-[#404940] text-[#191c20] dark:text-white text-xs font-semibold rounded-full transition-colors"
              >
                {t.dashboard.cancelAction}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onDeleteProduct) {
                    onDeleteProduct(productToDelete.id);
                  }
                  setProductToDelete(null);
                }}
                className="flex-1 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] active:scale-95 text-white text-xs font-semibold rounded-full shadow-sm flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{t.dashboard.deleteAction}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
