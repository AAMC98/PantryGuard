import { PantryNotification, Product, ShoppingItem, UserPreferences, UserProfile } from '../types';

// Helper to format ISO date relative to today
export const getRelativeDateString = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Yogurt',
    category: 'lacteos',
    quantity: 2,
    unit: 'unidades',
    location: 'Refrigerador',
    expiryDate: getRelativeDateString(-2), // Caducó hace 2 días
    barcode: '7501000654321',
    notes: 'Yogurt griego natural',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Manzanas',
    category: 'frutas',
    quantity: 1,
    unit: 'kg',
    location: 'Frutero',
    expiryDate: getRelativeDateString(3), // Próximo (3 días)
    barcode: '0000000248101',
    notes: 'Manzanas Fuji',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Huevos',
    category: 'proteinas',
    quantity: 12,
    unit: 'unidades',
    location: 'Refrigerador',
    expiryDate: getRelativeDateString(4), // Próximo (Quedan 2)
    barcode: '7501000789123',
    notes: 'Huevos de campo',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Leche',
    category: 'lacteos',
    quantity: 2,
    unit: 'L',
    location: 'Refrigerador',
    expiryDate: getRelativeDateString(10), // Vigente
    barcode: '7501000123456',
    notes: 'Leche entera pasteurizada',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'Arroz',
    category: 'granos',
    quantity: 1,
    unit: 'kg',
    location: 'Alacena',
    expiryDate: getRelativeDateString(100), // Vigente
    barcode: '7501000456789',
    notes: 'Arroz grano largo',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    name: 'Avena',
    category: 'granos',
    quantity: 1,
    unit: 'kg',
    location: 'Alacena',
    expiryDate: getRelativeDateString(180), // Vigente
    barcode: '7501000987654',
    notes: 'Avena en hojuelas entera',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SHOPPING_ITEMS: ShoppingItem[] = [
  {
    id: 'shop-1',
    name: 'Yogurt',
    category: 'lacteos',
    quantity: 2,
    unit: 'unidades',
    checked: false,
    reason: 'expired',
    productId: 'prod-1',
  },
  {
    id: 'shop-2',
    name: 'Manzanas',
    category: 'frutas',
    quantity: 1,
    unit: 'kg',
    checked: false,
    reason: 'expiring',
    productId: 'prod-2',
  },
  {
    id: 'shop-3',
    name: 'Huevos',
    category: 'proteinas',
    quantity: 12,
    unit: 'unidades',
    checked: false,
    reason: 'expiring',
    productId: 'prod-3',
  },
  {
    id: 'shop-4',
    name: 'Leche',
    category: 'lacteos',
    quantity: 1,
    unit: 'L',
    checked: false,
    reason: 'expired',
    productId: 'prod-4',
  },
  {
    id: 'shop-5',
    name: 'Arroz',
    category: 'granos',
    quantity: 1,
    unit: 'kg',
    checked: false,
    reason: 'low_stock',
    productId: 'prod-5',
  },
  {
    id: 'shop-6',
    name: 'Avena',
    category: 'granos',
    quantity: 500,
    unit: 'g',
    checked: true,
    reason: 'manual',
    productId: 'prod-6',
  },
];

export const INITIAL_USER: UserProfile = {
  id: 'usr-1',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  initials: 'J',
  lastSyncedAt: new Date().toISOString(),
};

export const INITIAL_PREFERENCES: UserPreferences = {
  language: 'es',
  darkMode: false,
  unitSystem: 'metric',
  expiryAlertDays: 3,
  purchaseReminders: true,
  soundEnabled: true,
};

export const INITIAL_NOTIFICATIONS: PantryNotification[] = [
  {
    id: 'notif-1',
    title: '¡Yogurt caducado!',
    message: 'El Yogurt en el refrigerador caducó hace 2 días. Se recomienda reponerlo.',
    type: 'error',
    productId: 'prod-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Manzanas por caducar',
    message: 'Las Manzanas en el frutero vencen en 3 días.',
    type: 'warning',
    productId: 'prod-2',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Huevos próximos a vencer',
    message: 'Quedan 4 días para la caducidad de los Huevos en el refrigerador.',
    type: 'warning',
    productId: 'prod-3',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    read: false,
  },
];

// Aliases for convenient importing
export const initialProducts = INITIAL_PRODUCTS;
export const initialShoppingItems = INITIAL_SHOPPING_ITEMS;
export const initialUser = INITIAL_USER;
export const initialPreferences = INITIAL_PREFERENCES;
export const initialNotifications = INITIAL_NOTIFICATIONS;

export const BARCODE_CATALOG: Record<string, Partial<Product>> = {
  '7501000654321': {
    name: 'Yogurt Griego Natural',
    category: 'lacteos',
    quantity: 2,
    unit: 'unidades',
    location: 'Refrigerador',
  },
  '7501000123456': {
    name: 'Leche Entera Pasteurizada',
    category: 'lacteos',
    quantity: 1,
    unit: 'L',
    location: 'Refrigerador',
  },
  '7501055300075': {
    name: 'Cereal Corn Flakes',
    category: 'granos',
    quantity: 1,
    unit: 'unidades',
    location: 'Alacena',
  },
  '7501000789123': {
    name: 'Huevos de Granja',
    category: 'proteinas',
    quantity: 12,
    unit: 'unidades',
    location: 'Refrigerador',
  },
  '7501000456789': {
    name: 'Arroz Grano Largo',
    category: 'granos',
    quantity: 1,
    unit: 'kg',
    location: 'Alacena',
  },
  '7501000987654': {
    name: 'Avena en Hojuelas',
    category: 'granos',
    quantity: 1,
    unit: 'kg',
    location: 'Alacena',
  },
  '016000275270': {
    name: 'Cheerios Honey Nut',
    category: 'granos',
    quantity: 1,
    unit: 'unidades',
    location: 'Alacena',
  },
  '041383090001': {
    name: 'Organic Valley Whole Milk',
    category: 'lacteos',
    quantity: 1,
    unit: 'L',
    location: 'Refrigerador',
  },
  '7501008041010': {
    name: 'Queso Panela',
    category: 'lacteos',
    quantity: 400,
    unit: 'g',
    location: 'Refrigerador',
  },
  '7501030401015': {
    name: 'Pasta Spaghetti',
    category: 'granos',
    quantity: 500,
    unit: 'g',
    location: 'Alacena',
  },
  '7501020512348': {
    name: 'Jugo de Naranja Natural',
    category: 'bebidas',
    quantity: 1,
    unit: 'L',
    location: 'Refrigerador',
  },
  '7501011122334': {
    name: 'Atún en Agua',
    category: 'proteinas',
    quantity: 3,
    unit: 'unidades',
    location: 'Alacena',
  },
};
