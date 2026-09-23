import React, { useEffect, useState, useTransition } from 'react';
import { AccountSettingsView } from './components/AccountSettingsView';
import { AIInsightsView } from './components/AIInsightsView';
import { AuthModal } from './components/AuthModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { BottomNavBar } from './components/BottomNavBar';
import { DashboardView } from './components/DashboardView';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { PreferencesView } from './components/PreferencesView';
import { ProductModal } from './components/ProductModal';
import { ProfileView } from './components/ProfileView';
import { ShoppingListView } from './components/ShoppingListView';
import { TopAppBar } from './components/TopAppBar';
import { ReceiptScanModal } from './components/ReceiptScanModal';
import {
  initialNotifications,
  initialPreferences,
  initialProducts,
  initialShoppingItems,
  initialUser,
} from './data/initialData';
import {
  NavigationTab,
  PantryNotification,
  Product,
  ReceiptParsedItem,
  ShoppingItem,
  UserPreferences,
  UserProfile,
} from './types';
import { calculateProductStatus, lookupBarcode, saveLearnedBarcode, BarcodeLookupResult } from './utils/barcodeService';
import { translations } from './utils/i18n';

export default function App() {
  const [, startTransition] = useTransition();

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Persistence State
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pantry_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return initialProducts;
  });

  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('pantry_shopping_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return initialShoppingItems;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('pantry_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...initialUser, ...parsed };
      } catch {}
    }
    return initialUser;
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('pantry_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...initialPreferences, ...parsed };
      } catch {}
    }
    return initialPreferences;
  });

  const [notifications, setNotifications] = useState<PantryNotification[]>(() => {
    const saved = localStorage.getItem('pantry_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return initialNotifications;
  });

  // Modal States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Feedback / Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Apply dark mode class to <html>
  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('pantry_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pantry_shopping_items', JSON.stringify(shoppingItems));
  }, [shoppingItems]);

  useEffect(() => {
    localStorage.setItem('pantry_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pantry_preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('pantry_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Expiration detection & smart auto-notification generation
  useEffect(() => {
    const newNotifications: PantryNotification[] = [];

    products.forEach((p) => {
      const { status, diffDays } = calculateProductStatus(
        p.expiryDate,
        preferences.expiryAlertDays
      );

      if (status === 'expired') {
        const alreadyNotified = notifications.some(
          (n) => n.productId === p.id && n.type === 'error'
        );
        if (!alreadyNotified) {
          newNotifications.push({
            id: `notif-exp-${p.id}-${Date.now()}`,
            title: `¡${p.name} ha caducado!`,
            message: `Caducó hace ${Math.abs(diffDays)} día(s). Se recomienda reponer.`,
            type: 'error',
            productId: p.id,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      } else if (status === 'expiring') {
        const alreadyNotified = notifications.some(
          (n) => n.productId === p.id && n.type === 'warning'
        );
        if (!alreadyNotified) {
          newNotifications.push({
            id: `notif-warn-${p.id}-${Date.now()}`,
            title: `¡${p.name} vence pronto!`,
            message: `Quedan ${diffDays} día(s) antes de su fecha de caducidad.`,
            type: 'warning',
            productId: p.id,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    });

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev]);
    }
  }, [products, preferences.expiryAlertDays]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((curr) => (curr === message ? null : curr));
    }, 3200);
  };

  // Barcode Scan Handler
  const handleBarcodeScanned = async (code: string, foundData?: BarcodeLookupResult) => {
    setIsScannerOpen(false);

    const result = foundData || (await lookupBarcode(code));

    if (result && result.found) {
      // Pre-fill Product Modal
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const nowIso = new Date().toISOString();

      setEditingProduct({
        id: '',
        name: result.name || '',
        category: result.category || 'otros',
        quantity: result.quantity || 1,
        unit: result.unit || 'unidades',
        location: result.location || 'Refrigerador',
        expiryDate: result.expiryDate || d.toISOString().split('T')[0],
        barcode: result.barcode,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      setIsProductModalOpen(true);
      showToast(`¡Producto encontrado: ${result.name}!`);
    } else {
      // Unrecognized barcode, open add product modal with barcode set
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const nowIso = new Date().toISOString();

      setEditingProduct({
        id: '',
        name: '',
        category: 'otros',
        quantity: 1,
        unit: 'unidades',
        location: 'Refrigerador',
        expiryDate: d.toISOString().split('T')[0],
        barcode: code,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      setIsProductModalOpen(true);
      showToast('Código no registrado. Completa los detalles.');
    }
  };

  // Product Operations
  const handleSaveProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const now = new Date().toISOString();

    // Learn barcode for future instant lookup
    if (productData.barcode && productData.barcode.trim()) {
      saveLearnedBarcode(productData.barcode.trim(), {
        name: productData.name,
        category: productData.category,
        location: productData.location,
        quantity: productData.quantity,
        unit: productData.unit,
      });
    }

    if (id) {
      // Update existing
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...productData, updatedAt: now }
            : p
        )
      );
      showToast(
        preferences.language === 'es'
          ? '¡Producto actualizado correctamente!'
          : 'Product updated successfully!'
      );
    } else {
      // Add new
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        ...productData,
        createdAt: now,
        updatedAt: now,
      };
      setProducts((prev) => [newProduct, ...prev]);

      // If quantity is low or expired, check if we should add suggestion to shopping list
      const { status } = calculateProductStatus(
        newProduct.expiryDate,
        preferences.expiryAlertDays
      );
      if (status === 'expired' || status === 'expiring') {
        const itemExists = shoppingItems.some(
          (it) => it.name.toLowerCase() === newProduct.name.toLowerCase()
        );
        if (!itemExists) {
          setShoppingItems((prev) => [
            {
              id: `shop-${Date.now()}`,
              name: newProduct.name,
              category: newProduct.category,
              quantity: newProduct.quantity || 1,
              unit: newProduct.unit || 'unidades',
              checked: false,
              reason: status === 'expired' ? 'expired' : 'expiring',
              productId: newProduct.id,
            },
            ...prev,
          ]);
        }
      }

      showToast(
        preferences.language === 'es'
          ? '¡Producto guardado con éxito en la despensa!'
          : 'Product saved to pantry!'
      );
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(
      preferences.language === 'es'
        ? 'Producto eliminado de la despensa'
        : 'Product deleted from pantry'
    );
  };

  // Consume a product and auto-sync with shopping list
  const handleConsumeProduct = (product: Product, addToShoppingList = true) => {
    setProducts((prev) => prev.filter((p) => p.id !== product.id));

    if (addToShoppingList) {
      const itemExists = shoppingItems.some(
        (it) => it.name.toLowerCase() === product.name.toLowerCase() && !it.checked
      );
      if (!itemExists) {
        const newItem: ShoppingItem = {
          id: `shop-${Date.now()}`,
          name: product.name,
          category: product.category,
          quantity: product.quantity || 1,
          unit: product.unit || 'unidades',
          checked: false,
          reason: 'low_stock',
          productId: product.id,
        };
        setShoppingItems((prev) => [newItem, ...prev]);
        showToast(
          preferences.language === 'es'
            ? `¡${product.name} marcado como consumido y añadido a tu lista de compras!`
            : `Marked ${product.name} as consumed & added to shopping list!`
        );
        return;
      }
    }

    showToast(
      preferences.language === 'es'
        ? `¡${product.name} consumido!`
        : `${product.name} consumed!`
    );
  };

  // Batch add products from Receipt Scanner OCR
  const handleBatchAddProducts = (newItems: ReceiptParsedItem[]) => {
    if (!newItems || newItems.length === 0) return;
    const now = new Date().toISOString();
    const created: Product[] = newItems.map((item, idx) => ({
      id: `prod-${Date.now()}-${idx}`,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      location: item.location,
      expiryDate: item.expiryDate,
      createdAt: now,
      updatedAt: now,
    }));

    setProducts((prev) => [...created, ...prev]);
    showToast(
      preferences.language === 'es'
        ? `¡${created.length} productos del ticket agregados con éxito!`
        : `Successfully imported ${created.length} products from receipt!`
    );
  };

  // Shopping List Operations
  const handleToggleShoppingItem = (id: string) => {
    setShoppingItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleAddShoppingItem = (itemData: Omit<ShoppingItem, 'id'>) => {
    const newItem: ShoppingItem = {
      id: `shop-${Date.now()}`,
      ...itemData,
    };
    setShoppingItems((prev) => [newItem, ...prev]);
  };

  const handleRemoveShoppingItem = (id: string) => {
    setShoppingItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleClearCompletedShopping = () => {
    setShoppingItems((prev) => prev.filter((it) => !it.checked));
    showToast(
      preferences.language === 'es'
        ? 'Artículos completados removidos'
        : 'Completed items removed'
    );
  };

  const handleMoveCheckedToPantry = () => {
    const checkedItems = shoppingItems.filter((it) => it.checked);
    if (checkedItems.length === 0) return;

    const now = new Date().toISOString();
    const newProds: Product[] = checkedItems.map((it) => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return {
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: it.name,
        category: it.category,
        quantity: it.quantity || 1,
        unit: it.unit || 'unidades',
        location: it.category === 'lacteos' || it.category === 'proteinas' ? 'Refrigerador' : 'Alacena',
        expiryDate: d.toISOString().split('T')[0],
        createdAt: now,
        updatedAt: now,
      };
    });

    setProducts((prev) => [...newProds, ...prev]);
    setShoppingItems((prev) => prev.filter((it) => !it.checked));
    showToast(
      preferences.language === 'es'
        ? `¡${checkedItems.length} producto(s) guardados en tu despensa!`
        : `Moved ${checkedItems.length} item(s) to your pantry!`
    );
  };

  // Cloud Sync Simulation
  const handleSyncData = async () => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    setUser((prev) => ({
      ...prev,
      lastSyncedAt: new Date().toISOString(),
    }));
  };

  const handleTestNotification = async () => {
    let perm = 'default';
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        perm = await Notification.requestPermission();
      } catch {}
    }

    const testItem: PantryNotification = {
      id: `notif-test-${Date.now()}`,
      title: currentLang === 'es' ? '🔔 Alerta de Prueba: Leche Entera' : '🔔 Test Alert: Whole Milk',
      message:
        currentLang === 'es'
          ? 'Este es un ejemplo real de cómo Pantry Guard te avisa cuando un alimento está próximo a vencer.'
          : 'This is a live example of how Pantry Guard alerts you before food spoils.',
      type: 'warning',
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [testItem, ...prev]);

    if (perm === 'granted' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        new Notification(testItem.title, {
          body: testItem.message,
        });
      } catch {}
    }

    try {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch {}

    showToast(
      currentLang === 'es'
        ? '¡Notificación enviada! Revisa la campanita en la parte superior.'
        : 'Notification sent! Check the bell icon at the top.'
    );
  };

  const handleShareApp = async () => {
    const shareTitle = 'Pantry Guard - Despensa Inteligente Cero Desperdicio';
    const shareText = currentLang === 'es'
      ? '¡Hola! Estoy usando Pantry Guard para gestionar mi despensa, evitar el desperdicio y cocinar con IA. Pruébala aquí:'
      : 'Hello! I am using Pantry Guard to manage my pantry, stop food waste and cook with AI. Check it out here:';
    const shareUrl = window.location.href.includes('localhost')
      ? 'https://pantryguard.onrender.com'
      : window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareText} ${shareUrl}`,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
      showToast(
        currentLang === 'es'
          ? '¡Enlace de Pantry Guard copiado al portapapeles!'
          : 'Pantry Guard link copied to clipboard!'
      );
    } catch {
      showToast(
        currentLang === 'es'
          ? 'Enlace: https://pantryguard.onrender.com'
          : 'Link: https://pantryguard.onrender.com'
      );
    }
  };

  const unreadNotificationsCount = (notifications || []).filter((n) => !n.read).length;
  const currentLang = preferences?.language || 'es';
  const t = translations[currentLang];

  const getTopBarTitle = () => {
    switch (activeTab) {
      case 'shopping':
        return t.shopping.title;
      case 'ai-insights':
        return t.aiInsights.title;
      case 'profile':
        return t.profile.title;
      case 'preferences':
        return t.preferences.title;
      case 'account':
        return t.account.title;
      case 'dashboard':
      default:
        return t.appName;
    }
  };

  const isSubView = activeTab === 'preferences' || activeTab === 'account';

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#111418] text-[#191c20] dark:text-[#f8f9ff] flex flex-col font-sans transition-colors duration-150 antialiased selection:bg-[#004a21] selection:text-white">
      {/* Top Application Bar */}
      <TopAppBar
        currentTab={activeTab}
        onNavigate={(tab) => startTransition(() => setActiveTab(tab))}
        notifications={notifications}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onShare={handleShareApp}
        user={user}
        preferences={preferences}
        title={getTopBarTitle()}
        showBack={isSubView}
        onBack={() => setActiveTab('profile')}
      />

      {/* Main View Area with dynamic safe area offset so top elements never get cut off */}
      <main className="flex-1 flex flex-col pt-[calc(4rem+env(safe-area-inset-top,0px)+12px)] pb-[calc(5rem+env(safe-area-inset-bottom,0px)+16px)] w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            onOpenAddModal={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            onOpenEditModal={(product) => {
              setEditingProduct(product);
              setIsProductModalOpen(true);
            }}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenReceiptScanner={() => setIsReceiptScannerOpen(true)}
            onCookSmartRecipes={() => setActiveTab('ai-insights')}
            onDeleteProduct={handleDeleteProduct}
            user={user}
            preferences={preferences}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListView
            items={shoppingItems}
            onToggleItem={handleToggleShoppingItem}
            onAddItem={handleAddShoppingItem}
            onRemoveItem={handleRemoveShoppingItem}
            onClearCompleted={handleClearCompletedShopping}
            onMoveCheckedToPantry={handleMoveCheckedToPantry}
            user={user}
            preferences={preferences}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'ai-insights' && (
          <AIInsightsView
            products={products}
            shoppingItems={shoppingItems}
            preferences={preferences}
            user={user}
            onAddShoppingItem={handleAddShoppingItem}
            onShowToast={showToast}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            preferences={preferences}
            onNavigateToAccount={() => setActiveTab('account')}
            onNavigateToPreferences={() => setActiveTab('preferences')}
            onLogout={() => {
              setIsAuthModalOpen(true);
            }}
            onSyncData={handleSyncData}
            onShowToast={showToast}
            onTestNotification={handleTestNotification}
          />
        )}

        {activeTab === 'preferences' && (
          <PreferencesView
            preferences={preferences}
            onUpdatePreferences={(updated) =>
              setPreferences((prev) => ({ ...prev, ...updated }))
            }
            onBack={() => setActiveTab('profile')}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'account' && (
          <AccountSettingsView
            user={user}
            preferences={preferences}
            onUpdateProfile={(updated) =>
              setUser((prev) => ({ ...prev, ...updated }))
            }
            onUpdatePreferences={(updated) =>
              setPreferences((prev) => ({ ...prev, ...updated }))
            }
            onBack={() => setActiveTab('profile')}
            onLogout={() => setIsAuthModalOpen(true)}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={(tab) => startTransition(() => setActiveTab(tab))}
        shoppingCount={(shoppingItems || []).filter((i) => !i.checked).length}
        preferences={preferences}
      />

      {/* Real Barcode Scanner Modal with Camera Access */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeScanned}
        onQuickAddProduct={(productData) => handleSaveProduct(productData)}
        preferences={preferences}
        onShowToast={showToast}
      />

      {/* Receipt OCR Scanner Modal */}
      <ReceiptScanModal
        isOpen={isReceiptScannerOpen}
        onClose={() => setIsReceiptScannerOpen(false)}
        onImportProducts={handleBatchAddProducts}
        preferences={preferences}
        onShowToast={showToast}
      />

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        onConsumeProduct={handleConsumeProduct}
        initialProduct={editingProduct}
        onOpenScanner={() => {
          setIsProductModalOpen(false);
          setIsScannerOpen(true);
        }}
        preferences={preferences}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        onClearAll={() => setNotifications([])}
        onSelectProduct={(productId) => {
          const product = products.find((p) => p.id === productId);
          if (product) {
            setEditingProduct(product);
            setIsProductModalOpen(true);
          }
        }}
        preferences={preferences}
      />

      {/* Auth / Account Switch Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={(newUser) => {
          setUser(newUser);
        }}
        preferences={preferences}
        onShowToast={showToast}
      />

      {/* Floating Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#191c20] dark:bg-[#f8f9ff] text-white dark:text-[#191c20] text-xs font-semibold rounded-full shadow-2xl flex items-center gap-2 border border-[#707a6f]/40 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="material-symbols-outlined text-[18px] text-[#87d897] dark:text-[#004a21]">
            info
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
