import { Language, ProductCategory, StorageLocation, UnitType } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  nav: {
    dashboard: string;
    shopping: string;
    aiInsights: string;
    profile: string;
  };
  aiInsights: {
    title: string;
    subtitle: string;
    refreshButton: string;
    refreshing: string;
    mealTabs: {
      all: string;
      breakfast: string;
      lunchDinner: string;
      express: string;
      dessertSnack: string;
    };
    rescuePriorityBadge: string;
    expiringSoonBadge: (days: number) => string;
    fromPantryBadge: string;
    extraIngredientsTitle: string;
    pantryIngredientsTitle: string;
    stepsTitle: string;
    chefTipTitle: string;
    zeroWasteTitle: string;
    addMissingToShopping: string;
    addedToShopping: string;
    saveRecipe: string;
    savedRecipe: string;
    savedRecipesTab: string;
    customPromptPlaceholder: string;
    generateCustom: string;
    expiredWarningTitle: string;
    expiredWarningDesc: (count: number) => string;
    askAdvisorTitle: string;
    askAdvisorSub: string;
    askPlaceholder: string;
    sendQuestion: string;
    suggestedQuestions: string[];
    noDataYet: string;
    servings: string;
    prep: string;
    cook: string;
  };
  dashboard: {
    searchPlaceholder: string;
    tabs: {
      actual: string;
      expiringSoon: string;
      expired: string;
      all: string;
    };
    filterAndSort: string;
    sortExpiry: string;
    sortName: string;
    sortQty: string;
    allProductsTitle: string;
    searchResultsTitle: string;
    productCount: (count: number) => string;
    noProducts: string;
    noCategoryProducts: string;
    addProduct: string;
    exportPdf: string;
    shareSuccess: string;
    statusFresh: string;
    statusExpiring: string;
    statusExpired: string;
    expiredDaysAgo: (days: number) => string;
    expiresInDays: (days: number) => string;
    expiresToday: string;
    remaining: (count: number) => string;
    deleteProductTitle: string;
    deleteProductConfirm: (name: string) => string;
    deleteAction: string;
    cancelAction: string;
  };
  productModal: {
    addTitle: string;
    editTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    categoryLabel: string;
    selectCategory: string;
    quantityLabel: string;
    unitLabel: string;
    selectUnit: string;
    locationLabel: string;
    selectLocation: string;
    expiryDateLabel: string;
    barcodeLabel: string;
    barcodePlaceholder: string;
    scanButton: string;
    saveButton: string;
    deleteButton: string;
    saving: string;
    savedSuccess: string;
    deletedSuccess: string;
    confirmDelete: string;
    validationNameRequired: string;
  };
  scanner: {
    title: string;
    instruction: string;
    simulateSuccess: string;
    manualInput: string;
    enterBarcodeTitle: string;
    enterBarcodePlaceholder: string;
    searchProduct: string;
    cameraError: string;
    cameraPermission: string;
    productFound: string;
    flashlight: string;
  };
  shopping: {
    title: string;
    subtitle: string;
    allTab: string;
    addItemPlaceholder: string;
    addButton: string;
    expiredReason: string;
    expiringReason: string;
    lowStockReason: string;
    addedStatus: string;
    generateList: string;
    listGeneratedTitle: string;
    listGeneratedDesc: string;
    exportPdf: string;
    acceptButton: string;
    emptyList: string;
    clearCompleted: string;
    deleteItem: string;
    itemDeleted: string;
  };
  profile: {
    title: string;
    backedUp: string;
    syncing: string;
    synced: string;
    accountSettings: string;
    accountSubtitle: string;
    sharedHousehold: string;
    householdSubtitle: string;
    appPreferences: string;
    preferencesSubtitle: string;
    logout: string;
    logoutConfirm: string;
  };
  preferences: {
    title: string;
    languageTitle: string;
    languageDesc: string;
    spanish: string;
    english: string;
    appearanceTitle: string;
    appearanceDesc: string;
    darkMode: string;
    unitsTitle: string;
    unitsDesc: string;
    metric: string;
    metricDetails: string;
    imperial: string;
    imperialDetails: string;
    saveChanges: string;
    savedToast: string;
  };
  household: {
    title: string;
    desc: string;
    inviteMember: string;
    currentMembers: (count: number) => string;
    youAdmin: string;
    member: string;
    pendingInvitation: string;
    invitePrompt: string;
    inviteSuccess: string;
    changeRole: string;
    removeMember: string;
    resendInvite: string;
    cancelInvite: string;
  };
  account: {
    title: string;
    subtitle: string;
    fullName: string;
    email: string;
    save: string;
    savedToast: string;
    security: string;
    currentPassword: string;
    newPassword: string;
    updatePassword: string;
    passwordUpdated: string;
    notifications: string;
    expiryAlerts: string;
    expiryAlertsDesc: string;
    purchaseReminders: string;
    purchaseRemindersDesc: string;
  };
  categories: Record<ProductCategory, string>;
  locations: Record<StorageLocation, string>;
  units: Record<UnitType, string>;
}

