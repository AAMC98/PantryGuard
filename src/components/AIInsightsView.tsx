import React, { useState, useEffect } from 'react';
import {
  AIRecipe,
  AIRecipeResponse,
  Product,
  ShoppingItem,
  UserPreferences,
  UserProfile,
  ProductCategory,
  UnitType,
} from '../types';
import { translations } from '../utils/i18n';
import { apiUrl } from '../utils/apiConfig';
import { generateClientLocalRecipes } from '../utils/localRecipeGenerator';

interface AIInsightsViewProps {
  products: Product[];
  shoppingItems: ShoppingItem[];
  preferences: UserPreferences;
  user: UserProfile;
  onAddShoppingItem: (item: Omit<ShoppingItem, 'id'>) => void;
  onShowToast: (message: string) => void;
  onNavigateTab: (tab: any) => void;
}

type MealCategoryFilter = 'all' | 'desayuno' | 'almuerzo_cena' | 'express' | 'postre_snack' | 'saved';

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  products,
  preferences,
  user,
  onAddShoppingItem,
  onShowToast,
}) => {
  const t = translations[preferences.language || 'es'];
  const isSpanish = preferences.language !== 'en';

  const [recipeData, setRecipeData] = useState<AIRecipeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<MealCategoryFilter>('all');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [savedRecipes, setSavedRecipes] = useState<AIRecipe[]>(() => {
    try {
      const stored = localStorage.getItem('pantry_guard_saved_recipes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeRecipeDetails, setActiveRecipeDetails] = useState<AIRecipe | null>(null);
  const [addedExtraItems, setAddedExtraItems] = useState<Record<string, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // Expiration calculation for pantry safety indicators
  const now = new Date();
  const validPantryItems = products.filter((p) => {
    const exp = new Date(p.expiryDate);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 0;
  });

  const expiringSoonItems = products.filter((p) => {
    const exp = new Date(p.expiryDate);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 5;
  });

  const expiredItems = products.filter((p) => {
    const exp = new Date(p.expiryDate);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays < 0;
  });

  // Fetch or generate zero-waste recipes
  const fetchRecipes = async (promptOverride?: string, mealTypeOverride?: string) => {
    setIsLoading(true);
    let resolvedData: AIRecipeResponse | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout to allow Render free tier to wake up

      const response = await fetch(apiUrl('/api/ai/recipes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          products,
          mealType: mealTypeOverride || selectedCategory,
          customPrompt: promptOverride !== undefined ? promptOverride : customPrompt,
          preferences,
        }),
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data: AIRecipeResponse = await response.json();
        if (data && Array.isArray(data.recipes) && data.recipes.length > 0) {
          resolvedData = data;
          onShowToast(
            isSpanish
              ? '¡El Chef IA ha creado nuevas recetas con tu despensa!'
              : 'AI Chef created new zero-waste recipes!'
          );
        }
      }
    } catch (error) {
      console.warn('Cloud AI fetch timed out or offline, using smart local engine:', error);
    }

    // Guaranteed fallback: If cloud is offline, sleeping, or APK localhost:
    if (!resolvedData) {
      resolvedData = generateClientLocalRecipes(products, preferences);
      onShowToast(
        isSpanish
          ? '¡Chef IA: Recetas listas con tus ingredientes!'
          : 'Chef IA: Recipes ready with your ingredients!'
      );
    }

    setRecipeData(resolvedData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRecipes();
  }, [preferences.language]);

  // Handle saving recipe to local favorites
  const toggleSaveRecipe = (recipe: AIRecipe) => {
    const isAlreadySaved = savedRecipes.some((r) => r.id === recipe.id || r.title === recipe.title);
    let updated: AIRecipe[];
    if (isAlreadySaved) {
      updated = savedRecipes.filter((r) => r.id !== recipe.id && r.title !== recipe.title);
      onShowToast(isSpanish ? 'Receta eliminada de guardadas.' : 'Recipe removed from saved.');
    } else {
      updated = [{ ...recipe, isSaved: true }, ...savedRecipes];
      onShowToast(isSpanish ? '¡Receta guardada en tus favoritas!' : 'Recipe saved to favorites!');
    }
    setSavedRecipes(updated);
    try {
      localStorage.setItem('pantry_guard_saved_recipes', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  };

  // Add extra ingredients to shopping list
  const handleAddExtraToShopping = (ingredientName: string, category: ProductCategory = 'otros') => {
    onAddShoppingItem({
      name: ingredientName,
      category,
      quantity: 1,
      unit: 'unidades' as UnitType,
      checked: false,
      reason: 'low_stock',
      notes: isSpanish ? 'Añadido para receta del Chef IA' : 'Added for AI Chef recipe',
    });
    setAddedExtraItems((prev) => ({ ...prev, [ingredientName]: true }));
    onShowToast(
      isSpanish
        ? `"${ingredientName}" añadido a la lista de compras.`
        : `"${ingredientName}" added to shopping list.`
    );
  };

  // Filter recipes according to active tab
  const displayedRecipes = () => {
    if (selectedCategory === 'saved') {
      return savedRecipes;
    }
    const currentList = recipeData?.recipes || [];
    if (selectedCategory === 'all') {
      return currentList;
    }
    return currentList.filter((r) => r.category === selectedCategory);
  };

  const recipesToShow = displayedRecipes();

  return (
    <div id="ai-chef-view" className="space-y-6 pb-28 pt-2 px-1">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#096430] via-[#004a21] to-[#043317] p-6 text-white shadow-lg border border-[#a2f5b2]/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-2xl bg-white/10 backdrop-blur-sm">
                <span className="material-symbols-outlined text-2xl text-[#a2f5b2]">skillet</span>
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">{t.aiInsights.title}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#a2f5b2] text-[#004a21]">
                {recipeData?.aiModel ? `Gemini ${recipeData.aiModel.replace('gemini-', '')}` : 'Chef Zero-Waste'}
              </span>
            </div>
            <p className="text-sm text-[#e1e2e8] mt-2 max-w-xl leading-relaxed">
              {t.aiInsights.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {expiringSoonItems.length > 0 && (
              <button
                id="btn-cook-what-you-have"
                onClick={() => {
                  const nearExpiryNames = expiringSoonItems.map((p) => p.name).join(', ');
                  fetchRecipes(
                    isSpanish
                      ? `Priorizar estrictamente y cocinar estos ingredientes próximos a vencer: ${nearExpiryNames}`
                      : `Strictly rescue and cook with these near-expiry items: ${nearExpiryNames}`
                  );
                }}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#87d897] text-[#00210b] hover:bg-[#68c77b] font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>{isSpanish ? '🍳 Cocinar con lo que tengo' : '🍳 Cook Near-Expiry'}</span>
              </button>
            )}

            <button
              id="btn-refresh-recipes"
              onClick={() => fetchRecipes()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#004a21] hover:bg-[#f0f4ef] font-semibold text-xs sm:text-sm rounded-2xl shadow transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <span
                className={`material-symbols-outlined text-lg ${isLoading ? 'animate-spin' : ''}`}
              >
                refresh
              </span>
              <span>{isLoading ? t.aiInsights.refreshing : t.aiInsights.refreshButton}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Pantry Stats inside banner */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5">
            <span className="material-symbols-outlined text-[#a2f5b2] text-lg">inventory_2</span>
            <div>
              <p className="text-white/70">{isSpanish ? 'Ingredientes aptos' : 'Valid pantry items'}</p>
              <p className="font-bold text-sm text-white">{validPantryItems.length} {isSpanish ? 'productos' : 'items'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#ff7a2b]/20 border border-[#ff7a2b]/30 rounded-xl p-2.5">
            <span className="material-symbols-outlined text-[#ff7a2b] text-lg">timer</span>
            <div>
              <p className="text-white/80 font-medium">{isSpanish ? 'Rescate prioritario' : 'Rescue priority'}</p>
              <p className="font-bold text-sm text-[#ffe0cc]">
                {expiringSoonItems.length} {isSpanish ? 'vencen pronto' : 'near expiry'}
              </p>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center gap-2 bg-white/10 rounded-xl p-2.5">
            <span className="material-symbols-outlined text-[#8dde9d] text-lg">eco</span>
            <div>
              <p className="text-white/70">{isSpanish ? 'Meta Cero Desperdicio' : 'Zero Waste Goal'}</p>
              <p className="font-bold text-sm text-white">{isSpanish ? 'Aprovechamiento 100%' : '100% Usage'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Food Safety Notice (Strictly excludes expired items) */}
      {expiredItems.length > 0 && (
        <div
          id="expired-food-safety-banner"
          className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#ffdad6]/60 dark:bg-[#93000a]/20 border border-[#ff897d]/40 text-[#410002] dark:text-[#ffdad6]"
        >
          <span className="material-symbols-outlined text-2xl text-[#ba1a1a] dark:text-[#ffb4ab] shrink-0 mt-0.5">
            health_and_safety
          </span>
          <div className="text-xs sm:text-sm">
            <p className="font-bold text-[#ba1a1a] dark:text-[#ffb4ab]">
              {t.aiInsights.expiredWarningTitle}
            </p>
            <p className="mt-0.5 opacity-90 leading-relaxed">
              {t.aiInsights.expiredWarningDesc(expiredItems.length)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {expiredItems.slice(0, 4).map((exp, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-[#ba1a1a]/10 dark:bg-white/10 text-[11px] font-semibold text-[#ba1a1a] dark:text-[#ffdad6] line-through"
                >
                  {exp.name}
                </span>
              ))}
              {expiredItems.length > 4 && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium opacity-75">
                  +{expiredItems.length - 4} {isSpanish ? 'más' : 'more'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Custom Recipe Request Box */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1f2227] border border-[#e1e2e8] dark:border-[#2e3135] shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#404940] dark:text-[#bfc9bd] mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-[#096430] dark:text-[#8dde9d]">
            auto_awesome
          </span>
          {isSpanish ? 'Pide una receta a tu medida al Chef IA' : 'Request a custom recipe from AI Chef'}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              id="input-custom-recipe"
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRecipes(customPrompt)}
              placeholder={t.aiInsights.customPromptPlaceholder}
              className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl bg-[#f8f9ff] dark:bg-[#14171a] border border-[#e1e2e8] dark:border-[#2e3135] focus:outline-none focus:ring-2 focus:ring-[#096430] text-[#191c20] dark:text-[#e1e2e8]"
            />
            {customPrompt && (
              <button
                onClick={() => setCustomPrompt('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
          <button
            id="btn-generate-custom"
            onClick={() => fetchRecipes(customPrompt)}
            disabled={isLoading || !customPrompt.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#096430] dark:bg-[#8dde9d] text-white dark:text-[#003919] hover:bg-[#075026] font-semibold text-sm rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">restaurant</span>
            <span>{t.aiInsights.generateCustom}</span>
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-[#707970] dark:text-[#8a938a] font-medium shrink-0">
            {isSpanish ? 'Ideas rápidas:' : 'Quick ideas:'}
          </span>
          {[
            isSpanish ? '🥗 Cena ligera y rápida' : '🥗 Quick light dinner',
            isSpanish ? '⚡ Menos de 15 minutos' : '⚡ Under 15 minutes',
            isSpanish ? '🍳 Con huevos y verduras' : '🍳 Eggs & vegetables',
            isSpanish ? '🍓 Con frutas maduras' : '🍓 Using ripe fruit',
          ].map((promptIdea, i) => (
            <button
              key={i}
              onClick={() => {
                const cleanText = promptIdea.replace(/^[^\w\s]+/, '').trim();
                setCustomPrompt(cleanText);
                fetchRecipes(cleanText);
              }}
              className="shrink-0 px-3 py-1 rounded-full bg-[#eef1f6] dark:bg-[#282b30] hover:bg-[#e1e6ee] text-[#191c20] dark:text-[#e1e2e8] border border-[#d5d9e0] dark:border-[#383b42] transition-colors"
            >
              {promptIdea}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Meal Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: t.aiInsights.mealTabs.all, icon: 'restaurant' },
          { id: 'desayuno', label: t.aiInsights.mealTabs.breakfast, icon: 'bakery_dining' },
          { id: 'almuerzo_cena', label: t.aiInsights.mealTabs.lunchDinner, icon: 'dinner_dining' },
          { id: 'express', label: t.aiInsights.mealTabs.express, icon: 'bolt' },
          { id: 'postre_snack', label: t.aiInsights.mealTabs.dessertSnack, icon: 'nutrition' },
          {
            id: 'saved',
            label: `${t.aiInsights.savedRecipesTab} (${savedRecipes.length})`,
            icon: 'bookmark',
          },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`tab-recipe-${tab.id}`}
            onClick={() => setSelectedCategory(tab.id as MealCategoryFilter)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-all cursor-pointer ${
              selectedCategory === tab.id
                ? 'bg-[#096430] text-white shadow-sm'
                : 'bg-white dark:bg-[#1f2227] text-[#404940] dark:text-[#bfc9bd] border border-[#e1e2e8] dark:border-[#2e3135] hover:bg-[#f0f4ef]'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 5. Recipes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="animate-pulse p-6 rounded-3xl bg-white dark:bg-[#1f2227] border border-[#e1e2e8] dark:border-[#2e3135] space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="h-6 w-36 bg-[#e1e2e8] dark:bg-[#2e3135] rounded-full" />
                <div className="h-6 w-16 bg-[#e1e2e8] dark:bg-[#2e3135] rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-[#e1e2e8] dark:bg-[#2e3135] rounded" />
              <div className="h-12 w-full bg-[#e1e2e8] dark:bg-[#2e3135] rounded" />
              <div className="h-8 w-1/2 bg-[#e1e2e8] dark:bg-[#2e3135] rounded" />
            </div>
          ))}
        </div>
      ) : recipesToShow.length === 0 ? (
        <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-[#1f2227] border border-[#e1e2e8] dark:border-[#2e3135]">
          <span className="material-symbols-outlined text-5xl text-[#096430] dark:text-[#8dde9d] mb-3">
            menu_book
          </span>
          <h3 className="text-base font-bold text-[#191c20] dark:text-white">
            {selectedCategory === 'saved'
              ? isSpanish
                ? 'No tienes recetas guardadas todavía'
                : 'No saved recipes yet'
              : isSpanish
              ? 'No hay recetas en esta categoría'
              : 'No recipes in this category'}
          </h3>
          <p className="text-xs sm:text-sm text-[#707970] dark:text-[#8a938a] mt-1 max-w-md mx-auto">
            {selectedCategory === 'saved'
              ? isSpanish
                ? 'Guarda tus recetas favoritas haciendo clic en el icono de marcador en cualquier receta.'
                : 'Bookmark your favorite creations to cook them again whenever you like.'
              : isSpanish
              ? 'Prueba seleccionando "Todas" o genera nuevas recetas con el botón superior.'
              : 'Try selecting "All" or generate new recipes with the refresh button.'}
          </p>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-4 px-4 py-2 rounded-xl bg-[#096430] text-white text-xs font-semibold"
            >
              {isSpanish ? 'Ver todas las recetas' : 'View all recipes'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {recipesToShow.map((recipe) => {
            const isSaved = savedRecipes.some((r) => r.id === recipe.id || r.title === recipe.title);
            const expiringIngredients = (recipe.rescuedPantryIngredients || []).filter((i) => i.isExpiringSoon);

            return (
              <div
                key={recipe.id || recipe.title}
                className="group flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-[#1f2227] border border-[#e1e2e8] dark:border-[#2e3135] shadow-sm hover:shadow-md hover:border-[#096430]/40 transition-all"
              >
                <div>
                  {/* Top Bar: Category & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#d4eed8] dark:bg-[#004a21] text-[#004a21] dark:text-[#a2f5b2]">
                        {recipe.categoryLabel || recipe.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f0f2f5] dark:bg-[#282b30] text-[#404940] dark:text-[#bfc9bd] flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">speed</span>
                        {recipe.difficulty}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleSaveRecipe(recipe)}
                      className={`p-2 rounded-xl border transition-all active:scale-90 ${
                        isSaved
                          ? 'bg-[#ffe082] text-[#5c3e00] border-[#ffd54f]'
                          : 'bg-[#f8f9ff] dark:bg-[#14171a] text-[#707970] border-[#e1e2e8] dark:border-[#2e3135] hover:text-[#096430]'
                      }`}
                      title={isSaved ? t.aiInsights.savedRecipe : t.aiInsights.saveRecipe}
                    >
                      <span className={`material-symbols-outlined text-lg ${isSaved ? 'fill-icon' : ''}`}>
                        bookmark
                      </span>
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-[#191c20] dark:text-white tracking-tight leading-snug">
                    {recipe.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#404940] dark:text-[#bfc9bd] mt-1.5 line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>

                  {/* Time & Servings Pill Bar */}
                  <div className="flex items-center gap-3 my-3.5 text-xs text-[#505a50] dark:text-[#a0aaa0] font-medium">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-[#096430] dark:text-[#8dde9d]">
                        schedule
                      </span>
                      {t.aiInsights.prep}: {recipe.prepTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-[#096430] dark:text-[#8dde9d]">
                        soup_kitchen
                      </span>
                      {t.aiInsights.cook}: {recipe.cookTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-[#096430] dark:text-[#8dde9d]">
                        group
                      </span>
                      {recipe.servings} {t.aiInsights.servings}
                    </span>
                  </div>

                  {/* Rescued Ingredients Highlight */}
                  <div className="p-3.5 rounded-2xl bg-[#f8f9ff] dark:bg-[#14171a] border border-[#e1e2e8] dark:border-[#282b30] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#191c20] dark:text-white">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[#096430] dark:text-[#8dde9d]">
                          check_circle
                        </span>
                        {t.aiInsights.pantryIngredientsTitle}
                      </span>
                      {expiringIngredients.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff7a2b]/20 text-[#b54708] dark:text-[#ff9c5a]">
                          {expiringIngredients.length} {isSpanish ? 'por vencer' : 'expiring'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(recipe.rescuedPantryIngredients || []).map((item, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            item.isExpiringSoon
                              ? 'bg-[#ffe8d9] dark:bg-[#ff7a2b]/20 text-[#9c3e03] dark:text-[#ff9c5a] border border-[#ff7a2b]/30 font-semibold'
                              : 'bg-white dark:bg-[#1f2227] text-[#191c20] dark:text-[#e1e2e8] border border-[#e1e2e8] dark:border-[#2e3135]'
                          }`}
                        >
                          {item.isExpiringSoon && (
                            <span className="material-symbols-outlined text-xs text-[#ff7a2b]">
                              priority_high
                            </span>
                          )}
                          <span>{item.name}</span>
                          {item.quantity && <span className="opacity-70 text-[10px]">({item.quantity})</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Zero Waste Highlight */}
                  {recipe.zeroWasteBenefit && (
                    <div className="mt-3 flex items-start gap-2 text-xs text-[#004a21] dark:text-[#a2f5b2] bg-[#a2f5b2]/15 dark:bg-[#004a21]/30 p-2.5 rounded-xl border border-[#a2f5b2]/30">
                      <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">eco</span>
                      <p className="leading-snug">{recipe.zeroWasteBenefit}</p>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-[#e1e2e8] dark:border-[#2e3135] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveRecipeDetails(recipe)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#096430] hover:bg-[#075026] text-white font-semibold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">menu_book</span>
                    <span>{isSpanish ? 'Ver Receta Completa y Paso a Paso' : 'View Full Recipe & Steps'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Recipe Details Modal / Cooking Guide */}
      {activeRecipeDetails && (
        <div
          id="recipe-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setActiveRecipeDetails(null)}
        >
          <div
            id="recipe-modal-content"
            className="relative w-full max-w-2xl bg-white dark:bg-[#191c20] rounded-3xl shadow-2xl border border-[#e1e2e8] dark:border-[#2e3135] overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#096430] to-[#043317] text-white flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#a2f5b2] text-[#004a21]">
                    {activeRecipeDetails.categoryLabel}
                  </span>
                  <span className="text-xs opacity-80">• {activeRecipeDetails.difficulty}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mt-2 text-white leading-snug">
                  {activeRecipeDetails.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#e1e2e8] mt-1">
                  {activeRecipeDetails.description}
                </p>
              </div>

              <button
                onClick={() => setActiveRecipeDetails(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#191c20] dark:text-[#e1e2e8]">
              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center p-3 rounded-2xl bg-[#f8f9ff] dark:bg-[#14171a] border border-[#e1e2e8] dark:border-[#282b30]">
                <div>
                  <p className="text-[11px] text-[#707970] dark:text-[#8a938a] font-medium">{t.aiInsights.prep}</p>
                  <p className="font-bold text-sm text-[#096430] dark:text-[#8dde9d]">{activeRecipeDetails.prepTime}</p>
                </div>
                <div className="border-x border-[#e1e2e8] dark:border-[#282b30]">
                  <p className="text-[11px] text-[#707970] dark:text-[#8a938a] font-medium">{t.aiInsights.cook}</p>
                  <p className="font-bold text-sm text-[#096430] dark:text-[#8dde9d]">{activeRecipeDetails.cookTime}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#707970] dark:text-[#8a938a] font-medium">{t.aiInsights.servings}</p>
                  <p className="font-bold text-sm text-[#096430] dark:text-[#8dde9d]">{activeRecipeDetails.servings}</p>
                </div>
              </div>

              {/* Rescued Ingredients */}
              <div>
                <h4 className="font-bold text-base text-[#191c20] dark:text-white mb-2.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#096430] dark:text-[#8dde9d] text-lg">
                    inventory_2
                  </span>
                  {t.aiInsights.pantryIngredientsTitle}
                </h4>
                <div className="space-y-1.5">
                  {(activeRecipeDetails.rescuedPantryIngredients || []).map((ing, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8f9ff] dark:bg-[#14171a] border border-[#e1e2e8] dark:border-[#282b30]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-[#096430] dark:text-[#8dde9d]">
                          check
                        </span>
                        <span className="font-semibold">{ing.name}</span>
                        {ing.quantity && <span className="text-xs text-gray-500">({ing.quantity})</span>}
                      </div>

                      {ing.isExpiringSoon ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ff7a2b]/20 text-[#b54708] dark:text-[#ff9c5a] border border-[#ff7a2b]/30">
                          {isSpanish ? '¡Rescate Prioritario!' : 'Priority Rescue!'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#096430] dark:text-[#8dde9d] font-medium">
                          {t.aiInsights.fromPantryBadge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra Ingredients */}
              {activeRecipeDetails.extraIngredients?.length > 0 && (
                <div>
                  <h4 className="font-bold text-base text-[#191c20] dark:text-white mb-2.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#003d87] dark:text-[#a8c7fa] text-lg">
                      add_shopping_cart
                    </span>
                    {t.aiInsights.extraIngredientsTitle}
                  </h4>
                  <div className="space-y-1.5">
                    {(activeRecipeDetails.extraIngredients || []).map((ext, i) => {
                      const isAdded = addedExtraItems[ext.name];
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1f2227] border border-[#e1e2e8] dark:border-[#2e3135]"
                        >
                          <div>
                            <span className="font-medium">{ext.name}</span>
                            {ext.quantity && <span className="text-xs text-gray-500 ml-1">({ext.quantity})</span>}
                            {ext.isOptional && (
                              <span className="text-[10px] text-gray-400 ml-1.5">({isSpanish ? 'opcional' : 'optional'})</span>
                            )}
                          </div>

                          <button
                            onClick={() => handleAddExtraToShopping(ext.name)}
                            disabled={isAdded}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              isAdded
                                ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                                : 'bg-[#e1e2e8] dark:bg-[#282b30] hover:bg-[#096430] hover:text-white text-[#191c20] dark:text-[#e1e2e8]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {isAdded ? 'done' : 'add'}
                            </span>
                            <span>{isAdded ? t.aiInsights.addedToShopping : isSpanish ? 'Añadir a compras' : 'Add to list'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step by Step Instructions with interactive checkboxes */}
              <div>
                <h4 className="font-bold text-base text-[#191c20] dark:text-white mb-2.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#096430] dark:text-[#8dde9d] text-lg">
                    format_list_numbered
                  </span>
                  {t.aiInsights.stepsTitle}
                </h4>
                <div className="space-y-2.5">
                  {(activeRecipeDetails.steps || []).map((step, idx) => {
                    const stepKey = `${activeRecipeDetails.id}-step-${idx}`;
                    const isDone = completedSteps[stepKey];
                    return (
                      <div
                        key={idx}
                        onClick={() =>
                          setCompletedSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }))
                        }
                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                          isDone
                            ? 'bg-[#d4eed8]/30 dark:bg-[#004a21]/20 border-[#a2f5b2]/40 opacity-75'
                            : 'bg-[#f8f9ff] dark:bg-[#14171a] border-[#e1e2e8] dark:border-[#282b30]'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isDone
                              ? 'bg-[#096430] text-white'
                              : 'bg-[#e1e2e8] dark:bg-[#282b30] text-[#191c20] dark:text-white'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <p className={`text-xs sm:text-sm leading-relaxed ${isDone ? 'line-through opacity-70' : ''}`}>
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chef Tip */}
              {activeRecipeDetails.chefTip && (
                <div className="p-4 rounded-2xl bg-[#fff8e1] dark:bg-[#ffe082]/10 border border-[#ffe082]/40 text-[#5c3e00] dark:text-[#ffe082]">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-1">
                    <span className="material-symbols-outlined text-base">lightbulb</span>
                    {t.aiInsights.chefTipTitle}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">{activeRecipeDetails.chefTip}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-[#f8f9ff] dark:bg-[#14171a] border-t border-[#e1e2e8] dark:border-[#2e3135] flex items-center justify-between gap-3">
              <button
                onClick={() => toggleSaveRecipe(activeRecipeDetails)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e1e2e8] dark:border-[#2e3135] bg-white dark:bg-[#1f2227] text-xs sm:text-sm font-semibold text-[#191c20] dark:text-white"
              >
                <span className="material-symbols-outlined text-lg text-[#ff7a2b]">bookmark</span>
                <span>{savedRecipes.some((r) => r.id === activeRecipeDetails.id) ? t.aiInsights.savedRecipe : t.aiInsights.saveRecipe}</span>
              </button>

              <button
                onClick={() => setActiveRecipeDetails(null)}
                className="px-6 py-2.5 rounded-xl bg-[#096430] hover:bg-[#075026] text-white text-xs sm:text-sm font-bold shadow transition-all active:scale-95 cursor-pointer"
              >
                {isSpanish ? '¡Listo para cocinar!' : 'Done Cooking!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

