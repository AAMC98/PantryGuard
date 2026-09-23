import React, { useState, useRef } from 'react';
import { ProductCategory, StorageLocation, UnitType, UserPreferences } from '../types';
import { apiUrl } from '../utils/apiConfig';

export interface ReceiptParsedItem {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: UnitType;
  location: StorageLocation;
  expiryDate: string;
  selected: boolean;
}

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProducts?: (
    items: Array<{
      name: string;
      category: ProductCategory;
      quantity: number;
      unit: UnitType;
      location: StorageLocation;
      expiryDate: string;
    }>
  ) => void;
  onImportProducts?: (
    items: Array<{
      name: string;
      category: ProductCategory;
      quantity: number;
      unit: UnitType;
      location: StorageLocation;
      expiryDate: string;
    }>
  ) => void;
  preferences: UserPreferences;
  onShowToast: (msg: string) => void;
}

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({
  isOpen,
  onClose,
  onAddProducts,
  onImportProducts,
  preferences,
  onShowToast,
}) => {
  const isSpanish = preferences.language !== 'en';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [storeName, setStoreName] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<ReceiptParsedItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      setImagePreview(base64Url);
      await analyzeReceipt(base64Url, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const analyzeReceipt = async (base64Url: string, mimeType: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setParsedItems([]);

    try {
      const response = await fetch(apiUrl('/api/ai/scan-receipt'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Url,
          mimeType,
          language: preferences.language || 'es',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      if (json.success && json.data) {
        setStoreName(json.data.storeName || '');
        const items = json.data.items || [];
        
        if (items.length === 0) {
          setErrorMsg(
            isSpanish
              ? 'No se pudieron detectar productos con claridad en el ticket. Intenta con una foto más clara y bien iluminada.'
              : 'Could not clearly recognize products on the receipt. Please try with a clearer photo.'
          );
        } else {
          const formatted: ReceiptParsedItem[] = items.map((item: any, idx: number) => {
            const exp = new Date();
            exp.setDate(exp.getDate() + (item.estimatedExpiryDays || 7));
            return {
              id: `rec-item-${idx}-${Date.now()}`,
              name: item.name || 'Producto',
              category: (item.category as ProductCategory) || 'otros',
              quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
              unit: (item.unit as UnitType) || 'unidades',
              location: (item.location as StorageLocation) || 'Refrigerador',
              expiryDate: exp.toISOString().split('T')[0],
              selected: true,
            };
          });
          setParsedItems(formatted);
          onShowToast(
            isSpanish
              ? `¡Se detectaron ${formatted.length} productos del ticket!`
              : `Found ${formatted.length} products on receipt!`
          );
        }
      } else {
        throw new Error(json.error || 'Error parsing receipt');
      }
    } catch (err: any) {
      console.warn('Receipt scan failed:', err);
      setErrorMsg(
        isSpanish
          ? 'Hubo un inconveniente analizando la foto. Verifica que el ticket esté estirado y bien enfocado.'
          : 'Failed to analyze receipt photo. Make sure the ticket is flat and in focus.'
      );
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleItem = (id: string) => {
    setParsedItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleUpdateItem = (id: string, field: keyof ReceiptParsedItem, value: any) => {
    setParsedItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleImportSelected = () => {
    const selected = parsedItems.filter((it) => it.selected && it.name.trim().length > 0);
    if (selected.length === 0) {
      onShowToast(isSpanish ? 'Selecciona al menos un producto' : 'Select at least one product');
      return;
    }

    const importer = onImportProducts || onAddProducts;
    if (importer) {
      importer(
        selected.map((it) => ({
          name: it.name.trim(),
          category: it.category,
          quantity: Number(it.quantity) || 1,
          unit: it.unit,
          location: it.location,
          expiryDate: it.expiryDate,
        }))
      );
    }

    onShowToast(
      isSpanish
        ? `¡${selected.length} productos agregados a la despensa!`
        : `Added ${selected.length} products to pantry!`
    );
    handleClose();
  };

  const handleClose = () => {
    setImagePreview(null);
    setParsedItems([]);
    setErrorMsg(null);
    setStoreName('');
    onClose();
  };

  const selectedCount = parsedItems.filter((i) => i.selected).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#f8f9ff] dark:bg-[#191c20] w-full max-w-xl rounded-[28px] border border-[#e1e2e8] dark:border-[#2e3135] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e1e2e8] dark:border-[#2e3135] flex justify-between items-center bg-white dark:bg-[#1e2124]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#004a21]/10 text-[#004a21] dark:text-[#87d897] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#191c20] dark:text-white">
                {isSpanish ? 'Escanear Ticket de Compra' : 'Scan Grocery Receipt'}
              </h3>
              <p className="text-xs text-[#707a6f] dark:text-[#bfc9bd]">
                {isSpanish
                  ? 'La IA lee los artículos de tu ticket y los ingresa de golpe'
                  : 'AI extracts products from your grocery ticket automatically'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#707a6f] hover:bg-[#f2f3f9] dark:hover:bg-[#2e3135]"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {/* Direct Camera Capture input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Gallery file upload input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {!imagePreview && !isAnalyzing && parsedItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-[#bfc9bd] dark:border-[#404940] rounded-2xl bg-white dark:bg-[#1e2124]">
              <div className="w-16 h-16 rounded-full bg-[#004a21]/10 text-[#004a21] dark:text-[#87d897] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-4xl">document_scanner</span>
              </div>
              <h4 className="font-bold text-base text-[#191c20] dark:text-white mb-1">
                {isSpanish ? 'Toma o sube una foto de tu ticket' : 'Take or upload a photo of your receipt'}
              </h4>
              <p className="text-xs text-[#707a6f] dark:text-[#bfc9bd] max-w-sm mb-5 leading-relaxed">
                {isSpanish
                  ? 'Asegúrate de que la lista de productos y cantidades esté visible e iluminada para máxima precisión con IA.'
                  : 'Make sure the items and quantities are clearly visible and well-lit.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-3 px-4 rounded-full bg-[#004a21] hover:bg-[#096430] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                  <span>{isSpanish ? 'Tomar Foto' : 'Take Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 px-4 rounded-full bg-[#e1e2e8] dark:bg-[#404940] hover:bg-[#bfc9bd]/50 text-[#191c20] dark:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_library</span>
                  <span>{isSpanish ? 'Galería' : 'Gallery'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Analyzing State */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-[#1e2124] rounded-2xl border border-[#e1e2e8] dark:border-[#2e3135]">
              <div className="w-14 h-14 rounded-2xl bg-[#004a21] text-white flex items-center justify-center mb-3 shadow-lg animate-pulse">
                <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
              </div>
              <h4 className="font-bold text-sm sm:text-base text-[#191c20] dark:text-white mb-1">
                {isSpanish ? 'Analizando ticket con Gemini Vision...' : 'Analyzing ticket with Gemini Vision...'}
              </h4>
              <p className="text-xs text-[#707a6f] dark:text-[#bfc9bd]">
                {isSpanish
                  ? 'Extrayendo productos, corrigiendo nombres y estimando caducidades...'
                  : 'Extracting products, clarifying abbreviations and calculating shelf lives...'}
              </p>
            </div>
          )}

          {errorMsg && !isAnalyzing && (
            <div className="p-3.5 rounded-xl bg-[#ffdad6]/60 border border-[#ba1a1a]/30 text-[#93000a] dark:text-[#ffb4ab] text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
              <div className="flex-1">
                <p className="font-semibold">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 font-bold underline hover:opacity-80 block"
                >
                  {isSpanish ? 'Intentar con otra foto' : 'Try another photo'}
                </button>
              </div>
            </div>
          )}

          {/* Parsed Items List */}
          {parsedItems.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-[#191c20] dark:text-white">
                    {storeName ? `${storeName} • ` : ''}
                    {parsedItems.length} {isSpanish ? 'productos detectados' : 'items detected'}
                  </span>
                  <p className="text-[11px] text-[#707a6f] dark:text-[#bfc9bd]">
                    {isSpanish
                      ? 'Revisa y desmarca los que no desees guardar:'
                      : 'Review items and uncheck any you do not want to add:'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-[#004a21] dark:text-[#87d897] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>{isSpanish ? 'Otra foto' : 'Retake'}</span>
                </button>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {parsedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      item.selected
                        ? 'bg-white dark:bg-[#1e2124] border-[#004a21]/40 dark:border-[#87d897]/40 shadow-sm'
                        : 'bg-[#f2f3f9]/50 dark:bg-[#191c20] border-[#e1e2e8] dark:border-[#2e3135] opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItem(item.id)}
                        className="mt-1 w-4 h-4 rounded text-[#004a21] focus:ring-[#004a21] cursor-pointer"
                      />
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Name Input */}
                        <div>
                          <label className="text-[10px] font-bold text-[#707a6f] dark:text-[#bfc9bd] block mb-0.5">
                            {isSpanish ? 'Nombre' : 'Name'}
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#e1e2e8] dark:border-[#404940] bg-white dark:bg-[#2e3135] text-[#191c20] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#004a21]"
                          />
                        </div>

                        {/* Quantity & Unit */}
                        <div className="flex gap-1.5">
                          <div className="w-1/2">
                            <label className="text-[10px] font-bold text-[#707a6f] dark:text-[#bfc9bd] block mb-0.5">
                              {isSpanish ? 'Cant.' : 'Qty'}
                            </label>
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)
                              }
                              className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-[#e1e2e8] dark:border-[#404940] bg-white dark:bg-[#2e3135] text-[#191c20] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#004a21]"
                            />
                          </div>
                          <div className="w-1/2">
                            <label className="text-[10px] font-bold text-[#707a6f] dark:text-[#bfc9bd] block mb-0.5">
                              {isSpanish ? 'Unidad' : 'Unit'}
                            </label>
                            <select
                              value={item.unit}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'unit', e.target.value as UnitType)
                              }
                              className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-[#e1e2e8] dark:border-[#404940] bg-white dark:bg-[#2e3135] text-[#191c20] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#004a21]"
                            >
                              <option value="unidades">Unidades</option>
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="L">L</option>
                              <option value="ml">ml</option>
                              <option value="lb">lb</option>
                              <option value="oz">oz</option>
                            </select>
                          </div>
                        </div>

                        {/* Location & Expiry */}
                        <div className="flex gap-1.5 sm:col-span-2">
                          <div className="w-1/2">
                            <label className="text-[10px] font-bold text-[#707a6f] dark:text-[#bfc9bd] block mb-0.5">
                              {isSpanish ? 'Ubicación' : 'Location'}
                            </label>
                            <select
                              value={item.location}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'location', e.target.value as StorageLocation)
                              }
                              className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-[#e1e2e8] dark:border-[#404940] bg-white dark:bg-[#2e3135] text-[#191c20] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#004a21]"
                            >
                              <option value="Refrigerador">Refrigerador</option>
                              <option value="Alacena">Alacena</option>
                              <option value="Frutero">Frutero</option>
                              <option value="Congelador">Congelador</option>
                              <option value="Despensa">Despensa</option>
                            </select>
                          </div>
                          <div className="w-1/2">
                            <label className="text-[10px] font-bold text-[#707a6f] dark:text-[#bfc9bd] block mb-0.5">
                              {isSpanish ? 'Vence Aprox.' : 'Expiry Date'}
                            </label>
                            <input
                              type="date"
                              value={item.expiryDate}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'expiryDate', e.target.value)
                              }
                              className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-[#e1e2e8] dark:border-[#404940] bg-white dark:bg-[#2e3135] text-[#191c20] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#004a21]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#e1e2e8] dark:border-[#2e3135] bg-white dark:bg-[#1e2124] flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-4 rounded-xl border border-[#bfc9bd] dark:border-[#404940] text-[#404940] dark:text-[#bfc9bd] font-bold text-xs sm:text-sm hover:bg-[#f2f3f9] dark:hover:bg-[#2e3135]"
          >
            {isSpanish ? 'Cancelar' : 'Cancel'}
          </button>

          {parsedItems.length > 0 && (
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={selectedCount === 0}
              className="flex-1 py-3 px-4 rounded-xl bg-[#004a21] hover:bg-[#096430] disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">done_all</span>
              <span>
                {isSpanish
                  ? `Guardar (${selectedCount}) en Despensa`
                  : `Save (${selectedCount}) to Pantry`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
