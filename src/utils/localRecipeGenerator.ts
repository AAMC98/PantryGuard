import { AIRecipe, Product, UserPreferences } from '../types';
import { calculateProductStatus } from './barcodeService';

export function generateClientLocalRecipes(
  products: Product[],
  preferences: UserPreferences
): { recipes: AIRecipe[]; modelUsed: string; isFallback: boolean } {
  const lang = preferences?.language || 'es';
  const isSpanish = lang === 'es';

  // Sort: near-expiry items first
  const sorted = [...products].sort((a, b) => {
    const statusA = calculateProductStatus(a.expiryDate, preferences?.expiryAlertDays || 3);
    const statusB = calculateProductStatus(b.expiryDate, preferences?.expiryAlertDays || 3);
    if (statusA.status === 'expiring' && statusB.status !== 'expiring') return -1;
    if (statusB.status === 'expiring' && statusA.status !== 'expiring') return 1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  const productNames = sorted.map((p) => p.name.toLowerCase());
  const recipes: AIRecipe[] = [];

  const hasItem = (query: string) => productNames.some((name) => name.includes(query.toLowerCase()));
  const getProductObj = (query: string) => sorted.find((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  // 1. Desayuno / Breakfast: Huevos revueltos de rescate / Scramble
  const eggProd = getProductObj('huevo') || getProductObj('egg');
  const milkProd = getProductObj('leche') || getProductObj('milk');
  const vegProd = sorted.find((p) => p.category === 'verduras') || sorted[0];

  recipes.push({
    id: 'local-rec-1',
    title: isSpanish
      ? `Revuelto Nutritivo de ${eggProd ? eggProd.name : 'Rescate con Verduras'}`
      : `Nutritious Scramble with ${eggProd ? eggProd.name : 'Veggies'}`,
    mealType: 'desayuno',
    cookTimeMinutes: 12,
    difficulty: 'fácil',
    pantryIngredientsUsed: [
      {
        name: eggProd ? eggProd.name : isSpanish ? 'Huevos o Proteína disponible' : 'Eggs or Available Protein',
        quantity: '2 piezas',
        isExpiringSoon: !!eggProd,
      },
      ...(vegProd
        ? [
            {
              name: vegProd.name,
              quantity: '1 taza picada',
              isExpiringSoon: true,
            },
          ]
        : []),
      ...(milkProd
        ? [
            {
              name: milkProd.name,
              quantity: '2 cucharadas',
              isExpiringSoon: true,
            },
          ]
        : []),
    ],
    extraIngredientsNeeded: [
      { name: isSpanish ? 'Aceite de oliva o mantequilla' : 'Olive oil or butter', isOptional: false },
      { name: isSpanish ? 'Pizca de sal y pimienta' : 'Pinch of salt and pepper', isOptional: false },
    ],
    steps: isSpanish
      ? [
          'Pica finamente las verduras que tengas más maduras en tu refrigerador.',
          'Bate los huevos con un chorrito de leche para dar esponjosidad.',
          'Saltea las verduras en un sartén caliente con poco aceite durante 3 minutos.',
          'Vierte los huevos batidos, revuelve suavemente a fuego medio y retira antes de resecar.',
        ]
      : [
          'Finely chop your ripest vegetables from the fridge.',
          'Whisk eggs with a splash of milk for extra fluffiness.',
          'Sauté vegetables in a hot skillet with oil for 3 minutes.',
          'Pour in beaten eggs, gently scramble over medium heat and serve immediately.',
        ],
    zeroWasteTip: isSpanish
      ? 'Aprovecha tallos de espinaca o trocitos de cebolla y tomate que lleven días abiertos.'
      : 'Use spinach stems, half-onions, or ripe tomatoes before they spoil.',
  });

  // 2. Almuerzo / Cena: Salteado Cero Desperdicio
  const grainProd = sorted.find((p) => p.category === 'granos') || getProductObj('arroz');
  const proteinProd = sorted.find((p) => p.category === 'proteinas') || sorted[1] || sorted[0];

  recipes.push({
    id: 'local-rec-2',
    title: isSpanish ? 'Salteado Express de la Despensa' : 'Pantry Harvest Stir-Fry',
    mealType: 'almuerzo_cena',
    cookTimeMinutes: 20,
    difficulty: 'fácil',
    pantryIngredientsUsed: [
      ...(proteinProd
        ? [{ name: proteinProd.name, quantity: '1 porción', isExpiringSoon: true }]
        : [{ name: isSpanish ? 'Ingrediente principal de alacena' : 'Main pantry staple', quantity: '1 porción', isExpiringSoon: false }]),
      ...(vegProd ? [{ name: vegProd.name, quantity: '1 taza troceada', isExpiringSoon: true }] : []),
      ...(grainProd ? [{ name: grainProd.name, quantity: '1 porción cocida', isExpiringSoon: false }] : []),
    ],
    extraIngredientsNeeded: [
      { name: isSpanish ? 'Salsa de soya o condimento al gusto' : 'Soy sauce or seasoning', isOptional: true },
      { name: isSpanish ? 'Diente de ajo' : 'Garlic clove', isOptional: true },
    ],
    steps: isSpanish
      ? [
          'Corta los ingredientes en bocados uniformes para cocción rápida.',
          'Dora primero la proteína con ajo en un sartén o wok con fuego vivo.',
          'Agrega las verduras y saltea por 4 minutos manteniendo consistencia crujiente.',
          'Incorpora el grano o arroz y sazona al gusto con salsa de soya o especias.',
        ]
      : [
          'Chop all ingredients into bite-sized pieces for quick cooking.',
          'Sear the protein first with garlic in a hot pan or wok.',
          'Add vegetables and toss for 4 minutes to keep them crisp-tender.',
          'Fold in grains or rice and season to taste with soy sauce or spices.',
        ],
    zeroWasteTip: isSpanish
      ? 'Los salteados son el comodín perfecto para rescatar cualquier verdura arrugada antes de que se dañe.'
      : 'Stir-fries are the ultimate way to rescue wilted veggies before they go bad.',
  });

  // 3. Exprés (<15 min): Tostadas o Bowl de Rescate
  recipes.push({
    id: 'local-rec-3',
    title: isSpanish ? 'Bowl Rápido de Aprovechamiento' : 'Quick Rescue Bowl',
    mealType: 'express',
    cookTimeMinutes: 10,
    difficulty: 'fácil',
    pantryIngredientsUsed: sorted.slice(0, 3).map((p) => ({
      name: p.name,
      quantity: `${p.quantity} ${p.unit}`,
      isExpiringSoon: true,
    })),
    extraIngredientsNeeded: [
      { name: isSpanish ? 'Limón y condimentos básicos' : 'Lemon juice & basic spices', isOptional: false },
    ],
    steps: isSpanish
      ? [
          'Revisa y reúne los 3 ingredientes más antiguos de tu despensa.',
          'Calienta o saltea brevemente en sartén con una pizca de especias.',
          'Sirve en un tazón hondo o sobre tostadas / tortillas calientes.',
          'Corona con unas gotas de limón para realzar el sabor.',
        ]
      : [
          'Gather your top 3 oldest pantry and fridge items.',
          'Warm or lightly sauté in a skillet with a pinch of seasoning.',
          'Assemble in a deep bowl or over warm tortillas/toast.',
          'Drizzle with fresh lemon or lime juice to brighten the flavor.',
        ],
    zeroWasteTip: isSpanish
      ? 'Consumir primero los alimentos próximos a vencer ahorra hasta $800 MXN mensuales en la cesta familiar.'
      : 'Prioritizing items about to expire saves significant money and cuts kitchen waste.',
  });

  // 4. Postre / Snack: Batido o Compota de Frutas
  const fruitProd = sorted.find((p) => p.category === 'frutas') || sorted.find((p) => p.name.toLowerCase().includes('fruta'));
  recipes.push({
    id: 'local-rec-4',
    title: isSpanish
      ? `Smoothie Dulce de ${fruitProd ? fruitProd.name : 'Frutas Maduras'}`
      : `Sweet Smoothie with ${fruitProd ? fruitProd.name : 'Ripe Fruits'}`,
    mealType: 'postre_snack',
    cookTimeMinutes: 5,
    difficulty: 'fácil',
    pantryIngredientsUsed: [
      ...(fruitProd ? [{ name: fruitProd.name, quantity: '1-2 piezas maduras', isExpiringSoon: true }] : [{ name: isSpanish ? 'Fruta madura' : 'Ripe fruit', quantity: '1 taza', isExpiringSoon: true }]),
      ...(milkProd ? [{ name: milkProd.name, quantity: '1 vaso', isExpiringSoon: true }] : []),
    ],
    extraIngredientsNeeded: [
      { name: isSpanish ? 'Hielo o miel al gusto' : 'Ice cubes or honey', isOptional: true },
    ],
    steps: isSpanish
      ? [
          'Corta la fruta retirando cualquier zona no deseada.',
          'Coloca en licuadora con leche, agua o yogur.',
          'Licúa a velocidad máxima durante 45 segundos hasta obtener textura cremosa.',
        ]
      : [
          'Chop the fruit, trimming any unwanted spots.',
          'Combine in blender with milk, water, or yogurt.',
          'Blend on high for 45 seconds until creamy and smooth.',
        ],
    zeroWasteTip: isSpanish
      ? 'La fruta muy madura tiene más dulzor natural, por lo que no necesitas añadir azúcar refinada.'
      : 'Ripe fruit is naturally sweet, eliminating the need for added sugar.',
  });

  return {
    recipes,
    modelUsed: 'Pantry Guard Smart Local Engine (Zero-Latency Fallback)',
    isFallback: true,
  };
}
