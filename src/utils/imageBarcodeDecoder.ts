import {
  BarcodeFormat,
  DecodeHintType,
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
  MultiFormatReader,
} from '@zxing/library';
import { BarcodeLookupResult, lookupBarcode, getEstimatedExpiryDate } from './barcodeService';
import { ProductCategory, StorageLocation, UnitType } from '../types';

export interface ImageDecodeResult {
  barcode: string;
  lookupResult?: BarcodeLookupResult;
  source: 'native_detector' | 'zxing' | 'gemini_vision' | 'openfoodfacts';
}

/**
 * Resizes a File image and converts to base64 JPEG
 */
async function fileToBase64Optimized(file: File, maxDim = 1200): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const raw = (e.target?.result as string) || '';
          resolve({ base64: raw, mimeType: file.type || 'image/jpeg' });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ base64: dataUrl, mimeType: 'image/jpeg' });
      };
      img.onerror = () => {
        const raw = (e.target?.result as string) || '';
        resolve({ base64: raw, mimeType: file.type || 'image/jpeg' });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

async function scanClient1DBarcodes(file: File): Promise<string | null> {
  // 1. Try Html5Qrcode high-speed image scanning engine
  try {
    const html5Qr = new Html5Qrcode('pantry-guard-barcode-reader', { verbose: false });
    const result = await html5Qr.scanFile(file, false);
    if (result && result.trim()) {
      return result.trim();
    }
  } catch {
    // Continue to next decoders
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(imageUrl);

    // 2. Native window.BarcodeDetector (Hardware-accelerated on Android Chrome & iOS 17+)
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
        const barcodes = await detector.detect(img);
        if (barcodes && barcodes.length > 0) {
          const val = barcodes[0].rawValue || barcodes[0].displayValue;
          if (val && val.trim()) {
            return val.trim();
          }
        }
      } catch {
        // Continue
      }
    }

    // 3. MultiFormatReader ZXing pass
    const hints = new Map<DecodeHintType, any>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    reader.setHints(hints);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const maxDim = 800;
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    let scale = 1;
    if (width > maxDim || height > maxDim) {
      scale = Math.min(maxDim / width, maxDim / height);
    }
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const luminanceSource = new RGBLuminanceSource(
        new Uint8ClampedArray(imageData.data.buffer),
        canvas.width,
        canvas.height
      );
      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
      const res = reader.decode(binaryBitmap);
      if (res && res.getText()) {
        return res.getText().trim();
      }
    } catch {
      // Not found
    }

    return null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Robust Multimodal Barcode & Packaging Scanner:
 * Step 1: Fast local scan (Native BarcodeDetector / ZXing 1D)
 * Step 2: If found -> lookup in Open Food Facts
 * Step 3: If not found -> Gemini Vision AI analysis
 */
export async function decodeBarcodeFromImageFile(
  file: File,
  language = 'es'
): Promise<ImageDecodeResult | null> {
  // Step 1: Try instant client-side scan
  const clientBarcode = await scanClient1DBarcodes(file);

  if (clientBarcode) {
    const lookup = await lookupBarcode(clientBarcode);
    return {
      barcode: clientBarcode,
      lookupResult: lookup,
      source: 'native_detector',
    };
  }

  // Step 2: Fallback to Server-Side Gemini Vision AI
  try {
    const { base64, mimeType } = await fileToBase64Optimized(file, 1200);

    const res = await fetch('/api/ai/scan-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType,
        language,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const rawBarcode = (d.barcode || '').trim();

        // If Gemini identified a specific barcode sequence, check Open Food Facts for highest detail
        if (rawBarcode && rawBarcode.length >= 6) {
          const offResult = await lookupBarcode(rawBarcode);
          if (offResult.found && offResult.name) {
            return {
              barcode: rawBarcode,
              lookupResult: offResult,
              source: 'openfoodfacts',
            };
          }
        }

        // Calculate expiry date from Gemini's estimated days
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + (d.estimatedExpiryDays || 7));
        const formattedExpiry = expDate.toISOString().split('T')[0];

        const syntheticBarcode = rawBarcode || `GEN-${Date.now().toString().slice(-6)}`;
        const aiResult: BarcodeLookupResult = {
          found: true,
          name: d.brand && d.productName && !d.productName.toLowerCase().includes(d.brand.toLowerCase())
            ? `${d.productName} (${d.brand})`
            : d.productName || 'Producto Detectado',
          brand: d.brand,
          category: (d.category as ProductCategory) || 'otros',
          quantity: typeof d.quantity === 'number' && d.quantity > 0 ? d.quantity : 1,
          unit: (d.unit as UnitType) || 'unidades',
          location: (d.location as StorageLocation) || 'Alacena',
          expiryDate: formattedExpiry,
          barcode: syntheticBarcode,
          source: 'generated',
        };

        return {
          barcode: syntheticBarcode,
          lookupResult: aiResult,
          source: 'gemini_vision',
        };
      }
    }
  } catch (err) {
    console.warn('AI Vision scan fallback error:', err);
  }

  return null;
}
