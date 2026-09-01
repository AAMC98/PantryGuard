import { BARCODE_CATALOG } from '../data/initialData';
import { Product, ProductCategory, ProductStatus, StorageLocation, UnitType } from '../types';

export { BARCODE_CATALOG };

export interface BarcodeLookupResult {
  found: boolean;
  name?: string;
  category?: ProductCategory;
  quantity?: number;
  unit?: UnitType;
  location?: StorageLocation;
  expiryDate?: string;
  brand?: string;
  imageUrl?: string;
  nutriScore?: string;
  barcode: string;
  source: 'catalog' | 'openfoodfacts' | 'learned' | 'generated';
}

const LEARNED_BARCODES_KEY = 'pantry_learned_barcodes';

// Load user learned barcodes from localStorage
export function getLearnedBarcodes(): Record<string, Partial<BarcodeLookupResult>> {
  try {
    const data = localStorage.getItem(LEARNED_BARCODES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// Save a learned product barcode for future instant recognition
export function saveLearnedBarcode(barcode: string, data: Partial<BarcodeLookupResult>) {
  if (!barcode) return;
  try {
    const learned = getLearnedBarcodes();
    learned[barcode.trim()] = {
      ...data,
      barcode: barcode.trim(),
      source: 'learned',
    };
    localStorage.setItem(LEARNED_BARCODES_KEY, JSON.stringify(learned));
  } catch (err) {
    console.warn('Could not save learned barcode:', err);
  }
}

// Estimate typical shelf-life days based on category
export function getEstimatedExpiryDate(category: ProductCategory, isCannedOrPreserved = false): string {
  const d = new Date();
  let daysToAdd = 7;

  if (isCannedOrPreserved) {
    daysToAdd = 365;
  } else {
    switch (category) {
      case 'lacteos':
        daysToAdd = 12;
        break;
      case 'proteinas':
        daysToAdd = 5;
        break;
      case 'verduras':
        daysToAdd = 7;
        break;
      case 'frutas':
        daysToAdd = 6;
        break;
      case 'granos':
        daysToAdd = 180;
        break;
      case 'bebidas':
        daysToAdd = 60;
        break;
      default:
        daysToAdd = 30;
    }
  }

  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split('T')[0];
}

// Helper to parse quantity and units from text like "1 L", "500g", "250 ml"
function parseQuantityAndUnit(quantityStr?: string): { quantity: number; unit: UnitType } {
  if (!quantityStr) return { quantity: 1, unit: 'unidades' };
  
  const text = quantityStr.trim().toLowerCase();
  const match = text.match(/^([\d.,]+)\s*([a-zA-Z]+)?$/);
  
  if (match) {
    const val = parseFloat(match[1].replace(',', '.'));
    const rawUnit = (match[2] || '').toLowerCase();
    
    if (!isNaN(val) && val > 0) {
      if (rawUnit === 'g' || rawUnit === 'gr' || rawUnit === 'gramos') return { quantity: val, unit: 'g' };
      if (rawUnit === 'kg' || rawUnit === 'kilos') return { quantity: val, unit: 'kg' };
      if (rawUnit === 'ml' || rawUnit === 'cl') return { quantity: rawUnit === 'cl' ? val * 10 : val, unit: 'ml' };
      if (rawUnit === 'l' || rawUnit === 'lt' || rawUnit === 'litro' || rawUnit === 'litros') return { quantity: val, unit: 'L' };
      if (rawUnit === 'lb' || rawUnit === 'lbs') return { quantity: val, unit: 'lb' };
      if (rawUnit === 'oz' || rawUnit === 'onzas') return { quantity: val, unit: 'oz' };
      return { quantity: val, unit: 'unidades' };
    }
  }
  return { quantity: 1, unit: 'unidades' };
}

// Categorize product from Open Food Facts category & keyword tags
function mapToPantryCategory(tags: string, productName: string): ProductCategory {
  const text = `${tags} ${productName}`.toLowerCase();

  if (
    text.includes('dairy') ||
    text.includes('milk') ||
    text.includes('leche') ||
    text.includes('yogurt') ||
    text.includes('queso') ||
    text.includes('cheese') ||
    text.includes('mantequilla') ||
    text.includes('butter') ||
    text.includes('crema') ||
    text.includes('lacteo') ||
    text.includes('lácteo')
  ) {
    return 'lacteos';
  }

  if (
    text.includes('fruit') ||
    text.includes('fruta') ||
    text.includes('apple') ||
    text.includes('manzana') ||
    text.includes('banana') ||
    text.includes('plátano') ||
    text.includes('platano') ||
    text.includes('naranja') ||
    text.includes('orange') ||
    text.includes('berry') ||
    text.includes('fresa')
  ) {
    return 'frutas';
  }

  if (
    text.includes('meat') ||
    text.includes('carne') ||
    text.includes('chicken') ||
    text.includes('pollo') ||
    text.includes('fish') ||
    text.includes('pescado') ||
    text.includes('tuna') ||
    text.includes('atun') ||
    text.includes('atún') ||
    text.includes('egg') ||
    text.includes('huevo') ||
    text.includes('beef') ||
    text.includes('res') ||
    text.includes('pork') ||
    text.includes('cerdo') ||
    text.includes('jamon') ||
    text.includes('jamón') ||
    text.includes('salmón')
  ) {
    return 'proteinas';
  }

  if (
    text.includes('cereal') ||
    text.includes('grain') ||
    text.includes('grano') ||
    text.includes('rice') ||
    text.includes('arroz') ||
    text.includes('pasta') ||
    text.includes('noodle') ||
    text.includes('fideo') ||
    text.includes('bread') ||
    text.includes('pan') ||
    text.includes('oat') ||
    text.includes('avena') ||
    text.includes('flour') ||
    text.includes('harina') ||
    text.includes('legume') ||
    text.includes('frijol') ||
    text.includes('lenteja')
  ) {
    return 'granos';
  }

  if (
    text.includes('vegetable') ||
    text.includes('verdura') ||
    text.includes('vegetal') ||
    text.includes('tomato') ||
    text.includes('tomate') ||
    text.includes('onion') ||
    text.includes('cebolla') ||
    text.includes('lettuce') ||
    text.includes('lechuga') ||
    text.includes('carrot') ||
    text.includes('zanahoria') ||
    text.includes('potato') ||
    text.includes('papa') ||
    text.includes('spinach') ||
    text.includes('espinaca')
  ) {
    return 'verduras';
  }

  if (
    text.includes('beverage') ||
    text.includes('drink') ||
    text.includes('bebida') ||
    text.includes('juice') ||
    text.includes('jugo') ||
    text.includes('water') ||
    text.includes('agua') ||
    text.includes('soda') ||
    text.includes('refresco') ||
    text.includes('coffee') ||
    text.includes('café') ||
    text.includes('cafe') ||
    text.includes('tea') ||
    text.includes('té') ||
    text.includes('beer') ||
    text.includes('cerveza') ||
    text.includes('wine') ||
    text.includes('vino')
  ) {
    return 'bebidas';
  }

  return 'otros';
}

function mapToStorageLocation(category: ProductCategory, isCanned = false): StorageLocation {
  if (isCanned) return 'Alacena';
  if (category === 'lacteos' || category === 'proteinas') return 'Refrigerador';
  if (category === 'frutas') return 'Frutero';
  if (category === 'verduras') return 'Refrigerador';
  if (category === 'bebidas') return 'Refrigerador';
  return 'Alacena';
}

/**
 * Real Multi-Tier Barcode Resolver:
 * 1. User learned custom barcodes
 * 2. Static instant offline catalog
 * 3. Live Open Food Facts Global API
 * 4. Fallback smart estimator
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const cleanCode = barcode.trim();
  if (!cleanCode) {
    return {
      found: false,
      barcode: cleanCode,
      source: 'generated',
    };
  }

  // 1. Check user learned memory first (personal customization)
  const learned = getLearnedBarcodes();
  if (learned[cleanCode]) {
    const item = learned[cleanCode];
    const category = item.category || 'otros';
    return {
      found: true,
      name: item.name || '',
      category,
      quantity: item.quantity || 1,
      unit: item.unit || 'unidades',
      location: item.location || mapToStorageLocation(category),
      expiryDate: item.expiryDate || getEstimatedExpiryDate(category),
      brand: item.brand,
      imageUrl: item.imageUrl,
      nutriScore: item.nutriScore,
      barcode: cleanCode,
      source: 'learned',
    };
  }

  // 2. Check local instant catalog
  if (BARCODE_CATALOG[cleanCode]) {
    const item = BARCODE_CATALOG[cleanCode];
    const category = (item.category as ProductCategory) || 'otros';
    return {
      found: true,
      name: item.name,
      category,
      quantity: item.quantity || 1,
      unit: item.unit || 'unidades',
      location: (item.location as StorageLocation) || mapToStorageLocation(category),
      expiryDate: getEstimatedExpiryDate(category),
      barcode: cleanCode,
      source: 'catalog',
    };
  }

  // 3. Live Query to Open Food Facts Global Database
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PantryGuardApp/1.0 (https://ais-dev.run.app; contact: pantry@example.com)',
        },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        
        // Extract best available name
        const rawName =
          p.product_name_es ||
          p.product_name ||
          p.generic_name_es ||
          p.generic_name ||
          (p._keywords && p._keywords.slice(0, 3).join(' ')) ||
          '';

        const brand = p.brands || p.brand_owner || '';
        const fullName = brand && rawName && !rawName.toLowerCase().includes(brand.toLowerCase())
          ? `${rawName} (${brand})`
          : rawName || (brand ? `Producto ${brand}` : `Producto (${cleanCode})`);

        // Category mapping
        const tags = [
          ...(p.categories_tags || []),
          ...(p.categories_hierarchy || []),
          ...(p._keywords || []),
        ].join(' ');

        const category = mapToPantryCategory(tags, fullName);
        const isCanned = tags.toLowerCase().includes('canned') || tags.toLowerCase().includes('enlatado') || tags.toLowerCase().includes('conserva');
        
        // Parse quantity & unit from Open Food Facts
        const { quantity, unit } = parseQuantityAndUnit(p.quantity);
        const location = mapToStorageLocation(category, isCanned);
        const expiryDate = getEstimatedExpiryDate(category, isCanned);
        
        const imageUrl = p.image_front_url || p.image_url || p.image_small_url || undefined;
        const nutriScore = p.nutriscore_grade ? p.nutriscore_grade.toUpperCase() : undefined;

        const result: BarcodeLookupResult = {
          found: true,
          name: fullName,
          category,
          quantity,
          unit,
          location,
          expiryDate,
          brand,
          imageUrl,
          nutriScore,
          barcode: cleanCode,
          source: 'openfoodfacts',
        };

        // Cache in learned memory for ultra-fast next lookup
        saveLearnedBarcode(cleanCode, result);

        return result;
      }
    }
  } catch (error) {
    console.info('OpenFoodFacts live query skipped or timed out, using smart heuristic:', error);
  }

  // 4. Default Heuristic for unlisted barcodes
  return {
    found: false,
    name: '',
    category: 'otros',
    quantity: 1,
    unit: 'unidades',
    location: 'Alacena',
    expiryDate: getEstimatedExpiryDate('otros'),
    barcode: cleanCode,
    source: 'generated',
  };
}

export function calculateProductStatus(
  expiryDate: string,
  alertDays: number = 3
): {
  status: ProductStatus;
  diffDays: number;
  displayText: { es: string; en: string };
  borderColor: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = (expiryDate || '').split('-').map(Number);
  if (!year || !month || !day) {
    return {
      status: 'fresh',
      diffDays: 99,
      displayText: { es: 'Sin fecha', en: 'No date' },
      borderColor: 'border-[#707a6f]',
      dotColor: 'bg-[#707a6f]',
      badgeBg: 'bg-[#e1e2e8]',
      badgeText: 'text-[#404940]',
    };
  }

  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      status: 'expired',
      diffDays,
      displayText: {
        es: absDays === 1 ? 'Caducó ayer' : `Caducó hace ${absDays} días`,
        en: absDays === 1 ? 'Expired yesterday' : `Expired ${absDays} days ago`,
      },
      borderColor: 'border-[#ba1a1a]',
      dotColor: 'bg-[#ba1a1a]',
      badgeBg: 'bg-[#ffdad6]',
      badgeText: 'text-[#ba1a1a]',
    };
  } else if (diffDays <= alertDays) {
    return {
      status: 'expiring',
      diffDays,
      displayText: {
        es: diffDays === 0 ? 'Vence hoy' : diffDays === 1 ? 'Vence mañana' : `Próximo (${diffDays} días)`,
        en: diffDays === 0 ? 'Expires today' : diffDays === 1 ? 'Expires tomorrow' : `Expiring (${diffDays} days)`,
      },
      borderColor: 'border-[#ff7a2b]',
      dotColor: 'bg-[#ff7a2b]',
      badgeBg: 'bg-[#ffdbcb]',
      badgeText: 'text-[#9f4200]',
    };
  } else {
    return {
      status: 'fresh',
      diffDays,
      displayText: {
        es: 'Vigente',
        en: 'Fresh',
      },
      borderColor: 'border-[#004a21]',
      dotColor: 'bg-[#004a21]',
      badgeBg: 'bg-[#a2f5b2]/40',
      badgeText: 'text-[#004a21]',
    };
  }
}
