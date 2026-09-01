export type StorageLocation = 'Refrigerador' | 'Alacena' | 'Frutero' | 'Congelador' | 'Despensa' | 'Otro';

export type ProductCategory = 
  | 'lacteos' 
  | 'frutas' 
  | 'proteinas' 
  | 'granos' 
  | 'verduras' 
  | 'bebidas' 
  | 'otros';

export type UnitType = 'unidades' | 'kg' | 'g' | 'L' | 'ml' | 'lb' | 'oz';

export type ProductStatus = 'fresh' | 'expiring' | 'expired';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: UnitType;
  expiryDate: string; // YYYY-MM-DD
  barcode?: string;
  location: StorageLocation;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: UnitType;
  checked: boolean;
  reason?: 'expired' | 'expiring' | 'low_stock' | 'manual';
  productId?: string;
  notes?: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'active' | 'pending';
  avatarUrl?: string;
  initials?: string;
  joinedAt?: string;
}

export type Language = 'es' | 'en';
export type UnitSystem = 'metric' | 'imperial';

export interface UserPreferences {
  language: Language;
  darkMode: boolean;
  unitSystem: UnitSystem;
  expiryAlertDays: number;
  purchaseReminders: boolean;
  soundEnabled: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  lastSyncedAt?: string;
  householdName?: string;
}

export interface PantryNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info' | 'success';
  timestamp: string;
  read: boolean;
  productId?: string;
}

export interface VelocityItem {
  name: string;
  category: ProductCategory;
  velocity: 'alta' | 'media' | 'baja';
  velocityText: string;
  daysLeftEstimate: number;
  recommendedQuantity: number;
  unit: UnitType;
  reason: string;
  isLow: boolean;
}

export interface WasteRiskItem {
  name: string;
  category: ProductCategory;
  riskLevel: 'alto' | 'medio' | 'critico';
  riskReason: string;
  recommendation: string;
  urgency: 'hoy' | 'proximos_dias' | 'evitar_compra';
  avoidBuying: boolean;
}

export interface WeeklyForecastItem {
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: UnitType;
  reason: string;
}

export interface AvoidBuyingItem {
  name: string;
  category: ProductCategory;
  reason: string;
  currentStock: string;
}

export interface WeeklyForecast {
  recommendedToBuy: WeeklyForecastItem[];
  avoidBuying: AvoidBuyingItem[];
  budgetSavingTip: string;
}

export interface PantryRecipeIngredient {
  name: string;
  quantity?: string;
  isFromPantry: boolean;
  isExpiringSoon: boolean;
  daysRemaining?: number;
}

export interface ExtraRecipeIngredient {
  name: string;
  quantity?: string;
  isOptional: boolean;
}

export interface AIRecipe {
  id: string;
  title: string;
  description: string;
  category: 'desayuno' | 'almuerzo_cena' | 'express' | 'postre_snack';
  categoryLabel: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: 'Fácil' | 'Media' | 'Rápida';
  rescuedPantryIngredients: PantryRecipeIngredient[];
  extraIngredients: ExtraRecipeIngredient[];
  steps: string[];
  chefTip: string;
  zeroWasteBenefit: string;
  isSaved?: boolean;
}

export interface AIRecipeResponse {
  recipes: AIRecipe[];
  expiredItemsIgnoredCount: number;
  expiringItemsCount: number;
  chefGreeting: string;
  lastGeneratedAt: string;
  aiModel?: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: Array<{
    label: string;
    actionType: 'add_to_shopping' | 'filter_pantry' | 'view_recipe';
    payload?: any;
  }>;
}

export type NavigationTab =
  | 'dashboard'
  | 'shopping'
  | 'ai-insights'
  | 'profile'
  | 'preferences'
  | 'household'
  | 'account';

export interface ReceiptParsedItem {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: UnitType;
  location: StorageLocation;
  estimatedDays: number;
  expiryDate: string;
  price?: number;
  selected?: boolean;
}

export interface ReceiptOCRResult {
  storeName?: string;
  receiptDate?: string;
  currency?: string;
  totalAmount?: number;
  items: ReceiptParsedItem[];
  modelUsed?: string;
}


