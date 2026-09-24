import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __dirnameSafe = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// Lazy Gemini client helper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback model chain and retry logic to handle 503 High Demand / 429 rate limit spikes smoothly
// Only using active supported models per Google GenAI specifications
const FALLBACK_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-2.5-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest'
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function safeExtractJson<T = any>(text: string | undefined | null, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch && fenceMatch[1]) {
      try {
        return JSON.parse(fenceMatch[1]);
      } catch {
        // continue
      }
    }
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = text.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = text.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx > startIdx) {
      try {
        return JSON.parse(text.slice(startIdx, endIdx + 1));
      } catch {
        // continue
      }
    }
    return fallback;
  }
}

// Domain-Expert Culinary Advisor Knowledge Engine (contextual responses for specific questions)
function generateContextualAdvisorResponse(
  question: string,
  validProducts: any[] = [],
  isSpanish: boolean = true
): string {
  const q = (question || '').toLowerCase();
  const validNames = validProducts.map((p) => p.name).join(', ');

  // 0. Greetings / Saludos
  if (
    q === 'hola' ||
    q.startsWith('hola ') ||
    q === 'buenas' ||
    q.startsWith('buenos dÃ­as') ||
    q.startsWith('buenas tardes') ||
    q.startsWith('buenas noches') ||
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey'
  ) {
    if (isSpanish) {
      return `### ðŸ‘¨â€ðŸ³ Â¡Hola! Estoy a tu servicio.

He analizado tu despensa actual (${validProducts.length > 0 ? `con **${validProducts.length} productos vigentes** como ${validNames}` : 'sin ingredientes registrados aÃºn'}).

**Â¿En quÃ© te puedo ayudar hoy?**
- ðŸ¥— **Recetas exprÃ©s en < 15 min** con tus ingredientes listos.
- ðŸŒ **Ideas para rescatar frutas o vegetales maduros**.
- ðŸ¥› **TÃ©cnicas de conservaciÃ³n y congelaciÃ³n segura**.
- ðŸ”„ **SustituciÃ³n de ingredientes faltantes**.

Â¡PregÃºntame lo que necesites o pulsa una de las preguntas sugeridas!`;
    } else {
      return `### ðŸ‘¨â€ðŸ³ Hello! I'm your AI Zero-Waste Chef.

I've reviewed your pantry (${validProducts.length > 0 ? `with **${validProducts.length} items** including ${validNames}` : 'ready for your ingredients'}).

**How can I help you today?**
- ðŸ¥— **Quick recipes under 15 minutes**.
- ðŸŒ **Ideas to rescue ripe produce & herbs**.
- ðŸ¥› **Storage, dairy, & safe freezing techniques**.
- ðŸ”„ **Ingredient substitutions**.

Feel free to ask anything or click one of the suggested prompts!`;
    }
  }

  // 1. 15-minute quick recipes / Recetas rÃ¡pidas < 15 minutos
  if (
    q.includes('15') ||
    q.includes('minuto') ||
    q.includes('rapido') ||
    q.includes('rÃ¡pido') ||
    q.includes('express') ||
    q.includes('exprÃ©s') ||
    q.includes('quick') ||
    q.includes('fast')
  ) {
    if (isSpanish) {
      return `### â±ï¸ Recetas ExprÃ©s en Menos de 15 Minutos:

1. **Salteado Wok Crujiente (8-10 min)**:
   - **TÃ©cnica**: Corta tus verduras en tiras muy finas (juliana o lÃ¡minas con pelador) para que se cocinen en 3 minutos a fuego alto con un chorrito de aceite.
   - **Toque de sabor**: Termina con ajo picado, salsa de soja y semillas de sÃ©samo o un chorrito de limÃ³n.

2. **Revuelto o Frittata RÃ¡pida (7 min)**:
   - Saltea tus vegetales troceados durante 3 minutos, aÃ±ade 2 huevos batidos con sal y pimienta, baja a fuego medio y remueve suavemente hasta que cuaje cremosa.

3. **Crema Ligera ExprÃ©s de Vegetales (12 min)**:
   - Hierve verduras cortadas en cubos pequeÃ±os con agua o caldo justo hasta cubrirlas (8 min). Tritura con un toque de aceite de oliva o queso para una textura sedosa.

4. **Tostadas Gourmet de Rescate (5 min)**:
   - Tuesta pan, frota un diente de ajo y aÃ±ade tus verduras salteadas o tomates maduros con un hilo de aceite virgen extra.`;
    } else {
      return `### â±ï¸ Express Meals in Under 15 Minutes:

1. **Crisp Stir-Fry Wok (8â€“10 min)**:
   - **Technique**: Slice veggies extra thin so they cook in 3 minutes over high heat with oil.
   - **Flavor**: Finish with minced garlic, soy sauce, or citrus zest.

2. **Quick Scramble or Pan Frittata (7 min)**:
   - SautÃ© diced veggies for 3 minutes, pour in 2 beaten eggs, and cook gently until soft and fluffy.

3. **Silky 12-Minute Blender Soup**:
   - Boil finely diced vegetables in broth for 8 minutes, then blend with a splash of olive oil for instant creaminess.`;
    }
  }

  // 2. Dairy / LÃ¡cteos preservation techniques
  if (
    q.includes('lÃ¡cteo') ||
    q.includes('lacteo') ||
    q.includes('leche') ||
    q.includes('queso') ||
    q.includes('yogur') ||
    q.includes('dairy') ||
    q.includes('milk') ||
    q.includes('cheese') ||
    q.includes('yogurt')
  ) {
    if (isSpanish) {
      return `### ðŸ¥› TÃ©cnicas Expertas para Conservar y Alargar LÃ¡cteos:

1. **UbicaciÃ³n en el Refrigerador**:
   - Guarda siempre la leche y yogures en la **balda intermedia o superior (2Â°C a 4Â°C)**.
   - âš ï¸ *Evita la puerta del refrigerador*, ya que sufre oscilaciones constantes de temperatura cada vez que se abre.

2. **ConservaciÃ³n de Quesos**:
   - **Quesos duros y curados**: EnvuÃ©lvelos en papel encerado o papel manteca en lugar de plÃ¡stico film apretado; esto les permite respirar sin secarse ni acumular humedad superficial.
   - **Quesos frescos**: GuÃ¡rdalos en recipientes hermÃ©ticos con un papel absorbente en la base para retirar el exceso de suero.

3. **TÃ©cnicas de CongelaciÃ³n**:
   - **Leche**: Se puede congelar sin problema. Deja un espacio libre de 3 a 4 cm en la botella antes de congelar para permitir la expansiÃ³n del lÃ­quido.
   - **Queso rallado**: Ralla quesos como mozzarella o parmesano y congÃ©lalos en bolsas con cierre hermÃ©tico con una pizca de maicena para que no se apelmacen.
   - **Yogur**: ConviÃ©rtelo en cubitos de hielo en bandejas de silicona para agregarlos directamente a batidos y smoothies.

4. **TransformaciÃ³n Cero Desperdicio**:
   - Si tienes leche a punto de vencer, hiÃ©rvela con un chorrito de vinagre o limÃ³n para hacer **requesÃ³n / ricotta casera** en 10 minutos.`;
    } else {
      return `### ðŸ¥› Expert Techniques to Extend Dairy Shelf Life:

1. **Optimal Fridge Placement**:
   - Store milk and yogurts on the **middle or top shelves (35Â°F to 39Â°F / 2Â°C to 4Â°C)**.
   - âš ï¸ *Avoid the fridge door*, where temperature fluctuates continuously.

2. **Cheese Storage Secrets**:
   - **Hard & aged cheeses**: Wrap in parchment or wax paper instead of tight plastic wrap so moisture doesn't create mold.
   - **Fresh cheeses**: Keep in airtight containers with a paper towel beneath to absorb excess whey.

3. **Freezing Guide**:
   - **Milk**: Freeze leaving 1â€“2 inches of headspace for expansion. Thaw in the fridge and shake well.
   - **Grated Cheese**: Grate blocks and freeze with a dash of cornstarch in ziploc bags for easy sprinkling.
   - **Yogurt**: Portion into ice cube trays for instant smoothie boosts.

4. **Zero-Waste Transformations**:
   - If milk is nearing its date, heat it and add a splash of vinegar or lemon juice to craft fresh homemade ricotta in 10 minutes!`;
    }
  }

  // 2. Ripe fruits / Frutas maduras
  if (
    q.includes('fruta') ||
    q.includes('madur') ||
    q.includes('plÃ¡tano') ||
    q.includes('platano') ||
    q.includes('banana') ||
    q.includes('manzana') ||
    q.includes('fruit') ||
    q.includes('ripe')
  ) {
    if (isSpanish) {
      return `### ðŸŒ 5 Maneras Deliciosas de Aprovechar Frutas Muy Maduras:

1. **PlÃ¡tanos / Bananas con manchas marrones**:
   - PÃ©lalos, cÃ³rtalos en rodajas y congÃ©lalos en una bolsa hermÃ©tica. Son la base perfecta para batidos cremosos o helado casero saludable (*nice cream*) triturado en procesador.
   - Prepara un clÃ¡sico **Banana Bread** o tortitas exprÃ©s de 2 ingredientes (plÃ¡tano machacado + huevo).

2. **Manzanas y Peras arenosas o blandas**:
   - **Compota casera sin azÃºcar**: CocÃ­nalas a fuego lento troceadas con un toque de agua, canela y piel de limÃ³n durante 15 minutos.
   - CÃ³rtalas en lÃ¡minas finas y hornÃ©alas a baja temperatura (100Â°C) para hacer **chips crujientes de fruta**.

3. **Frutas Rojas, Fresas y Bayas**:
   - Prepara una **mermelada exprÃ©s en 10 minutos**: AplÃ¡stalas en una sartÃ©n con una cucharada de semillas de chÃ­a y un chorrito de zumo de limÃ³n hasta espesar.

4. **CÃ­tricos (Limones y Naranjas arrugados)**:
   - Ralla la piel antes de exprimir (se puede congelar para reposterÃ­a) y exprime el jugo en cubiteras para aderezos de ensalada o agua fresca.

5. **Vinagretas y Salsas Agridulces**:
   - Tritura mango o frutos maduros con aceite de oliva, vinagre de manzana y sal para una vinagreta gourmet.`;
    } else {
      return `### ðŸŒ 5 Ways to Rescue Ripe Fruits Before They Spoil:

1. **Spotted Bananas**:
   - Peel, slice, and freeze in airtight freezer bags. Blend frozen slices for instant creamy 1-ingredient "nice cream" or smoothies.
   - Bake into quick Banana Bread or 2-ingredient pancakes (mashed banana + eggs).

2. **Soft Apples & Pears**:
   - **Sugar-Free Compote**: Simmer diced fruit with cinnamon and a splash of water for 15 minutes.
   - Slice thin and bake at low heat (200Â°F/100Â°C) for crispy baked fruit chips.

3. **Berries & Strawberries**:
   - **10-Minute Chia Jam**: Mash berries in a pan with 1 tbsp chia seeds and a squeeze of lemon juice until thick.

4. **Wrinkled Citrus**:
   - Zest the peel first (freeze for baking) and juice into ice cube trays for dressings and drinks.`;
    }
  }

  // 3. Vegetables / Verduras mustias o excedentes
  if (
    q.includes('verdura') ||
    q.includes('vegetal') ||
    q.includes('hoja') ||
    q.includes('lechuga') ||
    q.includes('espinaca') ||
    q.includes('tomate') ||
    q.includes('vegetable') ||
    q.includes('salad')
  ) {
    if (isSpanish) {
      return `### ðŸ¥¬ Rescate y ConservaciÃ³n de Vegetales y Verduras:

1. **Hojas Verdes Mustias (Espinacas, Lechugas, Cilantro)**:
   - **Terapia de choque frÃ­o**: SumÃ©rgelas en agua con hielo durante 15â€“20 minutos; absorberÃ¡n agua por Ã³smosis y recuperarÃ¡n su textura crujiente.
   - Si ya no estÃ¡n crujientes para ensalada, tritÃºralas en un **pesto verde con ajo y frutos secos** o saltÃ©alas en revueltos.

2. **Tomates Muy Maduros**:
   - Asar al horno con dientes de ajo, orÃ©gano y aceite de oliva para una salsa pomodoro concentrada para pasta o pizza.

3. **Bolsa de Caldo Residuo Cero**:
   - Guarda en una bolsa en el congelador todos los tallos limpios, extremos de zanahorias, cebollas y puerros. Cuando la bolsa estÃ© llena, hiÃ©rvela 45 min para un caldo vegetal casero delicioso.

4. **Encurtido RÃ¡pido (Pickling en 10 min)**:
   - Corta pepinos, zanahorias o cebollas y cÃºbrelos con una mezcla caliente de vinagre, agua (1:1), sal y especias. Duran semanas en el refrigerador.`;
    } else {
      return `### ðŸ¥¬ Veggie Rescue & Preservation Masterclass:

1. **Reviving Wilted Greens (Spinach, Lettuce, Herbs)**:
   - **Ice Water Bath**: Submerge in ice-cold water for 15â€“20 minutes to restore crispness through osmosis.
   - If too soft for raw salads, blend into herb pestos or sautÃ© into omelettes.

2. **Overripe Tomatoes**:
   - Roast with whole garlic cloves, oregano, and olive oil for an umami-rich rustic pasta sauce.

3. **Zero-Waste Scrap Broth**:
   - Freeze clean vegetable trimmings, mushroom stems, onion skins, and carrot ends. Simmer for 45 min for homemade vegetable stock.

4. **Quick 10-Minute Pickling**:
   - Slice radishes, onions, or carrots and cover in hot brine (1:1 water to vinegar with salt). Keeps fresh for weeks in the fridge.`;
    }
  }

  // 4. Meat, Fish, Protein preservation / Carnes y Pescados
  if (
    q.includes('carne') ||
    q.includes('pollo') ||
    q.includes('pescado') ||
    q.includes('congelar') ||
    q.includes('huevo') ||
    q.includes('meat') ||
    q.includes('chicken') ||
    q.includes('fish') ||
    q.includes('freeze') ||
    q.includes('egg')
  ) {
    if (isSpanish) {
      return `### ðŸ— ConservaciÃ³n Segura de ProteÃ­nas y CongelaciÃ³n:

1. **Huevos**:
   - **Prueba de frescura en agua**: Coloca el huevo en un vaso con agua. Si se hunde al fondo en horizontal, es muy fresco. Si se pone de pie, consÃºmelo pronto. Si flota por completo, desÃ©chalo.
   - Claras sobrantes: CongÃ©lalas en bandejas de hielo para merengues o tortillas.

2. **Carnes y Aves**:
   - Divide en porciones individuales y congela en paquetes planos para que se descongelen de forma uniforme y rÃ¡pida.
   - **Marinado previo**: Congelar carne en marinadas con aceite y hierbas ayuda a retener humedad y potencia el sabor.

3. **Pescados**:
   - Cocina los pescados frescos en las primeras 24-48 horas, o prepÃ¡ralos en escabeche suave para extender su conservaciÃ³n 4-5 dÃ­as en la nevera.`;
    } else {
      return `### ðŸ— Safe Protein Storage & Freezing Guidelines:

1. **The Egg Float Test**:
   - Sink to the bottom flat: Super fresh. Stands upright: Eat soon. Floats to the top: Discard immediately.
   - Leftover whites: Freeze in ice cube trays for baking.

2. **Meats & Poultry**:
   - Portion into flat, airtight freezer packs for faster, even thawing.
   - Freeze in marinades (oil, herbs, citrus) to lock in juiciness.

3. **Seafood**:
   - Cook within 24â€“48 hours, or prepare into a light ceviche/escabeche to extend fridge life for 4 days.`;
    }
  }

  // 5. Bread & Carbs / Pan
  if (q.includes('pan') || q.includes('bread') || q.includes('arroz') || q.includes('pasta') || q.includes('rice')) {
    if (isSpanish) {
      return `### ðŸ¥– Aprovechamiento Total de Pan y Carbohidratos:

1. **Pan Duro o Asentado**:
   - **Crutones Gourmet**: CÃ³rtalo en cubos, rocÃ­a con aceite de oliva, ajo en polvo y sal, y hornea a 180Â°C durante 10 min.
   - **Pan Rallado Casero**: RÃ¡llalo o procÃ©salo con perejil y ajo seco.
   - **BudÃ­n de Pan o Torrijas**: RemÃ³jalo en leche aromatizada con canela y huevo para postres reconfortantes.

2. **Arroz Cocido del DÃ­a Anterior**:
   - El arroz refrigerado frÃ­o es ideal para preparar **Arroz Frito / Chaufa**, ya que el almidÃ³n se retrograda y los granos no se pegan en la sartÃ©n.`;
    } else {
      return `### ðŸ¥– Ultimate Stale Bread & Carb Rescues:

1. **Stale Bread**:
   - **Gourmet Garlic Croutons**: Cube, toss with olive oil, garlic powder & sea salt, bake at 350Â°F (180Â°C) for 10 minutes.
   - **Herb Breadcrumbs**: Pulse in a food processor with dried oregano and salt.
   - **Bread Pudding or French Toast**: Soak in milk, vanilla, and cinnamon for a classic dessert.

2. **Day-Old Rice**:
   - Chilled day-old rice has retrograded starch, making it the secret to perfect crispy restaurant-style **Fried Rice**!`;
    }
  }

  // 6. Generic / Pantry Inventory Contextual Response
  if (isSpanish) {
    return `### ðŸ‘¨â€ðŸ³ Consejos del Chef Zero-Waste:

Â¡Excelente consulta! Para optimizar los ingredientes de tu despensa (${validNames || 'ingredientes frescos'}):

1. **OrganizaciÃ³n FIFO (Primero en Entrar, Primero en Salir)**: Coloca siempre al frente de tus estantes y refrigerador los productos con fecha mÃ¡s prÃ³xima.
2. **Control de Humedad**: EnvuÃ©lvelos en papel absorbente dentro de recipientes hermÃ©ticos para evitar condensaciÃ³n.
3. **PlanificaciÃ³n de MenÃºs**: Cocina primero los productos con menos de 5 dÃ­as de margen combinÃ¡ndolos en salteados, sopas cremosas, tortillas o boles nutritivos.

Â¿Te gustarÃ­a que diseÃ±emos una receta especÃ­fica para alguno de tus ingredientes?`;
  } else {
    return `### ðŸ‘¨â€ðŸ³ Zero-Waste Chef Tips:

Great question! To get the most out of your kitchen staples (${validNames || 'fresh ingredients'}):

1. **FIFO Method (First-In, First-Out)**: Place near-expiry items at the front of your shelves and crisper drawers.
2. **Moisture Control**: Line storage containers with paper towels to absorb excess condensation.
3. **Rescue Cooking**: Prioritize items with under 5 days remaining by blending them into creamy soups, frittatas, or stir-fries.

Would you like a tailored recipe for any of your specific ingredients?`;
  }
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
) {
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response && (response.text || response.candidates?.length)) {
        return { response, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = (err?.message || JSON.stringify(err) || '').toLowerCase();
      const statusCode =
        err?.status ||
        err?.error?.code ||
        (errMsg.includes('503') ? 503 : errMsg.includes('429') ? 429 : 0);

      // If schema error or 503 on high demand with schema, retry model without strict responseSchema
      if (params.config?.responseSchema && (statusCode === 503 || statusCode === 400 || statusCode === 500)) {
        try {
          await sleep(150);
          const relaxedConfig = {
            ...params.config,
            responseMimeType: 'application/json',
          };
          delete relaxedConfig.responseSchema;
          const relaxedRes = await ai.models.generateContent({
            model,
            contents: params.contents,
            config: relaxedConfig,
          });
          if (relaxedRes && (relaxedRes.text || relaxedRes.candidates?.length)) {
            return { response: relaxedRes, modelUsed: `${model}-relaxed` };
          }
        } catch {
          // continue to next model in pool
        }
      }

      // Small jitter before trying next distinct model
      await sleep(100);
    }
  }

  throw lastError || new Error('All Gemini models are temporarily experiencing high demand');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS for mobile apps (Capacitor/Android APK) and cross-origin clients
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Trust Render's reverse proxy to get the real client IP for rate limiting
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '10mb' }));

  // Rate Limiting (Security & Cost Control)
  const aiRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 requests per IP per hour
    message: { error: 'Demasiadas peticiones a la IA, intenta de nuevo mÃ¡s tarde.' },
  });
  app.use('/api/ai/', aiRateLimiter);

  // In-memory Recipe Cache (Memoria Inteligente)
  const recipeCache = new Map<string, { data: any; timestamp: number }>();

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // POST /api/ai/recipes
  app.post('/api/ai/recipes', async (req, res) => {
    try {
      const {
        products = [],
        mealType = 'all',
        customPrompt = '',
        preferences = { language: 'es', unitSystem: 'metric' },
      } = req.body;
      const isSpanish = preferences.language !== 'en';
      const now = new Date();

      // Check Cache (Memoria Inteligente)
      const cacheKey = JSON.stringify({
        prods: products.map((p: any) => ({ name: p.name, q: p.quantity, loc: p.location })),
        mealType, customPrompt, lang: preferences.language
      });
      const cached = recipeCache.get(cacheKey);
      if (cached && now.getTime() - cached.timestamp < 1000 * 60 * 60 * 24) { // 24 hours
        return res.json({ ...cached.data, isCached: true });
      }

      // SAFETY FILTER: Strictly separate valid products from expired products
      const validProducts: any[] = [];
      const expiringSoonProducts: any[] = [];
      const expiredProducts: any[] = [];

      products.forEach((p: any) => {
        const exp = new Date(p.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
        const itemInfo = {
          name: p.name,
          category: p.category,
          quantity: p.quantity,
          unit: p.unit,
          location: p.location,
          daysRemaining: diffDays,
          isExpiringSoon: diffDays >= 0 && diffDays <= 5,
        };

        if (diffDays < 0) {
          expiredProducts.push(itemInfo);
        } else {
          validProducts.push(itemInfo);
          if (itemInfo.isExpiringSoon) {
            expiringSoonProducts.push(itemInfo);
          }
        }
      });

      const ai = getGeminiClient();

      if (!ai || validProducts.length === 0) {
        return res.json(
          generateLocalRecipes(validProducts, expiringSoonProducts, expiredProducts.length, mealType, preferences)
        );
      }

      const promptContext = `
Eres un Chef Profesional experto en Cocina de Aprovechamiento (Zero-Waste Cooking).
Tu misión es crear recetas deliciosas, creativas y prácticas utilizando ÚNICAMENTE los ingredientes válidos disponibles en la despensa del usuario.

REGLAS CRÍTICAS:
1. **SALUD:** NUNCA uses ni recomiendes productos caducados. (Se omitieron ${expiredProducts.length} caducados).
2. **PRIORIDAD DE RESCATE:** Si el usuario no pide nada específico, dale máxima prioridad a los productos próximos a caducar para evitar que se echen a perder.
3. **SOLICITUD ESPECIAL DEL USUARIO:** Si el usuario escribió una solicitud (ej. "Quiero algo con carne", "Antojo dulce"), ESTA ES TU PRIORIDAD NÚMERO UNO. Ignora la regla de caducidad y haz recetas enfocadas EXACTAMENTE en lo que pidió, usando los ingredientes de su despensa que coincidan con su antojo.
4. Puedes sugerir condimentos básicos adicionales muy comunes (sal, aceite, ajo, etc.) pero márcalos claramente.

INVENTARIO VÁLIDO DE LA DESPENSA (${validProducts.length} productos):
${JSON.stringify(validProducts, null, 2)}

PRODUCTOS CON PRIORIDAD DE RESCATE (Vencen en 0 a 5 días):
${JSON.stringify(expiringSoonProducts, null, 2)}

SOLICITUD ESPECIAL DEL USUARIO: "${customPrompt || 'Ninguna, prioriza rescatar comida por caducar'}"
TIPO DE COMIDA: "${mealType}"
IDIOMA: ${isSpanish ? 'Español' : 'English'}

Genera entre 3 y 4 recetas variadas en formato JSON asegurándote de obedecer estrictamente si hay una solicitud especial.
`;

      const { response, modelUsed } = await generateWithModelFallback(ai, {
        contents: promptContext,
        config: {
          systemInstruction: `You are an expert master chef dedicated to zero-waste cooking and sustainable gastronomy. Always generate appetizing, safe, realistic recipes strictly in JSON matching the schema. Language must be ${preferences.language === 'en' ? 'English' : 'Spanish'}. Never use expired food.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              chefGreeting: {
                type: Type.STRING,
                description: 'Warm encouraging chef greeting explaining how these recipes rescue near-expiry ingredients',
              },
              recipes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: {
                      type: Type.STRING,
                      enum: ['desayuno', 'almuerzo_cena', 'express', 'postre_snack'],
                    },
                    categoryLabel: { type: Type.STRING, description: 'e.g. Desayuno Saludable, Cena Express' },
                    prepTime: { type: Type.STRING, description: 'e.g. 10 min' },
                    cookTime: { type: Type.STRING, description: 'e.g. 15 min' },
                    servings: { type: Type.INTEGER },
                    difficulty: { type: Type.STRING, enum: ['FÃ¡cil', 'Media', 'RÃ¡pida'] },
                    rescuedPantryIngredients: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          quantity: { type: Type.STRING },
                          isFromPantry: { type: Type.BOOLEAN },
                          isExpiringSoon: { type: Type.BOOLEAN },
                          daysRemaining: { type: Type.INTEGER },
                        },
                        required: ['name', 'isFromPantry', 'isExpiringSoon'],
                      },
                    },
                    extraIngredients: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          quantity: { type: Type.STRING },
                          isOptional: { type: Type.BOOLEAN },
                        },
                        required: ['name', 'isOptional'],
                      },
                    },
                    steps: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    chefTip: { type: Type.STRING },
                    zeroWasteBenefit: { type: Type.STRING },
                  },
                  required: [
                    'id',
                    'title',
                    'description',
                    'category',
                    'categoryLabel',
                    'prepTime',
                    'cookTime',
                    'servings',
                    'difficulty',
                    'rescuedPantryIngredients',
                    'extraIngredients',
                    'steps',
                    'chefTip',
                    'zeroWasteBenefit',
                  ],
                },
              },
            },
            required: ['chefGreeting', 'recipes'],
          },
        },
      });

      const parsed = safeExtractJson(response.text, {});
      const resultData = {
        ...parsed,
        expiredItemsIgnoredCount: expiredProducts.length,
        expiringItemsCount: expiringSoonProducts.length,
        lastGeneratedAt: new Date().toISOString(),
        aiModel: modelUsed,
      };

      // Save to Cache
      recipeCache.set(cacheKey, { data: resultData, timestamp: now.getTime() });

      return res.json(resultData);
    } catch (err: any) {
      console.warn('AI recipe generation error, falling back to local generator:', err?.message || err);
      const now = new Date();
      const validProducts: any[] = [];
      const expiringSoonProducts: any[] = [];
      let expiredCount = 0;

      (req.body.products || []).forEach((p: any) => {
        const exp = new Date(p.expiryDate);
        const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diff < 0) {
          expiredCount++;
        } else {
          const item = { ...p, daysRemaining: diff, isExpiringSoon: diff <= 5 };
          validProducts.push(item);
          if (item.isExpiringSoon) expiringSoonProducts.push(item);
        }
      });

      return res.json(
        generateLocalRecipes(
          validProducts,
          expiringSoonProducts,
          expiredCount,
          req.body.mealType || 'all',
          req.body.preferences
        )
      );
    }
  });

  // POST /api/ai/ask-advisor (Chef IA Asistente Interactivo)
  app.post('/api/ai/ask-advisor', async (req, res) => {
    try {
      const {
        question,
        history = [],
        products = [],
        shoppingItems = [],
        preferences = { language: 'es' },
      } = req.body;
      const isSpanish = preferences.language !== 'en';
      const now = new Date();

      if (!question || !question.trim()) {
        return res.status(400).json({ error: 'Question is required' });
      }

      // SAFETY: Filter out expired items
      const validProducts = (products || []).filter((p: any) => {
        const diff = Math.ceil((new Date(p.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
        return diff >= 0;
      });

      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          answer: generateContextualAdvisorResponse(question, validProducts, isSpanish),
        });
      }

      // Build conversation context
      const formattedHistory = (history || [])
        .slice(-6)
        .map((h: any) => `${h.sender === 'user' ? 'Usuario' : 'Chef IA'}: ${h.text}`)
        .join('\n');

      const prompt = `
Eres el Chef y Asesor Culinario IA de Pantry Guard, experto mundial en cocina de aprovechamiento (Zero-Waste Cooking), conservaciÃ³n avanzada de alimentos y seguridad alimentaria.

HISTORIAL RECIENTE DE LA CONVERSACIÃ“N:
${formattedHistory ? formattedHistory : '(Inicio de conversaciÃ³n)'}

NUEVA PREGUNTA DEL USUARIO:
"${question}"

REGLAS OBLIGATORIAS:
1. Responde de forma DIRECTA, EXPERTA, PRÃCTICA Y ESPECÃFICA a la pregunta del usuario. Si pregunta por tÃ©cnicas de conservaciÃ³n de lÃ¡cteos, responde sobre lÃ¡cteos; si pregunta por frutas maduras, responde sobre frutas maduras; si pide recetas o sustitutos, dÃ¡selos con medidas claras.
2. SEGURIDAD ALIMENTARIA: NUNCA sugieras consumir alimentos caducados o con signos de descomposiciÃ³n.
3. INVENTARIO VÃLIDO EN DESPENSA (${validProducts.length} productos disponibles):
${JSON.stringify(validProducts.map((p: any) => ({ name: p.name, category: p.category, qty: `${p.quantity} ${p.unit}`, exp: p.expiryDate })))}

Responde en ${isSpanish ? 'EspaÃ±ol' : 'English'} con formato Markdown enriquecido (encabezados, viÃ±etas, negritas, emojis culinarios sutiles) listo para leer.
`;

      const { response } = await generateWithModelFallback(ai, {
        contents: prompt,
      });

      const generatedAnswer = response.text?.trim();
      return res.json({
        answer: generatedAnswer || generateContextualAdvisorResponse(question, validProducts, isSpanish),
      });
    } catch (err: any) {
      console.warn('AI Advisor query fallback:', err?.message || err);
      const isSpanish = req.body.preferences?.language !== 'en';
      return res.json({
        answer: generateContextualAdvisorResponse(req.body.question, req.body.products, isSpanish),
      });
    }
  });

  // POST /api/ai/scan-image (Gemini Vision Multimodal Barcode & Packaging Reader)
  app.post('/api/ai/scan-image', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', language = 'es' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required' });
      }

      // Remove data URL prefix if present (e.g. data:image/jpeg;base64,)
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'AI service unavailable',
          message: 'GEMINI_API_KEY is not configured',
        });
      }

      const prompt = `
Analiza con mÃ¡xima precisiÃ³n esta fotografÃ­a de un producto comestible o cÃ³digo de barras de supermercado.

TUS OBJETIVOS:
1. CÃ“DIGO DE BARRAS: Busca si hay un cÃ³digo de barras impreso o dÃ­gitos numÃ©ricos (ej. EAN-13 de 13 dÃ­gitos, UPC de 12 dÃ­gitos, EAN-8). Lee con exactitud los nÃºmeros impresos debajo de las barras. Si es visible, colÃ³calo en 'barcode'. Si no hay cÃ³digo de barras visible, deja una cadena vacÃ­a.
2. NOMBRE Y MARCA: Identifica el nombre del producto en ${language === 'en' ? 'English' : 'EspaÃ±ol'} y su marca comercial principal (ej. "Leche Entera", marca "Lala").
3. CATEGORÃA: ClasifÃ­calo estrictamente en una de: 'lacteos', 'verduras', 'frutas', 'proteinas', 'granos', 'bebidas', 'otros'.
4. CANTIDAD Y UNIDAD: Identifica el contenido neto numÃ©rico aproximado (ej. 1, 500, 250) y su unidad ('unidades', 'kg', 'g', 'L', 'ml', 'lb', 'oz').
5. UBICACIÃ“N RECOMENDADA: 'Refrigerador', 'Alacena', 'Frutero', o 'Congelador'.
6. ESTIMACIÃ“N DE VIDA ÃšTIL: DÃ­as aproximados recomendados de conservaciÃ³n antes de caducar (ej. Leche cerrada = 12 dÃ­as, pollo fresco = 3 dÃ­as, enlatado = 365 dÃ­as).

Responde ÃšNICAMENTE en formato JSON estructurado.
`;

      const { response, modelUsed } = await generateWithModelFallback(ai, {
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          {
            text: prompt,
          },
        ],
        config: {
          systemInstruction:
            'You are an expert computer vision model specialized in optical character recognition (OCR), grocery retail barcodes (EAN-13, UPC-A, etc.), and food inventory identification. Always return strictly valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              barcode: {
                type: Type.STRING,
                description: 'The exact numeric sequence of the barcode if visible (e.g. 7501055300075), or empty string if not visible',
              },
              productName: {
                type: Type.STRING,
                description: 'Full descriptive name of the product in Spanish or user language',
              },
              brand: {
                type: Type.STRING,
                description: 'Brand or manufacturer',
              },
              category: {
                type: Type.STRING,
                enum: ['lacteos', 'verduras', 'frutas', 'proteinas', 'granos', 'bebidas', 'otros'],
              },
              quantity: {
                type: Type.NUMBER,
                description: 'Numeric quantity/weight',
              },
              unit: {
                type: Type.STRING,
                enum: ['unidades', 'kg', 'g', 'L', 'ml', 'lb', 'oz'],
              },
              location: {
                type: Type.STRING,
                enum: ['Refrigerador', 'Alacena', 'Frutero', 'Congelador'],
              },
              estimatedExpiryDays: {
                type: Type.INTEGER,
                description: 'Estimated shelf life in days from today',
              },
              confidence: {
                type: Type.STRING,
                enum: ['high', 'medium', 'low'],
              },
            },
            required: [
              'barcode',
              'productName',
              'category',
              'quantity',
              'unit',
              'location',
              'estimatedExpiryDays',
            ],
          },
        },
      });

      const parsed = safeExtractJson(response.text, {});
      return res.json({
        success: true,
        data: parsed,
        aiModel: modelUsed,
      });
    } catch (err: any) {
      console.warn('AI image scan error:', err?.message || err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Error processing image with AI',
      });
    }
  });

  // POST /api/ai/scan-receipt (Gemini Vision Grocery Receipt / Ticket OCR)
  app.post('/api/ai/scan-receipt', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', language = 'es' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required' });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'AI service unavailable',
          message: 'GEMINI_API_KEY is not configured',
        });
      }

      const prompt = `
Analiza esta fotografÃ­a de un ticket o recibo de compra del supermercado o tienda de abarrotes.

TUS OBJETIVOS:
1. Extrae todos los artÃ­culos o productos comestibles / de despensa listados en el ticket.
2. Limpia los nombres abreviados del supermercado a nombres claros y legibles en ${language === 'en' ? 'English' : 'EspaÃ±ol'} (ej. si el ticket dice "LCH ENT LALA 1L", conviÃ©rtelo a "Leche Entera Lala").
3. Asigna la categorÃ­a correcta: 'lacteos', 'verduras', 'frutas', 'proteinas', 'granos', 'bebidas', 'otros'.
4. Determina la cantidad y unidad ('unidades', 'kg', 'g', 'L', 'ml', 'lb', 'oz').
5. Asigna la ubicaciÃ³n recomendada ('Refrigerador', 'Alacena', 'Frutero', 'Congelador').
6. Estima los dÃ­as aproximados de vida Ãºtil recomendada antes de caducar.
7. Omite conceptos no alimenticios (como bolsas de plÃ¡stico, cargos de tarjeta, propinas o artÃ­culos de ferreterÃ­a).

Devuelve una lista estructurada con los productos encontrados.
`;

      const { response, modelUsed } = await generateWithModelFallback(ai, {
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          {
            text: prompt,
          },
        ],
        config: {
          systemInstruction:
            'You are an expert OCR receipt parser specialized in grocery receipts, supermarket tickets, and pantry item categorization. Return strict valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              storeName: {
                type: Type.STRING,
                description: 'Store or supermarket name if identifiable from receipt header',
              },
              receiptDate: {
                type: Type.STRING,
                description: 'Date on receipt in YYYY-MM-DD format if visible',
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: 'Clean readable product name',
                    },
                    category: {
                      type: Type.STRING,
                      enum: ['lacteos', 'verduras', 'frutas', 'proteinas', 'granos', 'bebidas', 'otros'],
                    },
                    quantity: {
                      type: Type.NUMBER,
                      description: 'Quantity purchased',
                    },
                    unit: {
                      type: Type.STRING,
                      enum: ['unidades', 'kg', 'g', 'L', 'ml', 'lb', 'oz'],
                    },
                    location: {
                      type: Type.STRING,
                      enum: ['Refrigerador', 'Alacena', 'Frutero', 'Congelador'],
                    },
                    estimatedExpiryDays: {
                      type: Type.INTEGER,
                      description: 'Estimated shelf life in days from today',
                    },
                  },
                  required: [
                    'name',
                    'category',
                    'quantity',
                    'unit',
                    'location',
                    'estimatedExpiryDays',
                  ],
                },
              },
            },
            required: ['items'],
          },
        },
      });

      const parsed = safeExtractJson(response.text, { items: [] });
      return res.json({
        success: true,
        data: parsed,
        aiModel: modelUsed,
      });
    } catch (err: any) {
      console.warn('Receipt OCR error:', err?.message || err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Error parsing supermarket receipt with AI',
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pantry Guard Server running on http://0.0.0.0:${PORT}`);
  });
}

// Deterministic heuristic fallback recipe generator when API key is offline or cold
function generateLocalRecipes(
  validProducts: any[],
  expiringSoonProducts: any[],
  expiredCount: number,
  mealType: string,
  preferences: any
) {
  const isSpanish = preferences?.language !== 'en';
  const recipes: any[] = [];

  // Group pantry names for pattern matching
  const hasItem = (query: string) =>
    validProducts.find((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const eggs = hasItem('huevo');
  const milk = hasItem('leche');
  const bread = hasItem('pan');
  const yogurt = hasItem('yogurt') || hasItem('yogur');
  const fruits = validProducts.filter((p) => p.category === 'frutas' || ['manzana', 'platano', 'banana', 'fresa', 'naranja'].some((f) => p.name.toLowerCase().includes(f)));
  const veggies = validProducts.filter((p) => p.category === 'verduras' || ['tomate', 'cebolla', 'zanahoria', 'espinaca', 'lechuga', 'pimiento'].some((v) => p.name.toLowerCase().includes(v)));
  const meats = validProducts.filter((p) => p.category === 'carnes' || ['pollo', 'carne', 'atun', 'jamon', 'pavo'].some((m) => p.name.toLowerCase().includes(m)));
  const grains = validProducts.filter((p) => p.category === 'granos' || ['arroz', 'pasta', 'avena', 'fideos'].some((g) => p.name.toLowerCase().includes(g)));
  const dairy = validProducts.filter((p) => p.category === 'lacteos' || ['queso', 'crema', 'mantequilla'].some((d) => p.name.toLowerCase().includes(d)));

  // 1. Desayuno / Bowl de Fruta o Tostadas
  if (fruits.length > 0 || yogurt || eggs || bread) {
    const rescueList = [...fruits, yogurt, eggs, bread].filter(Boolean).slice(0, 3);
    recipes.push({
      id: 'local-rec-1',
      title: isSpanish ? 'Tostadas & Bowl EnergÃ©tico de Aprovechamiento' : 'Zero-Waste Energy Bowl & Toast',
      description: isSpanish
        ? 'Una combinaciÃ³n deliciosa para iniciar el dÃ­a utilizando frutas y lÃ¡cteos frescos en su punto Ã³ptimo de madurez.'
        : 'A delicious morning combination making the most of ripe fruits and fresh dairy at their flavor peak.',
      category: 'desayuno',
      categoryLabel: isSpanish ? 'Desayuno Saludable' : 'Healthy Breakfast',
      prepTime: '5 min',
      cookTime: '5 min',
      servings: 2,
      difficulty: 'RÃ¡pida',
      rescuedPantryIngredients: rescueList.map((p) => ({
        name: p.name,
        quantity: `${p.quantity} ${p.unit}`,
        isFromPantry: true,
        isExpiringSoon: p.isExpiringSoon || false,
        daysRemaining: p.daysRemaining,
      })),
      extraIngredients: [
        { name: isSpanish ? 'Miel o canela al gusto' : 'Honey or cinnamon', isOptional: true },
        { name: isSpanish ? 'Aceite de oliva' : 'Olive oil', isOptional: false },
      ],
      steps: isSpanish
        ? [
            'Lava y corta las frutas disponibles en rebanadas finas.',
            'Tuesta el pan hasta que quede dorado y crujiente.',
            'Si tienes huevos, prepÃ¡ralos revueltos a fuego medio con una pizca de sal.',
            'Sirve en un tazÃ³n combinando las frutas con el yogurt o acompÃ¡Ã±alas con las tostadas calientes.',
          ]
        : [
            'Wash and slice all available ripe fruits into thin pieces.',
            'Toast the bread until golden and crisp.',
            'If you have eggs, scramble them gently over medium heat with a pinch of salt.',
            'Assemble your fruit bowl with yogurt or serve over warm crispy toast.',
          ],
      chefTip: isSpanish
        ? 'Si la fruta estÃ¡ muy madura, tambiÃ©n puedes triturarla directamente como mermelada rÃ¡pida sin azÃºcar aÃ±adido.'
        : 'If fruit is very ripe, mash it into an instant quick spread with no added sugar.',
      zeroWasteBenefit: isSpanish
        ? 'Evita que las frutas y lÃ¡cteos maduros se deterioren al consumirlos a tiempo.'
        : 'Prevents ripe fruits and opened dairy from spoiling by using them immediately.',
    });
  }

  // 2. Almuerzo / Cena: Salteado o Frittata con Vegetales y ProteÃ­na
  if (veggies.length > 0 || eggs || meats.length > 0 || grains.length > 0) {
    const rescueList = [...veggies, ...meats, eggs, ...dairy].filter(Boolean).slice(0, 4);
    recipes.push({
      id: 'local-rec-2',
      title: isSpanish ? 'Salteado Campestre Rescate de Verduras & ProteÃ­na' : 'Garden SautÃ© & Protein Rescue Skillet',
      description: isSpanish
        ? 'Un plato reconfortante donde todas tus verduras y proteÃ­nas se integran con hierbas y un toque crujiente.'
        : 'A comforting one-pan dish blending all your fresh vegetables and protein with a delicious savory sear.',
      category: 'almuerzo_cena',
      categoryLabel: isSpanish ? 'Almuerzo / Cena Nutritiva' : 'Nutritious Lunch / Dinner',
      prepTime: '10 min',
      cookTime: '15 min',
      servings: 2,
      difficulty: 'FÃ¡cil',
      rescuedPantryIngredients: rescueList.map((p) => ({
        name: p.name,
        quantity: `${p.quantity} ${p.unit}`,
        isFromPantry: true,
        isExpiringSoon: p.isExpiringSoon || false,
        daysRemaining: p.daysRemaining,
      })),
      extraIngredients: [
        { name: isSpanish ? '1 diente de ajo o cebolla' : '1 garlic clove or onion', isOptional: true },
        { name: isSpanish ? 'Sal, pimienta y aceite de cocina' : 'Salt, pepper & cooking oil', isOptional: false },
      ],
      steps: isSpanish
        ? [
            'Corta todas las verduras en cubos o tiras de tamaÃ±o uniforme para que se cocinen al mismo tiempo.',
            'Calienta 1 cucharada de aceite en una sartÃ©n grande a fuego medio-alto.',
            'Saltea primero las verduras mÃ¡s firmes (zanahorias, pimientos) por 4 minutos y luego aÃ±ade las mÃ¡s suaves.',
            'Agrega las proteÃ­nas (pollo, atÃºn o huevos batidos) y cocina hasta que estÃ©n en su punto exacto.',
            'Condimenta con sal y pimienta al gusto antes de servir caliente.',
          ]
        : [
            'Dice all vegetables evenly so they cook at the same pace.',
            'Heat 1 tbsp of cooking oil in a large skillet over medium-high heat.',
            'SautÃ© firmer vegetables first for 4 minutes, then add softer greens and herbs.',
            'Fold in your protein or beaten eggs, cooking until golden and tender.',
            'Season with salt, pepper, and serve steaming hot.',
          ],
      chefTip: isSpanish
        ? 'Guarda los tallos de las verduras en una bolsa en el congelador para hacer caldos caseros sabrosos.'
        : 'Save clean veggie stems in a freezer bag to brew delicious homemade vegetable broth.',
      zeroWasteBenefit: isSpanish
        ? 'Aprovecha hasta el Ãºltimo vegetal de tu despensa antes de que pierda su frescura y turgencia.'
        : 'Uses up every fresh vegetable in your crisper drawer before it loses crunch.',
    });
  }

  // 3. Express (<15 min): Pasta o Arroz Salteado Cero Desperdicio
  recipes.push({
    id: 'local-rec-3',
    title: isSpanish ? 'Cazuela Express Cero Desperdicio' : 'Quick Zero-Waste Pantry Skillet',
    description: isSpanish
      ? 'PreparaciÃ³n sÃºper rÃ¡pida lista en 12 minutos con lo que tengas a mano en la despensa.'
      : 'Super speedy 12-minute meal built around your available staples and seasonings.',
    category: 'express',
    categoryLabel: isSpanish ? 'Comida RÃ¡pida (<15 min)' : 'Express Meal (<15 min)',
    prepTime: '5 min',
    cookTime: '10 min',
    servings: 2,
    difficulty: 'RÃ¡pida',
    rescuedPantryIngredients: (expiringSoonProducts.length > 0 ? expiringSoonProducts : validProducts).slice(0, 3).map((p) => ({
      name: p.name,
      quantity: `${p.quantity} ${p.unit}`,
      isFromPantry: true,
      isExpiringSoon: p.isExpiringSoon || false,
      daysRemaining: p.daysRemaining,
    })),
    extraIngredients: [
      { name: isSpanish ? 'Aceite de oliva o mantequilla' : 'Olive oil or butter', isOptional: false },
      { name: isSpanish ? 'Hierbas secas (orÃ©gano, albahaca)' : 'Dried herbs (oregano, basil)', isOptional: true },
    ],
    steps: isSpanish
      ? [
          'ReÃºne y pica finamente los ingredientes seleccionados.',
          'DÃ³ralos en una sartÃ©n con un chorrito de aceite a fuego vivo durante 6-8 minutos.',
          'Ajusta la sazÃ³n con tus especias favoritas y sirve de inmediato.',
        ]
      : [
          'Chop all selected pantry items into small bite-sized pieces.',
          'Sear in a hot pan with olive oil or butter for 6-8 minutes until fragrant.',
          'Season with favorite spices and serve warm right away.',
        ],
    chefTip: isSpanish
      ? 'Unas gotas de limÃ³n o vinagre al final realzan los sabores y reviven cualquier vegetal salteado.'
      : 'A squeeze of fresh lemon or vinegar at the end brightens up any quick sautÃ©.',
    zeroWasteBenefit: isSpanish
      ? 'Rescata ingredientes solitarios de la nevera convirtiÃ©ndolos en un plato sabroso.'
      : 'Turns single leftover ingredients into a complete, delicious meal.',
  });

  // 4. Snacks / Postres: Bocaditos o Smoothie de Frutas & LÃ¡cteos
  const snackRescue = [...fruits, yogurt, milk, eggs, bread].filter(Boolean);
  recipes.push({
    id: 'local-rec-4',
    title: isSpanish ? 'Smoothie o Bocados Dulces de Aprovechamiento' : 'Zero-Waste Sweet Bites & Smoothie',
    description: isSpanish
      ? 'Snack nutritivo o postre ligero ideal para aprovechar frutas dulces, lÃ¡cteos o avena que tengas en casa.'
      : 'A nutrient-dense snack or light dessert great for using ripe fruits, milk, yogurt, or grains.',
    category: 'postre_snack',
    categoryLabel: isSpanish ? 'Snack / Postre Saludable' : 'Healthy Snack / Dessert',
    prepTime: '5 min',
    cookTime: '0 min',
    servings: 2,
    difficulty: 'RÃ¡pida',
    rescuedPantryIngredients: (snackRescue.length > 0 ? snackRescue : validProducts).slice(0, 3).map((p) => ({
      name: p.name,
      quantity: `${p.quantity} ${p.unit}`,
      isFromPantry: true,
      isExpiringSoon: p.isExpiringSoon || false,
      daysRemaining: p.daysRemaining,
    })),
    extraIngredients: [
      { name: isSpanish ? 'Canela, cacao en polvo o vainilla' : 'Cinnamon, cocoa or vanilla', isOptional: true },
      { name: isSpanish ? 'Hielo o agua frÃ­a' : 'Ice or cold water', isOptional: true },
    ],
    steps: isSpanish
      ? [
          'Pela y corta las frutas mÃ¡s maduras en trozos medianos.',
          'Coloca en la batidora o tritura con tenedor junto con la leche, yogurt o bebida disponible.',
          'LicÃºa hasta obtener una textura suave y cremosa.',
          'Espolvorea una pizca de canela o frutos secos antes de degustar bien frÃ­o.',
        ]
      : [
          'Peel and slice your ripest fruits into chunks.',
          'Blend or mash thoroughly with available milk, yogurt, or plant milk.',
          'Process until smooth and silky.',
          'Dust with a hint of cinnamon or toppings and enjoy chilled.',
        ],
    chefTip: isSpanish
      ? 'Puedes congelar trozos de fruta que estÃ©n por madurar demasiado para futuros smoothies instantÃ¡neos.'
      : 'Freeze overripe fruit chunks in advance for instant frosty zero-waste smoothies anytime.',
    zeroWasteBenefit: isSpanish
      ? 'Aprovecha las frutas en su punto mÃ¡s dulce sin necesidad de aÃ±adir azÃºcares refinados.'
      : 'Takes advantage of natural peak fruit sweetness without any added refined sugars.',
  });

  return {
    chefGreeting: isSpanish
      ? `Â¡Hola! He diseÃ±ado estas recetas utilizando Ãºnicamente tus ${validProducts.length} productos aptos en despensa, dÃ¡ndole mÃ¡xima prioridad a los ${expiringSoonProducts.length} que vencen pronto. ${expiredCount > 0 ? `(Nota de seguridad: Se han excluido ${expiredCount} productos ya caducados).` : ''}`
      : `Hello! I crafted these recipes using your ${validProducts.length} valid pantry items, prioritizing the ${expiringSoonProducts.length} near expiry. ${expiredCount > 0 ? `(Safety note: Excluded ${expiredCount} expired items).` : ''}`,
    recipes,
    expiredItemsIgnoredCount: expiredCount,
    expiringItemsCount: expiringSoonProducts.length,
    lastGeneratedAt: new Date().toISOString(),
    aiModel: 'pantry-guard-local-chef',
  };
}

startServer();