export const translations: Record<Language, Translations> = {
  es: {
    appName: 'Pantry Guard',
    tagline: 'Despensa Inteligente',
    nav: {
      dashboard: 'Dashboard',
      shopping: 'Compras',
      aiInsights: 'Chef & Recetas IA',
      profile: 'Perfil',
    },
    aiInsights: {
      title: 'Chef IA & Recetas de Aprovechamiento',
      subtitle: 'Recetas inteligentes basadas 100% en tu despensa actual para evitar el desperdicio, priorizando lo próximo a caducar.',
      refreshButton: 'Nuevas Recetas IA',
      refreshing: 'El Chef IA está creando tus recetas...',
      mealTabs: {
        all: 'Todas',
        breakfast: 'Desayunos',
        lunchDinner: 'Almuerzos y Cenas',
        express: 'Rápidas (<15 min)',
        dessertSnack: 'Snacks y Postres',
      },
      rescuePriorityBadge: 'Prioridad de Rescate',
      expiringSoonBadge: (days: number) => `Vence en ${days} día${days !== 1 ? 's' : ''}`,
      fromPantryBadge: 'En tu despensa',
      extraIngredientsTitle: 'Ingredientes extra / Condimentos básicos:',
      pantryIngredientsTitle: 'Ingredientes rescatados de tu despensa:',
      stepsTitle: 'Paso a paso:',
      chefTipTitle: 'Consejo del Chef Zero-Waste:',
      zeroWasteTitle: 'Impacto contra el desperdicio:',
      addMissingToShopping: 'Añadir faltantes a lista de compras',
      addedToShopping: '¡Añadido a compras!',
      saveRecipe: 'Guardar receta',
      savedRecipe: 'Guardada en favoritos',
      savedRecipesTab: 'Mis Recetas Guardadas',
      customPromptPlaceholder: 'Ej: Quiero algo vegetariano, una cena ligera o usar mis plátanos maduros...',
      generateCustom: 'Crear receta personalizada',
      expiredWarningTitle: 'Seguridad Alimentaria: Alimentos caducados excluidos',
      expiredWarningDesc: (count: number) => `Tienes ${count} producto(s) caducado(s) en tu despensa. Por salud y seguridad alimentaria, nunca se incluyen en las recetas. Te sugerimos desecharlos o compostarlos.`,
      askAdvisorTitle: 'Pregúntale al Chef IA en Vivo',
      askAdvisorSub: 'Consulta cómo sustituir ingredientes, técnicas de cocción o cómo conservar mejor tus alimentos.',
      askPlaceholder: 'Ej. ¿Con qué puedo sustituir el queso o cómo congelo mis verduras?',
      sendQuestion: 'Consultar al Chef',
      suggestedQuestions: [
        '¿Qué puedo cocinar en menos de 15 minutos con mis verduras?',
        '¿Cómo puedo aprovechar mis frutas maduras antes de que se dañen?',
        '¿Qué técnicas de conservación alargan la vida de mis lácteos?',
      ],
      noDataYet: 'Registra productos en tu despensa para que el Chef IA pueda recomendarte recetas a medida.',
      servings: 'porciones',
      prep: 'Prep',
      cook: 'Cocción',
    },
    dashboard: {
      searchPlaceholder: 'Buscar productos...',
      tabs: {
        actual: 'Actual',
        expiringSoon: 'Próximo a Caducar',
        expired: 'Caducados',
        all: 'Todos',
      },
      filterAndSort: 'Filtrar y Ordenar',
      sortExpiry: 'Fecha de caducidad (más próxima)',
      sortName: 'Nombre (A-Z)',
      sortQty: 'Cantidad (Mayor a menor)',
      allProductsTitle: 'Todos',
      searchResultsTitle: 'Resultados de búsqueda',
      productCount: (count: number) => `(${count} producto${count !== 1 ? 's' : ''})`,
      noProducts: 'No se encontraron productos',
      noCategoryProducts: 'No hay productos en esta categoría',
      addProduct: 'Agregar producto',
      exportPdf: 'Exportar PDF',
      shareSuccess: 'Compartiendo Dashboard...',
      statusFresh: 'Vigente',
      statusExpiring: 'Próximo',
      statusExpired: 'Caducado',
      expiredDaysAgo: (days: number) => `Caducó hace ${days} día${days !== 1 ? 's' : ''}`,
      expiresInDays: (days: number) => `Vence en ${days} día${days !== 1 ? 's' : ''}`,
      expiresToday: 'Vence hoy',
      remaining: (count: number) => `(Quedan ${count})`,
      deleteProductTitle: 'Eliminar Producto',
      deleteProductConfirm: (name: string) => `¿Estás seguro de que deseas eliminar "${name}" de tu despensa?`,
      deleteAction: 'Eliminar',
      cancelAction: 'Cancelar',
    },
    productModal: {
      addTitle: 'Agregar Producto',
      editTitle: 'Editar Producto',
      nameLabel: 'Nombre',
      namePlaceholder: 'Ej. Leche Entera',
      categoryLabel: 'Categoría',
      selectCategory: 'Seleccionar categoría...',
      quantityLabel: 'Cantidad',
      unitLabel: 'Unidad',
      selectUnit: 'Seleccionar...',
      locationLabel: 'Ubicación',
      selectLocation: 'Seleccionar ubicación...',
      expiryDateLabel: 'Fecha de caducidad',
      barcodeLabel: 'Código de barras',
      barcodePlaceholder: '000000000000',
      scanButton: 'Escanear',
      saveButton: 'Guardar',
      deleteButton: 'Eliminar',
      saving: 'Guardando...',
      savedSuccess: '¡Producto guardado con éxito!',
      deletedSuccess: 'Producto eliminado',
      confirmDelete: '¿Estás seguro de que deseas eliminar este producto?',
      validationNameRequired: 'Por favor, ingresa un nombre para el producto.',
    },
    scanner: {
      title: 'Escáner de Código de Barras',
      instruction: 'Apunta la cámara al código de barras',
      simulateSuccess: 'Simular escaneo exitoso',
      manualInput: 'Ingresar código manualmente',
      enterBarcodeTitle: 'Ingresar Código de Barras',
      enterBarcodePlaceholder: 'Escribe el código numérico (ej. 7501000123456)',
      searchProduct: 'Buscar producto',
      cameraError: 'No se pudo acceder a la cámara. Puedes usar la simulación o el ingreso manual.',
      cameraPermission: 'Permiso de cámara requerido para escanear en vivo.',
      productFound: '¡Producto identificado!',
      flashlight: 'Linterna',
    },
    shopping: {
      title: 'Lista de Compras',
      subtitle: 'Productos sugeridos basados en tu inventario y caducidades.',
      allTab: 'Todos',
      addItemPlaceholder: 'Añadir otro producto...',
      addButton: 'Añadir',
      expiredReason: 'Caducado',
      expiringReason: 'Próximo',
      lowStockReason: 'Queda poco',
      addedStatus: 'Añadido',
      generateList: 'Generar Lista',
      listGeneratedTitle: '¡Lista Generada!',
      listGeneratedDesc: 'Tu lista de compras ha sido exportada y está lista para compartirse o usarse en la tienda.',
      exportPdf: 'Descargar PDF',
      acceptButton: 'Aceptar',
      emptyList: 'No hay elementos en la lista de compras.',
      clearCompleted: 'Limpiar comprados',
      deleteItem: 'Eliminar de la lista',
      itemDeleted: 'Artículo eliminado de la lista de compras',
    },
    profile: {
      title: 'Perfil',
      backedUp: 'Datos respaldados',
      syncing: 'Sincronizando...',
      synced: 'Sincronizado',
      accountSettings: 'Configuración de cuenta',
      accountSubtitle: 'Contraseña, notificaciones',
      sharedHousehold: 'Hogar compartido',
      householdSubtitle: 'Gestionar miembros',
      appPreferences: 'Preferencias de la aplicación',
      preferencesSubtitle: 'Tema oscuro, idioma, unidades',
      logout: 'Cerrar sesión',
      logoutConfirm: '¿Estás seguro de que deseas cerrar sesión?',
    },
    preferences: {
      title: 'Preferencias',
      languageTitle: 'Idioma',
      languageDesc: 'Selecciona el idioma de la aplicación.',
      spanish: 'Español',
      english: 'Inglés',
      appearanceTitle: 'Apariencia',
      appearanceDesc: 'Activar o desactivar el tema oscuro.',
      darkMode: 'Modo Oscuro',
      unitsTitle: 'Unidades de Medida',
      unitsDesc: 'Elige el sistema de unidades para tus recetas e inventario.',
      metric: 'Métrico',
      metricDetails: '(kg, L, cm)',
      imperial: 'Imperial',
      imperialDetails: '(lb, oz, in)',
      saveChanges: 'Guardar Cambios',
      savedToast: 'Preferencias actualizadas con éxito',
    },
    household: {
      title: 'Hogar compartido',
      desc: 'Gestiona los miembros de tu familia o compañeros de piso. Todos los miembros tendrán acceso a la despensa y lista de compras compartida.',
      inviteMember: 'Invitar nuevo miembro',
      currentMembers: (count: number) => `Miembros actuales (${count})`,
      youAdmin: 'Tú • Administrador',
      member: 'Miembro',
      pendingInvitation: 'Invitación pendiente',
      invitePrompt: 'Introduce el correo electrónico del nuevo miembro:',
      inviteSuccess: 'Invitación enviada con éxito',
      changeRole: 'Cambiar rol',
      removeMember: 'Eliminar del hogar',
      resendInvite: 'Reenviar invitación',
      cancelInvite: 'Cancelar invitación',
    },
    account: {
      title: 'Configuración',
      subtitle: 'Gestiona los detalles de tu cuenta y preferencias.',
      fullName: 'Nombre completo',
      email: 'Correo electrónico',
      save: 'Guardar',
      savedToast: 'Datos guardados correctamente',
      security: 'Seguridad',
      currentPassword: 'Contraseña actual',
      newPassword: 'Nueva contraseña',
      updatePassword: 'Actualizar Contraseña',
      passwordUpdated: '¡Contraseña Actualizada!',
      notifications: 'Notificaciones',
      expiryAlerts: 'Alertas de caducidad',
      expiryAlertsDesc: 'Avisos 3 días antes del vencimiento',
      purchaseReminders: 'Recordatorios de compra',
      purchaseRemindersDesc: 'Al agregar ítems a la lista',
    },
    categories: {
      lacteos: 'Lácteos',
      frutas: 'Frutas',
      proteinas: 'Proteínas',
      granos: 'Granos',
      verduras: 'Verduras',
      bebidas: 'Bebidas',
      otros: 'Otros',
    },
    locations: {
      Refrigerador: 'Refrigerador',
      Alacena: 'Alacena',
      Frutero: 'Frutero',
      Congelador: 'Congelador',
      Despensa: 'Despensa',
      Otro: 'Otro',
    },
    units: {
      unidades: 'Unidades',
      kg: 'kg',
      g: 'g',
      L: 'L',
      ml: 'ml',
      lb: 'lb',
      oz: 'oz',
    },
  },
  en: {
    appName: 'Pantry Guard',
    tagline: 'Smart Pantry Management',
    nav: {
      dashboard: 'Dashboard',
      shopping: 'Shopping',
      aiInsights: 'AI Chef & Recipes',
      profile: 'Profile',
    },
    aiInsights: {
      title: 'AI Chef & Zero-Waste Recipes',
      subtitle: 'Smart recipes built 100% around your current pantry items to prevent food waste, prioritizing near-expiry ingredients.',
      refreshButton: 'New AI Recipes',
      refreshing: 'AI Chef is crafting your recipes...',
      mealTabs: {
        all: 'All',
        breakfast: 'Breakfast',
        lunchDinner: 'Lunch & Dinner',
        express: 'Quick (<15 min)',
        dessertSnack: 'Snacks & Desserts',
      },
      rescuePriorityBadge: 'Rescue Priority',
      expiringSoonBadge: (days: number) => `Expires in ${days} day${days !== 1 ? 's' : ''}`,
      fromPantryBadge: 'In your pantry',
      extraIngredientsTitle: 'Extra ingredients / Common staples:',
      pantryIngredientsTitle: 'Ingredients rescued from your pantry:',
      stepsTitle: 'Step-by-step preparation:',
      chefTipTitle: 'Zero-Waste Chef Tip:',
      zeroWasteTitle: 'Waste prevention impact:',
      addMissingToShopping: 'Add missing to shopping list',
      addedToShopping: 'Added to shopping list!',
      saveRecipe: 'Save recipe',
      savedRecipe: 'Saved to favorites',
      savedRecipesTab: 'My Saved Recipes',
      customPromptPlaceholder: 'e.g. Vegetarian dish, light dinner, or use my ripe bananas...',
      generateCustom: 'Create custom recipe',
      expiredWarningTitle: 'Food Safety: Expired items excluded',
      expiredWarningDesc: (count: number) => `You have ${count} expired item(s) in your pantry. For health and food safety, they are never included in recipes. We recommend composting or safely discarding them.`,
      askAdvisorTitle: 'Ask the Live AI Chef',
      askAdvisorSub: 'Ask how to substitute ingredients, cooking techniques, or how to store your food better.',
      askPlaceholder: 'e.g. How can I substitute cheese or freeze fresh greens?',
      sendQuestion: 'Ask Chef',
      suggestedQuestions: [
        'What can I cook in under 15 minutes with my vegetables?',
        'How can I use overripe fruits before they spoil?',
        'What storage tips will keep my dairy fresh longer?',
      ],
      noDataYet: 'Add products to your pantry so the AI Chef can recommend customized recipes.',
      servings: 'servings',
      prep: 'Prep',
      cook: 'Cook',
    },
    dashboard: {
      searchPlaceholder: 'Search products...',
      tabs: {
        actual: 'Fresh',
        expiringSoon: 'Expiring Soon',
        expired: 'Expired',
        all: 'All',
      },
      filterAndSort: 'Filter & Sort',
      sortExpiry: 'Expiration date (soonest first)',
      sortName: 'Name (A-Z)',
      sortQty: 'Quantity (High to Low)',
      allProductsTitle: 'All',
      searchResultsTitle: 'Search Results',
      productCount: (count: number) => `(${count} product${count !== 1 ? 's' : ''})`,
      noProducts: 'No products found',
      noCategoryProducts: 'No products in this category',
      addProduct: 'Add Product',
      exportPdf: 'Export PDF',
      shareSuccess: 'Sharing Dashboard...',
      statusFresh: 'Fresh',
      statusExpiring: 'Expiring',
      statusExpired: 'Expired',
      expiredDaysAgo: (days: number) => `Expired ${days} day${days !== 1 ? 's' : ''} ago`,
      expiresInDays: (days: number) => `Expires in ${days} day${days !== 1 ? 's' : ''}`,
      expiresToday: 'Expires today',
      remaining: (count: number) => `(${count} left)`,
      deleteProductTitle: 'Delete Product',
      deleteProductConfirm: (name: string) => `Are you sure you want to delete "${name}" from your pantry?`,
      deleteAction: 'Delete',
      cancelAction: 'Cancel',
    },
    productModal: {
      addTitle: 'Add Product',
      editTitle: 'Edit Product',
      nameLabel: 'Name',
      namePlaceholder: 'e.g. Whole Milk',
      categoryLabel: 'Category',
      selectCategory: 'Select category...',
      quantityLabel: 'Quantity',
      unitLabel: 'Unit',
      selectUnit: 'Select...',
      locationLabel: 'Location',
      selectLocation: 'Select location...',
      expiryDateLabel: 'Expiration date',
      barcodeLabel: 'Barcode',
      barcodePlaceholder: '000000000000',
      scanButton: 'Scan',
      saveButton: 'Save',
      deleteButton: 'Delete',
      saving: 'Saving...',
      savedSuccess: 'Product saved successfully!',
      deletedSuccess: 'Product deleted',
      confirmDelete: 'Are you sure you want to delete this product?',
      validationNameRequired: 'Please enter a name for the product.',
    },
    scanner: {
      title: 'Barcode Scanner',
      instruction: 'Point camera at the barcode',
      simulateSuccess: 'Simulate successful scan',
      manualInput: 'Enter code manually',
      enterBarcodeTitle: 'Enter Barcode',
      enterBarcodePlaceholder: 'Type numeric barcode (e.g. 7501000123456)',
      searchProduct: 'Lookup product',
      cameraError: 'Could not access camera. You can use simulation or manual entry.',
      cameraPermission: 'Camera permission required for live scanning.',
      productFound: 'Product identified!',
      flashlight: 'Flashlight',
    },
    shopping: {
      title: 'Shopping List',
      subtitle: 'Suggested items based on your inventory and expirations.',
      allTab: 'All',
      addItemPlaceholder: 'Add another product...',
      addButton: 'Add',
      expiredReason: 'Expired',
      expiringReason: 'Expiring soon',
      lowStockReason: 'Low stock',
      addedStatus: 'Added',
      generateList: 'Generate List',
      listGeneratedTitle: 'List Generated!',
      listGeneratedDesc: 'Your shopping list has been exported and is ready to share or use at the grocery store.',
      exportPdf: 'Download PDF',
      acceptButton: 'Accept',
      emptyList: 'No items in the shopping list.',
      clearCompleted: 'Clear completed',
      deleteItem: 'Delete from list',
      itemDeleted: 'Item removed from shopping list',
    },
    profile: {
      title: 'Profile',
      backedUp: 'Data backed up',
      syncing: 'Syncing...',
      synced: 'Synced',
      accountSettings: 'Account Settings',
      accountSubtitle: 'Password, notifications',
      sharedHousehold: 'Shared Household',
      householdSubtitle: 'Manage members',
      appPreferences: 'App Preferences',
      preferencesSubtitle: 'Dark mode, language, units',
      logout: 'Log Out',
      logoutConfirm: 'Are you sure you want to log out?',
    },
    preferences: {
      title: 'Preferences',
      languageTitle: 'Language',
      languageDesc: 'Select application language.',
      spanish: 'Spanish',
      english: 'English',
      appearanceTitle: 'Appearance',
      appearanceDesc: 'Enable or disable dark mode.',
      darkMode: 'Dark Mode',
      unitsTitle: 'Units of Measure',
      unitsDesc: 'Choose unit system for recipes and inventory.',
      metric: 'Metric',
      metricDetails: '(kg, L, cm)',
      imperial: 'Imperial',
      imperialDetails: '(lb, oz, in)',
      saveChanges: 'Save Changes',
      savedToast: 'Preferences updated successfully',
    },
    household: {
      title: 'Shared Household',
      desc: 'Manage members of your family or roommates. All members will have access to the shared pantry and shopping list.',
      inviteMember: 'Invite new member',
      currentMembers: (count: number) => `Current members (${count})`,
      youAdmin: 'You • Admin',
      member: 'Member',
      pendingInvitation: 'Pending invitation',
      invitePrompt: 'Enter the new member\'s email address:',
      inviteSuccess: 'Invitation sent successfully',
      changeRole: 'Change role',
      removeMember: 'Remove from household',
      resendInvite: 'Resend invitation',
      cancelInvite: 'Cancel invitation',
    },
    account: {
      title: 'Settings',
      subtitle: 'Manage your account details and preferences.',
      fullName: 'Full Name',
      email: 'Email address',
      save: 'Save',
      savedToast: 'Profile updated successfully',
      security: 'Security',
      currentPassword: 'Current password',
      newPassword: 'New password',
      updatePassword: 'Update Password',
      passwordUpdated: 'Password Updated!',
      notifications: 'Notifications',
      expiryAlerts: 'Expiry alerts',
      expiryAlertsDesc: 'Notified 3 days before expiration',
      purchaseReminders: 'Purchase reminders',
      purchaseRemindersDesc: 'When adding items to list',
    },
    categories: {
      lacteos: 'Dairy',
      frutas: 'Fruits',
      proteinas: 'Proteins',
      granos: 'Grains',
      verduras: 'Vegetables',
      bebidas: 'Beverages',
      otros: 'Other',
    },
    locations: {
      Refrigerador: 'Refrigerator',
      Alacena: 'Pantry Shelf',
      Frutero: 'Fruit Bowl',
      Congelador: 'Freezer',
      Despensa: 'Pantry',
      Otro: 'Other',
    },
    units: {
      unidades: 'Units',
      kg: 'kg',
      g: 'g',
      L: 'L',
      ml: 'ml',
      lb: 'lb',
      oz: 'oz',
    },
  },
};
