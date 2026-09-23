import { AIRecipe, Product, UserPreferences, PantryRecipeIngredient } from '../types';
import { calculateProductStatus } from './barcodeService';

export function generateClientLocalRecipes(
  products: Product[] = [],
  preferences?: UserPreferences
): { recipes: AIRecipe[]; modelUsed: string; isFallback: boolean } {
  const lang = preferences?.language || 'es';
  const isSpanish = lang === 'es';
  const alertDays = preferences?.expiryAlertDays || 3;

  // Sort: near-expiry items first
  const sorted = [...(products || [])].sort((a, b) => {
    const statusA = calculateProductStatus(a.expiryDate, alertDays);
    const statusB = calculateProductStatus(b.expiryDate, alertDays);
    if (statusA.status === 'expiring' && statusB.status !== 'expiring') return -1;
    if (statusB.status === 'expiring' && statusA.status !== 'expiring') return 1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  const getProductObj = (query: string) =>
    sorted.find((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const toPantryIngredient = (p: Product, customQty?: string): PantryRecipeIngredient => {
    const st = calculateProductStatus(p.expiryDate, alertDays);
    return {
      name: p.name,
      quantity: customQty || `${p.quantity} ${p.unit}`,
      isFromPantry: true,
      isExpiringSoon: st.status === 'expiring' || st.status === 'expired',
      daysRemaining: st.diffDays,
    };
  };

  const eggProd = getProductObj('huevo') || getProductObj('egg');
  const milkProd = getProductObj('leche') || getProductObj('milk');
  const cheeseProd = getProductObj('queso') || getProductObj('cheese');
  const vegProd = sorted.find((p) => p.category === 'verduras') || sorted[0];
  const fruitProd = sorted.find((p) => p.category === 'frutas');
  const proteinProd = sorted.find((p) => p.category === 'proteinas') || sorted[1] || sorted[0];
  const grainProd = sorted.find((p) => p.category === 'granos') || getProductObj('arroz') || getProductObj('pasta');

  const recipes: AIRecipe[] = [];

  // 1. Desayuno
  const breakfastRescued: PantryRecipeIngredient[] = [];
  if (eggProd) breakfastRescued.push(toPantryIngredient(eggProd, '2 piezas'));
  if (vegProd && vegProd.id !== eggProd?.id) breakfastRescued.push(toPantryIngredient(vegProd, '1/2 taza picada'));
  if (milkProd && milkProd.id !== vegProd?.id) breakfastRescued.push(toPantryIngredient(milkProd, '2 cucharadas'));
  if (cheeseProd && cheeseProd.id !== vegProd?.id) breakfastRescued.push(toPantryIngredient(cheeseProd, '30g rallado'));

  if (breakfastRescued.length === 0) {
    if (sorted[0]) {
      breakfastRescued.push(toPantryIngredient(sorted[0]));
    } else {
      breakfastRescued.push({
        name: isSpanish ? 'Huevos o Pan' : 'Eggs or Bread',
        quantity: '2 piezas',
        isFromPantry: false,
        isExpiringSoon: false,
      });
    }
  }

  const breakfastTitle = isSpanish
    ? `Revuelto Nutritivo de Rescate con ${breakfastRescued[0]?.name || 'Verduras'}`
    : `Nutritious Rescue Scramble with ${breakfastRescued[0]?.name || 'Vegetables'}`;

  recipes.push({
    id: 'local-rec-breakfast-1',
    title: breakfastTitle,
    description: isSpanish
      ? 'Aprovecha tus ingredientes más maduros en una preparación proteica, rápida y reconfortante para iniciar el día sin desperdicio.'
      : 'Transform your ripest ingredients into a quick, protein-packed breakfast to start the day zero-waste.',
    category: 'desayuno',
    categoryLabel: isSpanish ? 'Desayuno Saludable' : 'Healthy Breakfast',
    prepTime: '5 min',
    cookTime: '8 min',
    servings: 2,
    difficulty: 'Fácil',
    rescuedPantryIngredients: breakfastRescued,
    extraIngredients: [
      { name: isSpanish ? 'Aceite de oliva o mantequilla' : 'Olive oil or butter', quantity: '1 cdta', isOptional: false },
      { name: isSpanish ? 'Pizca de sal y pimienta' : 'Pinch of salt and black pepper', isOptional: false },
    ],
    steps: isSpanish
      ? [
          'Pica finamente las verduras e ingredientes que tengas más maduros en el refrigerador.',
          'Bate los huevos con una pizca de sal y un chorrito de leche para darle esponjosidad.',
          'Calienta un sartén con una cucharadita de aceite a fuego medio y saltea los vegetales 3 minutos.',
          'Vierte los huevos batidos, baja el fuego y revuelve suavemente durante 2-3 minutos hasta que cuajen al punto deseado.',
          'Sirve de inmediato acompañado de queso o tostadas calientes.',
        ]
      : [
          'Finely dice your ripest vegetables and pantry ingredients.',
          'Whisk eggs with a pinch of salt and a splash of milk for extra fluffiness.',
          'Heat a skillet over medium heat with oil and sauté the veggies for 3 minutes.',
          'Pour in eggs, reduce heat to low, and stir gently for 2-3 minutes until soft and creamy.',
          'Serve warm with cheese or toasted bread.',
        ],
    chefTip: isSpanish
      ? 'No deseches los tallos de espinacas ni la parte verde del cebollín; son donde más fibra y sabor se concentra.'
      : 'Do not toss vegetable stems or herb ends; they contain the highest concentration of fiber and flavor.',
    zeroWasteBenefit: isSpanish
      ? 'Rescata hasta 3 ingredientes antes de caducar y ahorra $85 MXN por porción.'
      : 'Rescues up to 3 ingredients before expiration, cutting kitchen waste.',
    isSaved: false,
  });

  // 2. Almuerzo / Cena
  const lunchRescued: PantryRecipeIngredient[] = [];
  if (proteinProd) lunchRescued.push(toPantryIngredient(proteinProd));
  if (vegProd && vegProd.id !== proteinProd?.id) lunchRescued.push(toPantryIngredient(vegProd));
  if (grainProd && grainProd.id !== vegProd?.id && grainProd.id !== proteinProd?.id) {
    lunchRescued.push(toPantryIngredient(grainProd));
  }

  if (lunchRescued.length === 0) {
    lunchRescued.push({
      name: isSpanish ? 'Pasta o Arroz de alacena' : 'Pantry Pasta or Rice',
      quantity: '1 taza',
      isFromPantry: false,
      isExpiringSoon: false,
    });
  }

  recipes.push({
    id: 'local-rec-lunch-2',
    title: isSpanish ? 'Salteado Cero Desperdicio de la Cosecha' : 'Harvest Zero-Waste Stir-Fry',
    description: isSpanish
      ? 'Un plato completo y equilibrado que saltea la proteína y los vegetales de tu despensa con un toque aromático irresistible.'
      : 'A balanced, wholesome one-pan stir fry bringing together your proteins and pantry staples.',
    category: 'almuerzo_cena',
    categoryLabel: isSpanish ? 'Almuerzo / Cena' : 'Lunch / Dinner',
    prepTime: '10 min',
    cookTime: '15 min',
    servings: 2,
    difficulty: 'Fácil',
    rescuedPantryIngredients: lunchRescued,
    extraIngredients: [
      { name: isSpanish ? 'Salsa de soya o condimento' : 'Soy sauce or seasoning', quantity: '2 cdas', isOptional: false },
      { name: isSpanish ? 'Diente de ajo picado' : 'Minced garlic clove', quantity: '1 pz', isOptional: true },
      { name: isSpanish ? 'Aceite vegetal o ajonjolí' : 'Cooking oil', quantity: '1 cda', isOptional: false },
    ],
    steps: isSpanish
      ? [
          'Corta la proteína y las verduras en bocados uniformes para que se cocinen al mismo tiempo.',
          'En un sartén hondo o wok a fuego alto, añade una cucharada de aceite y dora el ajo 30 segundos.',
          'Agrega la proteína y séllala hasta dorar uniformemente.',
          'Incorpora las verduras y saltea con fuerza durante 4-5 minutos manteniendo su textura crujiente.',
          'Añade el grano o arroz previamente cocido, baña con la salsa de soya y mezcla bien 1 minuto antes de apagar.',
        ]
      : [
          'Cut protein and veggies into bite-sized pieces for even cooking.',
          'Heat oil in a wok or deep skillet over high heat and sizzle garlic for 30 seconds.',
          'Add protein and sear until nicely browned on all sides.',
          'Toss in vegetables and stir-fry vigorously for 4-5 minutes until crisp-tender.',
          'Fold in cooked grains or rice, drizzle soy sauce, and toss together for 1 minute before serving.',
        ],
    chefTip: isSpanish
      ? 'El secreto de un buen salteado es mantener el fuego vivo y no sobrecargar el sartén para que dore y no hierva.'
      : 'Keep the pan scorching hot and avoid overcrowding so ingredients brown instead of steaming.',
    zeroWasteBenefit: isSpanish
      ? 'Aprovecha verduras maduras y sobrantes de carnes o legumbres en una sola preparación.'
      : 'Ideal for repurposing any leftover proteins and aging produce into a gourmet meal.',
    isSaved: false,
  });

  // 3. Exprés (<15 min)
  const expressRescued: PantryRecipeIngredient[] = sorted.slice(0, 3).map((p) => toPantryIngredient(p));
  if (expressRescued.length === 0) {
    expressRescued.push({
      name: isSpanish ? 'Tortillas o Pan de caja' : 'Tortillas or Toast',
      quantity: '2 piezas',
      isFromPantry: false,
      isExpiringSoon: false,
    });
  }

  recipes.push({
    id: 'local-rec-express-3',
    title: isSpanish ? 'Bowl Express de Aprovechamiento' : 'Quick Pantry Rescue Bowl',
    description: isSpanish
      ? 'Listo en solo 10 minutos. Una solución inmediata para comer rico y nutritivo sin ensuciar la cocina cuando tienes prisa.'
      : 'Ready in just 10 minutes. A speedy, nutritious bowl designed for busy days without food waste.',
    category: 'express',
    categoryLabel: isSpanish ? 'Exprés (<15 min)' : 'Express (<15 min)',
    prepTime: '4 min',
    cookTime: '6 min',
    servings: 1,
    difficulty: 'Rápida',
    rescuedPantryIngredients: expressRescued,
    extraIngredients: [
      { name: isSpanish ? 'Jugo de 1/2 limón' : 'Fresh lime or lemon juice', isOptional: false },
      { name: isSpanish ? 'Pizca de orégano o especias' : 'Oregano or dried herbs', isOptional: true },
      { name: isSpanish ? 'Chorrito de aceite de oliva' : 'Drizzle of olive oil', isOptional: true },
    ],
    steps: isSpanish
      ? [
          'Reúne los ingredientes más antiguos de tu alacena o refrigerador.',
          'Corta todo en trozos pequeños y calienta brevemente en un sartén con una gota de aceite.',
          'Monta en un tazón hondo o sobre tortillas / tostadas calientes.',
          'Corona con unas gotas de limón fresco, especias al gusto y disfruta de inmediato.',
        ]
      : [
          'Gather your oldest pantry and fridge items.',
          'Dice everything and warm quickly in a skillet with a dash of oil.',
          'Assemble inside a deep bowl or on warm tortillas.',
          'Finish with fresh lime juice and dried herbs for instant flavor.',
        ],
    chefTip: isSpanish
      ? 'Unas gotas de limón o vinagre reviven al instante el sabor de vegetales que han perdido frescura.'
      : 'A squeeze of fresh lemon or splash of vinegar instantly revives tired produce flavors.',
    zeroWasteBenefit: isSpanish
      ? 'Evita que alimentos listos para consumir terminen en la basura por falta de tiempo.'
      : 'Saves ready-to-eat pantry staples from being forgotten in the back of the shelf.',
    isSaved: false,
  });

  // 4. Postre o Snack
  const dessertRescued: PantryRecipeIngredient[] = [];
  if (fruitProd) {
    dessertRescued.push(toPantryIngredient(fruitProd, '1-2 piezas maduras'));
  } else {
    dessertRescued.push({
      name: isSpanish ? 'Plátano o Fruta madura' : 'Ripe Banana or Fruit',
      quantity: '1 pieza',
      isFromPantry: false,
      isExpiringSoon: false,
    });
  }
  if (milkProd) dessertRescued.push(toPantryIngredient(milkProd, '1 vaso'));

  recipes.push({
    id: 'local-rec-dessert-4',
    title: isSpanish
      ? `Smoothie Cremoso de ${fruitProd ? fruitProd.name : 'Frutas Maduras'}`
      : `Creamy Smoothie with ${fruitProd ? fruitProd.name : 'Ripe Fruits'}`,
    description: isSpanish
      ? 'Las frutas muy maduras concentran más azúcares naturales. Conviértelas en un postre o batido cremoso y revitalizante.'
      : 'Overripe fruits are packed with natural sweetness. Blend them into an energizing, silky treat.',
    category: 'postre_snack',
    categoryLabel: isSpanish ? 'Postre / Snack' : 'Dessert / Snack',
    prepTime: '3 min',
    cookTime: '2 min',
    servings: 1,
    difficulty: 'Fácil',
    rescuedPantryIngredients: dessertRescued,
    extraIngredients: [
      { name: isSpanish ? 'Hielo o agua al gusto' : 'Ice cubes or water', isOptional: true },
      { name: isSpanish ? 'Cucharadita de canela o miel' : 'Cinnamon or honey', isOptional: true },
    ],
    steps: isSpanish
      ? [
          'Pela y trocea la fruta, retirando partes no deseadas si las hay.',
          'Colócala en la licuadora con la leche, bebida vegetal o agua.',
          'Agrega 2-3 cubos de hielo y una pizca de canela.',
          'Licúa a velocidad máxima durante 45 segundos hasta obtener una consistencia sedosa y cremosa.',
        ]
      : [
          'Peel and chop the fruit, trimming any spoiled spots.',
          'Add to blender with milk, plant milk, or water.',
          'Add 2-3 ice cubes and a dash of cinnamon.',
          'Blend on high for 45 seconds until silky and frothy.',
        ],
    chefTip: isSpanish
      ? 'Si no vas a consumir la fruta hoy, pélala, córtala en rodajas y congélala en una bolsa hermética para batidos futuros.'
      : 'If you cannot use ripe fruit today, peel, slice and freeze in a sealed bag for future smoothies.',
    zeroWasteBenefit: isSpanish
      ? 'La fruta representa el 42% del desperdicio en hogares. Aprovecha hasta la última pieza madura.'
      : 'Fruit makes up 42% of household food waste. Keep every ripe piece out of landfills.',
    isSaved: false,
  });

  return {
    recipes,
    modelUsed: 'Pantry Guard Smart Local Engine (Zero-Latency Fallback)',
    isFallback: true,
  };
}
