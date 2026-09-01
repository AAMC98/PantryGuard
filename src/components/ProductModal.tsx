import React, { useEffect, useState } from 'react';
import { Product, ProductCategory, StorageLocation, UnitType, UserPreferences } from '../types';
import { translations } from '../utils/i18n';
import { lookupBarcode } from '../utils/barcodeService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  onDelete?: (id: string) => void;
  onConsumeProduct?: (product: Product, addToShoppingList: boolean) => void;
  initialProduct?: Product | null;
  onOpenScanner: () => void;
  preferences: UserPreferences;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onConsumeProduct,
  initialProduct,
  onOpenScanner,
  preferences,
}) => {
  const t = translations[preferences.language];

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('lacteos');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<UnitType>('unidades');
  const [location, setLocation] = useState<StorageLocation>('Refrigerador');
  const [expiryDate, setExpiryDate] = useState('');
  const [barcode, setBarcode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleLookupBarcodeManually = async () => {
    if (!barcode.trim()) return;
    setIsSearchingBarcode(true);
    try {
      const result = await lookupBarcode(barcode.trim());
      if (result && result.found) {
        if (result.name) setName(result.name);
        if (result.category) setCategory(result.category);
        if (result.quantity) setQuantity(result.quantity);
        if (result.unit) setUnit(result.unit);
        if (result.location) setLocation(result.location);
        if (result.expiryDate) setExpiryDate(result.expiryDate);
      } else {
        setErrorMsg(preferences.language === 'es' ? 'Código no encontrado en Open Food Facts. Puedes rellenarlo manualmente.' : 'Barcode not found in Open Food Facts. You can fill it manually.');
      }
    } catch {
      // Ignored
    } finally {
      setIsSearchingBarcode(false);
    }
  };

  // Default expiry date: 7 days from today if new
  useEffect(() => {
    if (isOpen) {
      setIsConfirmingDelete(false);
      if (initialProduct) {
        setName(initialProduct.name);
        setCategory(initialProduct.category);
        setQuantity(initialProduct.quantity);
        setUnit(initialProduct.unit);
        setLocation(initialProduct.location || 'Refrigerador');
        setExpiryDate(initialProduct.expiryDate || '');
        setBarcode(initialProduct.barcode || '');
        setNotes(initialProduct.notes || '');
      } else {
        setName('');
        setCategory('lacteos');
        setQuantity(1);
        setUnit(preferences.unitSystem === 'imperial' ? 'lb' : 'unidades');
        setLocation('Refrigerador');
        
        // 7 days ahead default
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setExpiryDate(d.toISOString().split('T')[0]);
        setBarcode('');
        setNotes('');
      }
      setErrorMsg('');
    }
  }, [isOpen, initialProduct, preferences.unitSystem]);

  if (!isOpen) return null;

  const isEditing = !!initialProduct?.id;

  const getUnitConversionHint = (qty: number, u: UnitType): string | null => {
    if (!qty || qty <= 0) return null;
    switch (u) {
      case 'kg':
        return `≈ ${(qty * 2.20462).toFixed(2)} lb`;
      case 'lb':
        return `≈ ${(qty * 0.453592).toFixed(2)} kg (${Math.round(qty * 453.592)} g)`;
      case 'g':
        return qty >= 1000 ? `≈ ${(qty / 1000).toFixed(2)} kg` : `≈ ${(qty * 0.035274).toFixed(2)} oz`;
      case 'oz':
        return `≈ ${(qty * 28.3495).toFixed(1)} g`;
      case 'L':
        return `≈ ${(qty * 33.814).toFixed(1)} fl oz / ${(qty * 0.264172).toFixed(2)} gal`;
      case 'ml':
        return qty >= 1000 ? `≈ ${(qty / 1000).toFixed(2)} L` : `≈ ${(qty * 0.033814).toFixed(1)} fl oz`;
      default:
        return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(t.productModal.validationNameRequired);
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      onSave(
        {
          name: name.trim(),
          category,
          quantity: Number(quantity) || 1,
          unit,
          location,
          expiryDate: expiryDate || new Date().toISOString().split('T')[0],
          barcode: barcode.trim(),
          notes: notes.trim(),
        },
        initialProduct?.id
      );
      setIsSaving(false);
      onClose();
    }, 400);
  };

  const handleConfirmDelete = () => {
    if (initialProduct?.id && onDelete) {
      onDelete(initialProduct.id);
      onClose();
    }
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Bottom Sheet Container */}
      <div className="w-full max-w-[1024px] sm:max-w-md bg-[#f8f9ff] dark:bg-[#191c20] rounded-t-[28px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-[#e1e2e8] dark:border-[#2e3135] animate-in fade-in slide-in-from-bottom duration-200 pb-[env(safe-area-inset-bottom,8px)]">
        {/* Handle for mobile visual cue */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-[#bfc9bd] dark:bg-[#404940] rounded-full"></div>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto flex flex-col gap-5">
          {/* Header */}
          <div className="flex justify-between items-center pb-1 border-b border-[#e1e2e8]/60 dark:border-[#2e3135]">
            <h2 className="text-xl font-bold text-[#191c20] dark:text-[#f8f9ff]">
              {isEditing ? t.productModal.editTitle : t.productModal.addTitle}
            </h2>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-[#404940] dark:text-[#bfc9bd] hover:bg-[#e1e2e8] dark:hover:bg-[#2e3135] transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd]">
                {t.productModal.nameLabel} <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={t.productModal.namePlaceholder}
                className="w-full bg-white dark:bg-[#2e3135] border border-[#707a6f] dark:border-[#404940] rounded-lg px-4 py-2.5 text-sm text-[#191c20] dark:text-white placeholder:text-[#bfc9bd] focus:outline-none focus:border-[#003d87] focus:ring-1 focus:ring-[#003d87] transition-all"
                required
              />
            </div>

            {/* Categoría */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd]">
                {t.productModal.categoryLabel}
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full bg-white dark:bg-[#2e3135] border border-[#707a6f] dark:border-[#404940] rounded-lg px-4 py-2.5 text-sm text-[#191c20] dark:text-white appearance-none focus:outline-none focus:border-[#003d87] focus:ring-1 focus:ring-[#003d87] transition-all pr-10"
                >
                  <option value="lacteos">{t.categories.lacteos}</option>
                  <option value="frutas">{t.categories.frutas}</option>
                  <option value="proteinas">{t.categories.proteinas}</option>
                  <option value="granos">{t.categories.granos}</option>
                  <option value="verduras">{t.categories.verduras}</option>
                  <option value="bebidas">{t.categories.bebidas}</option>
                  <option value="otros">{t.categories.otros}</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707a6f] dark:text-[#bfc9bd]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Cantidad y Unidad Row */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd]">
                    {t.productModal.quantityLabel}
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-white dark:bg-[#2e3135] border border-[#707a6f] dark:border-[#404940] rounded-lg px-4 py-2.5 text-sm text-[#191c20] dark:text-white focus:outline-none focus:border-[#003d87] focus:ring-1 focus:ring-[#003d87] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd]">
                    {t.productModal.unitLabel}
                  </label>
                  <div className="relative">
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as UnitType)}
                      className="w-full bg-white dark:bg-[#2e3135] border border-[#707a6f] dark:border-[#404940] rounded-lg px-4 py-2.5 text-sm text-[#191c20] dark:text-white appearance-none focus:outline-none focus:border-[#003d87] focus:ring-1 focus:ring-[#003d87] transition-all pr-10"
                    >
                      <option value="unidades">{t.units.unidades}</option>
                      {preferences.unitSystem === 'imperial' ? (
                        <>
                          <optgroup label={preferences.language === 'es' ? 'Sistema Imperial' : 'Imperial System'}>
                            <option value="lb">{t.units.lb}</option>
                            <option value="oz">{t.units.oz}</option>
                          </optgroup>
                          <optgroup label={preferences.language === 'es' ? 'Sistema Métrico' : 'Metric System'}>
                            <option value="kg">{t.units.kg}</option>
                            <option value="g">{t.units.g}</option>
                            <option value="L">{t.units.L}</option>
                            <option value="ml">{t.units.ml}</option>
                          </optgroup>
                        </>
                      ) : (
                        <>
                          <optgroup label={preferences.language === 'es' ? 'Sistema Métrico' : 'Metric System'}>
                            <option value="kg">{t.units.kg}</option>
                            <option value="g">{t.units.g}</option>
                            <option value="L">{t.units.L}</option>
                            <option value="ml">{t.units.ml}</option>
                          </optgroup>
                          <optgroup label={preferences.language === 'es' ? 'Sistema Imperial' : 'Imperial System'}>
                            <option value="lb">{t.units.lb}</option>
                            <option value="oz">{t.units.oz}</option>
                          </optgroup>
                        </>
                      )}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707a6f] dark:text-[#bfc9bd]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time unit conversion badge */}
              {getUnitConversionHint(quantity, unit) && (
                <div className="mt-1.5 px-2.5 py-1 bg-[#003d87]/10 dark:bg-[#003d87]/20 border border-[#003d87]/20 rounded-md flex items-center gap-1.5 text-xs text-[#003d87] dark:text-[#a8c7fa]">
                  <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                  <span className="font-medium">
                    {preferences.language === 'es' ? 'Equivalencia aproximada:' : 'Approx. equivalence:'}
                  </span>
                  <span>{getUnitConversionHint(quantity, unit)}</span>
                </div>
              )}
            </div>

            {/* Ubicación */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd]">
                {t.productModal.locationLabel}
              </label>
              <div className="relative">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as StorageLocation)}
                  className="w-full bg-white dark:bg-[#2e3135] border border-[#707a6f] dark:border-[#404940] rounded-lg px-4 py-2.5 text-sm text-[#191c20] dark:text-white appearance-none focus:outline-none focus:border-[#003d87] focus:ring-1 focus:ring-[#003d87] transition-all pr-10"
                >
                  <option value="Refrigerador">{t.locations.Refrigerador}</option>
                  <option value="Alacena">{t.locations.Alacena}</option>
                  <option value="Frutero">{t.locations.Frutero}</option>
                  <option value="Congelador">{t.locations.Congelador}</option>
                  <option value="Despensa">{t.locations.Despensa}</option>
                  <option value="Otro">{t.locations.Otro}</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#707a6f] dark:text-[#bfc9bd]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Fecha de caducidad */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd]">
                {t.productModal.expiryDateLabel}
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-white dark:bg-[#2e3135] border border-[#707a6f] dark:border-[#404940] rounded-lg px-4 py-2.5 text-sm text-[#191c20] dark:text-white focus:outline-none focus:border-[#003d87] focus:ring-1 focus:ring-[#003d87] transition-all"
                required
              />
            </div>

            {/* Código de barras */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd] flex justify-between">
                <span>{t.productModal.barcodeLabel}</span>
                {barcode.trim().length >= 8 && (
                  <button
                    type="button"
                    onClick={handleLookupBarcodeManually}
                    disabled={isSearchingBarcode}
                    className="text-[#004a21] dark:text-[#87d897] hover:underline text-[11px] font-bold flex items-center gap-1"
                  >
                    {isSearchingBarcode ? (
                      <span className="animate-spin material-symbols-outlined text-[12px]">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-[12px]">search</span>
                    )}
                    <span>Autocompletar datos</span>
                  </button>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder={t.productModal.barcodePlaceholder}
                  className="flex-1 bg-white dark:bg-[#2e3135] border border-[#707a6f] dark:border-[#404940] rounded-lg px-4 py-2.5 text-sm text-[#191c20] dark:text-white placeholder:text-[#bfc9bd] focus:outline-none focus:border-[#003d87] focus:ring-1 focus:ring-[#003d87] transition-all"
                />
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="flex-shrink-0 bg-[#e1e2e8] dark:bg-[#2e3135] hover:bg-[#d8dae0] dark:hover:bg-[#404940] text-[#191c20] dark:text-white text-xs font-medium rounded-lg px-3.5 py-2.5 flex items-center gap-1.5 transition-colors border border-[#707a6f]/30"
                >
                  <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                  <span>{t.productModal.scanButton}</span>
                </button>
              </div>
            </div>

            {/* Actions / Buttons */}
            <div className="flex flex-col gap-2.5 mt-2 pt-2">
              {!isConfirmingDelete ? (
                <>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-[#004a21] hover:bg-[#096430] active:scale-98 text-white font-semibold text-sm rounded-full py-3.5 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,74,33,0.18)] transition-all disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <span className="material-symbols-outlined text-[20px] animate-spin">
                          sync
                        </span>
                        <span>{t.productModal.saving}</span>
                      </>
                    ) : (
                      <span>{t.productModal.saveButton}</span>
                    )}
                  </button>

                  {isEditing && (
                    <div className="grid grid-cols-2 gap-2">
                      {onConsumeProduct && initialProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            onConsumeProduct(initialProduct, true);
                            onClose();
                          }}
                          className="py-3 px-3 rounded-full bg-[#003d87]/10 dark:bg-[#003d87]/30 text-[#003d87] dark:text-[#aec6ff] hover:bg-[#003d87]/20 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#003d87]/20"
                        >
                          <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                          <span>{preferences.language === 'es' ? 'Consumido (+ Lista)' : 'Consumed (+ Shop)'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className={`py-3 px-3 rounded-full bg-transparent border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/40 active:scale-98 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                          !onConsumeProduct ? 'col-span-2' : ''
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        <span>{t.productModal.deleteButton}</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3.5 bg-[#ffdad6]/60 dark:bg-[#93000a]/20 border border-[#ba1a1a]/40 rounded-2xl flex flex-col gap-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-[#ba1a1a] dark:text-[#ffb4ab]">
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                    <span className="text-xs font-semibold">{t.productModal.confirmDelete}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="flex-1 bg-white dark:bg-[#2e3135] text-[#191c20] dark:text-white border border-[#bfc9bd] dark:border-[#404940] rounded-full py-2.5 text-xs font-semibold transition-colors hover:bg-[#e1e2e8]"
                    >
                      {translations[preferences.language].dashboard.cancelAction}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="flex-1 bg-[#ba1a1a] hover:bg-[#93000a] active:scale-95 text-white rounded-full py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>{translations[preferences.language].dashboard.deleteAction}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
