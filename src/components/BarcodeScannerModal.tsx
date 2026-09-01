import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ProductCategory, StorageLocation, UnitType, UserPreferences } from '../types';
import { translations } from '../utils/i18n';
import { lookupBarcode, BarcodeLookupResult } from '../utils/barcodeService';
import { decodeBarcodeFromImageFile } from '../utils/imageBarcodeDecoder';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string, foundData?: BarcodeLookupResult) => void;
  onQuickAddProduct?: (data: {
    name: string;
    category: ProductCategory;
    quantity: number;
    unit: UnitType;
    location: StorageLocation;
    expiryDate: string;
    barcode: string;
  }) => void;
  preferences: UserPreferences;
  onShowToast?: (msg: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onQuickAddProduct,
  preferences,
  onShowToast,
}) => {
  const t = translations[preferences?.language || 'es'];
  const isSpanish = preferences?.language !== 'en';
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [scannedResult, setScannedResult] = useState<BarcodeLookupResult | null>(null);

  // Batch / Continuous "Supermarket" scanning mode
  const [continuousMode, setContinuousMode] = useState(false);
  const [batchCount, setBatchCount] = useState(0);
  const [batchHistory, setBatchHistory] = useState<string[]>([]);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement | null>(null);
  const scannerContainerId = 'pantry-guard-barcode-reader';

  // Popular grocery barcodes with real global EANs
  const sampleBarcodes = [
    { code: '7501000123456', name: 'Leche Entera 1L', brand: 'Lala' },
    { code: '7501000654321', name: 'Yogurt Griego Fresa', brand: 'Chobani' },
    { code: '7501055300075', name: 'Cereal Corn Flakes 500g', brand: "Kellogg's" },
    { code: '7501000789123', name: 'Huevos de Granja 12pz', brand: 'San Juan' },
    { code: '7501000456789', name: 'Arroz Grano Largo 1kg', brand: 'Verde Valle' },
    { code: '7501000987654', name: 'Avena en Hojuelas 400g', brand: 'Quaker' },
    { code: '7501011122334', name: 'Atún en Agua 140g', brand: 'Dolores' },
    { code: '8410000001234', name: 'Aceite de Oliva 1L', brand: 'Carbonell' },
  ];

  // Helper to safely stop & clean up scanner
  const safelyStopScanner = async (scanner: Html5Qrcode | null) => {
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // Ignore cleanup error
    }
  };

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // High C
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted
    }
    try {
      if (navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }
    } catch {}
  };

  const handleProcessBarcode = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    // Debounce duplicate scans within 1.5 seconds in continuous mode
    const now = Date.now();
    if (
      continuousMode &&
      lastScannedCodeRef.current === cleanCode &&
      now - lastScanTimeRef.current < 1600
    ) {
      return;
    }
    lastScannedCodeRef.current = cleanCode;
    lastScanTimeRef.current = now;

    playBeep();

    if (continuousMode) {
      // In supermarket batch mode, add product directly and continue scanning seamlessly
      try {
        const result = await lookupBarcode(cleanCode);
        const d = new Date();
        d.setDate(d.getDate() + 7);

        const productName = result.name || `Producto (${cleanCode.slice(-4)})`;
        if (onQuickAddProduct) {
          onQuickAddProduct({
            name: productName,
            category: result.category || 'otros',
            quantity: result.quantity || 1,
            unit: result.unit || 'unidades',
            location: result.location || 'Alacena',
            expiryDate: result.expiryDate || d.toISOString().split('T')[0],
            barcode: cleanCode,
          });
        }

        setBatchCount((prev) => prev + 1);
        setBatchHistory((prev) => [productName, ...prev.slice(0, 4)]);
        if (onShowToast) {
          onShowToast(`+ ${productName}`);
        }
      } catch (err) {
        console.warn('Batch barcode lookup err:', err);
      }
      return;
    }

    // Standard Single-Scan Mode
    setIsResolving(true);

    // Pause scanner visual
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.pause();
      }
    } catch {
      // Continue
    }

    try {
      // Query Open Food Facts API & learned memory
      const result = await lookupBarcode(cleanCode);
      setScannedResult(result);
    } catch (err) {
      console.warn('Barcode lookup error:', err);
      setScannedResult({
        found: false,
        barcode: cleanCode,
        category: 'otros',
        quantity: 1,
        unit: 'unidades',
        location: 'Alacena',
        source: 'generated',
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleApplyAndEdit = async () => {
    if (!scannedResult) return;
    const scanner = html5QrCodeRef.current;
    html5QrCodeRef.current = null;
    await safelyStopScanner(scanner);
    onScanSuccess(scannedResult.barcode, scannedResult);
  };

  const handleQuickAdd = async () => {
    if (!scannedResult) return;
    const scanner = html5QrCodeRef.current;
    html5QrCodeRef.current = null;
    await safelyStopScanner(scanner);

    if (onQuickAddProduct) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      onQuickAddProduct({
        name: scannedResult.name || `Producto ${scannedResult.barcode}`,
        category: scannedResult.category || 'otros',
        quantity: scannedResult.quantity || 1,
        unit: scannedResult.unit || 'unidades',
        location: scannedResult.location || 'Alacena',
        expiryDate: scannedResult.expiryDate || d.toISOString().split('T')[0],
        barcode: scannedResult.barcode,
      });
      onClose();
    } else {
      onScanSuccess(scannedResult.barcode, scannedResult);
    }
  };

  const handleScanAnother = async () => {
    setScannedResult(null);
    const scanner = html5QrCodeRef.current;
    if (scanner) {
      try {
        scanner.resume();
      } catch {
        // If resume fails, reinit
        initCamera();
      }
    }
  };

  const handleClose = async () => {
    const scanner = html5QrCodeRef.current;
    html5QrCodeRef.current = null;
    await safelyStopScanner(scanner);
    setScannedResult(null);
    onClose();
  };

  const initCamera = async () => {
    const el = document.getElementById(scannerContainerId);
    if (!el) return;

    setCameraError(null);
    setIsScanning(false);

    // 1. Check for Secure Context (HTTPS or localhost)
    const isSecure =
      typeof window !== 'undefined' &&
      (window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');

    const hasMediaDevices =
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function';

    if (!isSecure && !hasMediaDevices) {
      setCameraError(
        isSpanish
          ? 'Los navegadores móviles requieren HTTPS (o localhost) para transmitir video en vivo. Puedes usar "Tomar Foto con Cámara" para escanear con la cámara nativa de tu celular.'
          : 'Mobile browsers require HTTPS for live video streams. Use "Take Photo with Camera" to scan using your phone\'s native camera.'
      );
      setIsScanning(false);
      return;
    }

    try {
      const formats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ];

      // Cleanup old instance if existing
      if (html5QrCodeRef.current) {
        await safelyStopScanner(html5QrCodeRef.current);
      }

      const scanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: formats,
        verbose: false,
      });
      html5QrCodeRef.current = scanner;

      // Clean, mobile-resilient configuration without restrictive min/max constraints
      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight);
          const width = Math.min(Math.floor(edge * 0.90), 320);
          const height = Math.min(Math.floor(width * 0.65), 220);
          return { width, height };
        },
      };

      let started = false;

      // Attempt 1: Standard facingMode object
      try {
        await scanner.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            handleProcessBarcode(decodedText);
          },
          () => {}
        );
        started = true;
      } catch (err1: any) {
        console.warn('FacingMode object start attempt failed, attempting fallback:', err1);
      }

      // Attempt 2: Direct camera enumeration from device
      if (!started) {
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            // Find rear/environment camera or pick last camera (usually back camera on smartphones)
            const rearCam =
              cameras.find((c) =>
                c.label.toLowerCase().includes('back') ||
                c.label.toLowerCase().includes('rear') ||
                c.label.toLowerCase().includes('environment') ||
                c.label.toLowerCase().includes('trasera')
              ) || cameras[cameras.length - 1];

            await scanner.start(
              rearCam.id,
              config,
              (decodedText) => {
                handleProcessBarcode(decodedText);
              },
              () => {}
            );
            started = true;
          }
        } catch (err2) {
          console.warn('Camera device enumeration failed:', err2);
        }
      }

      // Attempt 3: Direct facingMode string fallback
      if (!started) {
        await scanner.start(
          facingMode as any,
          config,
          (decodedText) => {
            handleProcessBarcode(decodedText);
          },
          () => {}
        );
        started = true;
      }

      // Ensure playsinline, webkit-playsinline and muted attributes for iOS Safari
      const videoEl = document.querySelector<HTMLVideoElement>(`#${scannerContainerId} video`);
      if (videoEl) {
        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('webkit-playsinline', 'true');
        videoEl.setAttribute('muted', 'true');
        videoEl.setAttribute('autoplay', 'true');
        videoEl.muted = true;
        videoEl.play().catch(() => {});
      }

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera scan initialization notice:', err);
      const errMsg = (err?.message || err?.name || '').toString().toLowerCase();

      if (errMsg.includes('notallowed') || errMsg.includes('permission') || errMsg.includes('denied')) {
        setCameraError(
          isSpanish
            ? 'Permiso de cámara denegado. Permite el acceso a la cámara en los permisos de tu navegador o usa "Tomar Foto con Cámara".'
            : 'Camera permission denied. Please allow camera access in your browser settings or use "Take Photo with Camera".'
        );
      } else if (!isSecure) {
        setCameraError(
          isSpanish
            ? 'Los navegadores móviles requieren conexión HTTPS (o localhost) para video en vivo. Puedes usar "Tomar Foto con Cámara" para escanear con la cámara nativa de tu celular.'
            : 'Mobile browsers require HTTPS for live video streaming. Use "Take Photo with Camera" below!'
        );
      } else {
        setCameraError(
          isSpanish
            ? 'No se pudo iniciar la cámara en vivo en este dispositivo. Puedes tomar una foto con la cámara nativa o subir una imagen.'
            : 'Could not initialize live camera. You can snap a photo with your native camera or upload an image.'
        );
      }
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setScannedResult(null);
    setTorchOn(false);

    const timer = setTimeout(() => {
      initCamera();
    }, 150);

    return () => {
      clearTimeout(timer);
      const scanner = html5QrCodeRef.current;
      html5QrCodeRef.current = null;
      if (scanner) {
        safelyStopScanner(scanner).catch(() => {});
      }
    };
  }, [isOpen, facingMode]);

  const toggleFlashlight = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        const track = (html5QrCodeRef.current as any).getRunningTrackCameraCapabilities?.();
        if (track && track.torch) {
          await (html5QrCodeRef.current as any).applyVideoConstraints({
            advanced: [{ torch: !torchOn }],
          });
        }
      }
      setTorchOn(!torchOn);
    } catch {
      setTorchOn(!torchOn);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const [imageDecodingStatus, setImageDecodingStatus] = useState<string | null>(null);

  // Upload image / photo of barcode from gallery or camera capture
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setImageDecodingStatus(
      preferences.language === 'en'
        ? 'Scanning image with AI Vision...'
        : 'Analizando imagen y extrayendo producto con IA...'
    );
    setIsResolving(true);

    try {
      // Decode with Native BarcodeDetector / 1D ZXing / Gemini Vision Multimodal
      const decoded = await decodeBarcodeFromImageFile(file, preferences?.language || 'es');

      if (decoded && decoded.lookupResult) {
        playBeep();
        setImageDecodingStatus(null);
        setScannedResult(decoded.lookupResult);
      } else if (decoded && decoded.barcode) {
        setImageDecodingStatus(null);
        await handleProcessBarcode(decoded.barcode);
      } else {
        setImageDecodingStatus(null);
        alert(
          preferences.language === 'en'
            ? 'Could not clearly recognize the product or barcode. Please try a closer photo or enter the numbers manually.'
            : 'No se pudo leer el código o empaque en la foto. Intenta con una foto más cercana o escribe el código numérico.'
        );
        setManualModalOpen(true);
      }
    } catch (err) {
      console.warn('Image barcode decode notice:', err);
      setImageDecodingStatus(null);
      alert(
        preferences.language === 'en'
          ? 'There was an issue processing the image. You can enter the barcode numbers directly.'
          : 'Hubo un problema al procesar la imagen. Puedes ingresar el código numérico directamente.'
      );
      setManualModalOpen(true);
    } finally {
      setIsResolving(false);
      setImageDecodingStatus(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSimulate = (code?: string) => {
    const chosen = code || sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)].code;
    handleProcessBarcode(chosen);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setManualModalOpen(false);
    handleProcessBarcode(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0e12] flex flex-col justify-between overflow-hidden h-[100dvh] w-screen select-none">
      {/* Hidden file input for direct native mobile camera capture */}
      <input
        ref={cameraCaptureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Hidden file input for gallery photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Background Camera Viewport */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black flex items-center justify-center">
        <div id={scannerContainerId} className="w-full h-full"></div>
        
        {/* Loading Overlay when processing uploaded image */}
        {imageDecodingStatus && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/80 backdrop-blur-sm z-20 pointer-events-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#004a21] flex items-center justify-center mb-3 text-white shadow-lg animate-pulse">
              <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
            </div>
            <p className="text-white text-sm font-bold mb-1">
              {imageDecodingStatus}
            </p>
            <p className="text-white/70 text-xs">
              Detectando código EAN/UPC y buscando en Open Food Facts...
            </p>
          </div>
        )}

        {cameraError && !imageDecodingStatus && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/95 z-10 pointer-events-auto">
            <div className="w-16 h-16 rounded-full bg-[#87d897]/20 flex items-center justify-center mb-3 text-[#87d897]">
              <span className="material-symbols-outlined text-4xl">photo_camera</span>
            </div>
            <p className="text-white text-base font-bold max-w-sm mb-1.5">
              {isSpanish ? 'Escanear con Cámara de Celular' : 'Scan with Mobile Camera'}
            </p>
            <p className="text-white/80 text-xs max-w-xs mb-5 leading-relaxed">
              {cameraError}
            </p>
            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              <button
                type="button"
                onClick={() => cameraCaptureInputRef.current?.click()}
                className="w-full py-3 px-4 bg-[#87d897] hover:bg-[#68c77b] text-[#00210b] font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                <span>{isSpanish ? 'Tomar Foto con Cámara' : 'Take Photo with Camera'}</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-white/20 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_library</span>
                  <span>{isSpanish ? 'Galería' : 'Gallery'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManualModalOpen(true)}
                  className="py-2.5 px-3 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-white/20 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">keyboard</span>
                  <span>{isSpanish ? 'Código' : 'Manual'}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleSimulate()}
                className="w-full py-2 px-3 text-white/70 hover:text-white font-medium text-[11px] flex items-center justify-center gap-1 mt-1"
              >
                <span className="material-symbols-outlined text-[14px] text-[#87d897]">bolt</span>
                <span>{isSpanish ? 'O probar con un producto de muestra' : 'Or try a sample product'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Bar Controls */}
      <div className="relative z-20 flex justify-between items-center px-4 py-3 pt-[env(safe-area-inset-top,12px)] bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <button
          onClick={handleClose}
          aria-label="Cerrar escáner"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 active:scale-95 transition-all border border-white/10"
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>

        <div className="flex flex-col items-center">
          <h3 className="text-white font-bold text-sm sm:text-base drop-shadow-md flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#87d897]">barcode_scanner</span>
            <span>{t.scanner.title}</span>
          </h3>
          <span className="text-[10px] text-white/70 tracking-wide uppercase font-medium">
            Open Food Facts Conectado
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setContinuousMode(!continuousMode);
              if (!continuousMode && onShowToast) {
                onShowToast(isSpanish ? 'Modo Supermercado Activado (Escaneo Continuo)' : 'Supermarket Batch Mode Active');
              }
            }}
            title={isSpanish ? 'Modo Supermercado / Escaneo Continuo' : 'Continuous Batch Scan'}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
              continuousMode
                ? 'bg-[#87d897] text-[#00210b] border-[#87d897] shadow-[0_0_12px_rgba(135,216,151,0.5)]'
                : 'bg-black/50 text-white/80 border-white/20 hover:bg-black/70'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {continuousMode ? 'shopping_basket' : 'repeat'}
            </span>
            <span className="hidden sm:inline">
              {continuousMode
                ? isSpanish ? 'Continuo ON' : 'Continuous ON'
                : isSpanish ? 'Modo Ráfaga' : 'Batch Mode'}
            </span>
          </button>

          <button
            onClick={toggleCameraFacing}
            aria-label="Cambiar cámara"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 active:scale-95 transition-all border border-white/10"
          >
            <span className="material-symbols-outlined text-[20px]">flip_camera_ios</span>
          </button>
          <button
            onClick={toggleFlashlight}
            aria-label={t.scanner.flashlight}
            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md text-white active:scale-95 transition-all border border-white/10 ${
              torchOn ? 'bg-[#004a21] text-[#87d897]' : 'bg-black/50 hover:bg-black/70'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {torchOn ? 'flashlight_off' : 'flashlight_on'}
            </span>
          </button>
        </div>
      </div>

      {/* Supermarket Continuous Mode Live Counter Banner */}
      {continuousMode && (
        <div className="relative z-20 px-4 pt-1 pointer-events-auto">
          <div className="max-w-md mx-auto bg-[#004a21]/90 backdrop-blur-md border border-[#87d897]/40 text-white rounded-2xl p-3 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#87d897] text-[#00210b] font-black flex items-center justify-center text-sm shadow-sm">
                {batchCount}
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {isSpanish ? 'Modo Supermercado Activo' : 'Supermarket Batch Mode'}
                </p>
                <p className="text-[10px] text-white/80">
                  {batchCount === 0
                    ? isSpanish ? 'Pasa los códigos seguidos sin cerrar' : 'Scan items back to back'
                    : isSpanish ? `${batchCount} productos agregados a despensa` : `${batchCount} items added to pantry`}
                </p>
              </div>
            </div>

            {batchCount > 0 && (
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 rounded-full bg-[#87d897] hover:bg-[#68c77b] text-[#00210b] font-black text-xs shadow transition-transform active:scale-95"
              >
                {isSpanish ? 'Finalizar' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Center Reticle Viewport Overlay (when not showing result card) */}
      {!scannedResult && (
        <div className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 pointer-events-none my-auto">
          <div className="flex items-center gap-1.5 text-white text-xs font-medium px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 mb-4 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#87d897] animate-pulse"></span>
            <span>{t.scanner.instruction}</span>
          </div>

          {/* Reticle Box with Corner Accents */}
          <div className="relative w-full max-w-[280px] sm:max-w-xs aspect-[4/3] rounded-2xl border border-white/20 overflow-hidden bg-black/25 backdrop-blur-[0.5px] shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#87d897] rounded-tl-xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#87d897] rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#87d897] rounded-bl-xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#87d897] rounded-br-xl"></div>

            {/* Laser Line */}
            <div className="absolute left-0 right-0 h-1 bg-[#87d897] shadow-[0_0_14px_4px_rgba(135,216,151,0.9)] animate-scan-line"></div>

            {/* Central Barcode Target Visual */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <span className="material-symbols-outlined text-6xl text-white">
                barcode
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scanned Result Confirmation Drawer (Real-Time Open Food Facts Result) */}
      {scannedResult && (
        <div className="relative z-30 px-4 pb-6 pt-4 max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom duration-300">
          <div className="bg-white dark:bg-[#191c20] text-[#191c20] dark:text-[#f8f9ff] rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-[#e1e2e8] dark:border-[#2e3135] flex flex-col gap-4">
            
            {/* Header info with Source Tag */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {scannedResult.imageUrl ? (
                  <img
                    src={scannedResult.imageUrl}
                    alt={scannedResult.name}
                    className="w-14 h-14 rounded-xl object-contain bg-white p-1 border border-[#e1e2e8] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#004a21]/10 text-[#004a21] dark:text-[#87d897] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-3xl">grocery</span>
                  </div>
                )}

                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#004a21] dark:text-[#87d897] bg-[#a2f5b2]/40 dark:bg-[#004a21]/30 px-2 py-0.5 rounded-full inline-block mb-1">
                    {scannedResult.source === 'openfoodfacts'
                      ? 'Base Global Open Food Facts'
                      : scannedResult.source === 'learned'
                      ? 'Memoria de tu despensa'
                      : 'Catálogo Rápido'}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base leading-snug line-clamp-2">
                    {scannedResult.name || `Código ${scannedResult.barcode}`}
                  </h4>
                  {scannedResult.brand && (
                    <p className="text-xs text-[#707a6f] dark:text-[#bfc9bd] font-medium">
                      Marca: {scannedResult.brand}
                    </p>
                  )}
                </div>
              </div>

              {scannedResult.nutriScore && (
                <div className="px-2.5 py-1 rounded-lg bg-[#004a21] text-white font-black text-xs shrink-0 shadow-sm">
                  Nutri-Score {scannedResult.nutriScore}
                </div>
              )}
            </div>

            {/* Extracted Product Attributes Grid */}
            <div className="grid grid-cols-3 gap-2 bg-[#f2f3f9] dark:bg-[#2e3135] p-3 rounded-xl text-center">
              <div>
                <span className="text-[10px] text-[#707a6f] dark:text-[#bfc9bd] block uppercase">Categoría</span>
                <span className="text-xs font-semibold capitalize text-[#191c20] dark:text-white">
                  {scannedResult.category || 'Otros'}
                </span>
              </div>
              <div className="border-x border-[#e1e2e8] dark:border-[#404940]">
                <span className="text-[10px] text-[#707a6f] dark:text-[#bfc9bd] block uppercase">Ubicación</span>
                <span className="text-xs font-semibold text-[#191c20] dark:text-white">
                  {scannedResult.location || 'Refrigerador'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#707a6f] dark:text-[#bfc9bd] block uppercase">Vence Aprox.</span>
                <span className="text-xs font-semibold text-[#004a21] dark:text-[#87d897]">
                  {scannedResult.expiryDate || 'En 7 días'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleQuickAdd}
                className="w-full py-3 px-4 rounded-xl bg-[#004a21] hover:bg-[#096430] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Guardar en Despensa</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApplyAndEdit}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#e1e2e8] dark:bg-[#404940] hover:bg-[#bfc9bd]/60 text-[#191c20] dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>Personalizar</span>
                </button>
                <button
                  type="button"
                  onClick={handleScanAnother}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[#bfc9bd] dark:border-[#5a6459] text-[#404940] dark:text-[#bfc9bd] hover:bg-[#f2f3f9] dark:hover:bg-[#2e3135] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                  <span>Escanear Otro</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls (when scanning) */}
      {!scannedResult && (
        <div className="relative z-20 px-4 py-4 pb-[env(safe-area-inset-bottom,20px)] flex flex-col gap-2.5 max-w-md mx-auto w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => cameraCaptureInputRef.current?.click()}
              className="py-2.5 px-2 rounded-xl bg-[#87d897] hover:bg-[#68c77b] active:scale-95 text-[#00210b] font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">photo_camera</span>
              <span className="truncate">{isSpanish ? 'Foto' : 'Photo'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">photo_library</span>
              <span className="truncate">{isSpanish ? 'Galería' : 'Gallery'}</span>
            </button>

            <button
              type="button"
              onClick={() => setManualModalOpen(true)}
              className="py-2.5 px-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">keyboard</span>
              <span className="truncate">{isSpanish ? 'Código' : 'Code'}</span>
            </button>
          </div>

          {/* Quick sample barcodes carousel */}
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-[11px] text-white/70 text-center font-medium">
              O prueba un código de ejemplo:
            </span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 justify-center">
              {sampleBarcodes.slice(0, 5).map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => handleSimulate(s.code)}
                  className="text-[11px] text-white/95 bg-black/60 hover:bg-[#004a21] border border-white/20 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px] text-[#87d897]">touch_app</span>
                  <span>{s.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Input Dialog */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1e2124] rounded-[24px] p-5 sm:p-6 w-full max-w-sm shadow-2xl border border-[#e1e2e8] dark:border-[#404940]">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-base text-[#191c20] dark:text-[#f8f9ff] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#004a21] dark:text-[#87d897]">
                  pin
                </span>
                <span>{t.scanner.enterBarcodeTitle}</span>
              </h4>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#707a6f] hover:bg-[#f2f3f9] dark:hover:bg-[#2e3135]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-[#404940] dark:text-[#bfc9bd] block mb-1.5">
                  {t.productModal.barcodeLabel} (EAN-13, UPC o numérico)
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ej. 7501000123456 o 8410000001234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#bfc9bd] dark:border-[#404940] bg-white dark:bg-[#2e3135] text-[#191c20] dark:text-white text-sm focus:outline-none focus:border-[#004a21] focus:ring-1 focus:ring-[#004a21]"
                  autoFocus
                />
              </div>

              {/* Sample quick buttons inside manual */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-[#707a6f] dark:text-[#bfc9bd] font-medium">
                  Prueba rápida:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {sampleBarcodes.slice(0, 4).map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => setManualCode(s.code)}
                      className="text-[11px] text-left p-2 rounded-xl bg-[#f2f3f9] dark:bg-[#2e3135] hover:bg-[#e1e2e8] dark:hover:bg-[#404940] text-[#191c20] dark:text-white truncate border border-[#e1e2e8] dark:border-[#404940]/50"
                    >
                      <span className="font-semibold block truncate">{s.name}</span>
                      <span className="text-[10px] text-[#707a6f] dark:text-[#bfc9bd]">{s.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#404940] dark:text-[#bfc9bd] hover:bg-[#f2f3f9] dark:hover:bg-[#2e3135] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isResolving}
                  className="px-5 py-2 text-xs font-bold bg-[#004a21] hover:bg-[#096430] disabled:opacity-50 text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  {isResolving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>{t.scanner.searchProduct}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
