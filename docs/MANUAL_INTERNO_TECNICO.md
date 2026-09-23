# Manual Técnico y Documentación Interna
## Pantry Guard — Despensa Inteligente y Cocina Cero Desperdicio

---

## 1. Información General del Sistema
* **Nombre del Proyecto:** Pantry Guard
* **Versión:** 1.0.0
* **Arquitectura:** Cliente-Servidor Híbrido (PWA / TWA Full-Stack con Backend for Frontend - BFF)
* **Lenguajes:** TypeScript (Frontend y Backend), HTML5, CSS3
* **Entorno de Ejecución:** Node.js (v20+ / v24)
* **Framework Frontend:** React 19 + Vite 6
* **Framework Backend:** Express 4
* **Diseño y Estilos:** Tailwind CSS 4 con soporte modo claro/oscuro
* **Motor de Inteligencia Artificial:** Google Gemini API (`@google/genai` con modelo `gemini-2.5-flash`)
* **Librerías de Visión / Escaneo:** Html5Qrcode, Native BarcodeDetector API, ZXing Library, HTML2Canvas, Canvas-Confetti

---

## 2. Arquitectura del Software

El sistema sigue el patrón **Backend-for-Frontend (BFF)** para garantizar que ninguna credencial sensible ni lógica de cobro del LLM se exponga en el cliente móvil.

```
[ Cliente Móvil (Android / iOS / Web) ]
       │
       │ HTTPS (TLS 1.3)
       ▼
[ Servidor Express (server.ts) en Render ]
  ├── Middleware de Seguridad y Validación de Esquemas
  ├── Memoria Caché de Consultas (MEM_CACHE)
  ├── Motor de Recetas Locales de Respaldo (generateLocalRecipes)
  └── Integración con Google GenAI SDK (process.env.GEMINI_API_KEY)
       │
       ├── Google Gemini API (Inferencia multimodal y recetas)
       └── Open Food Facts API (Catálogo global de códigos de barras)
```

---

## 3. Estructura del Código Fuente

```text
Pantry-Guard/
├── src/
│   ├── components/                 # Componentes de interfaz de usuario
│   │   ├── AIInsightsView.tsx      # Módulo de recetas generadas por IA y filtros
│   │   ├── BarcodeScannerModal.tsx # Escáner de código de barras (video en vivo + hardware)
│   │   ├── ReceiptScanModal.tsx    # Escáner OCR de tickets de compra con Gemini Vision
│   │   ├── ProductModal.tsx        # Formulario de alta y edición de alimentos
│   │   ├── ProductCard.tsx         # Tarjeta individual con semáforo de caducidad
│   │   ├── PantryListView.tsx      # Vista general de despensa con buscador y filtros
│   │   ├── ShoppingListView.tsx    # Lista dinámica de compras
│   │   └── TopNavBar.tsx           # Barra superior con selector de idioma y tema
│   ├── data/
│   │   └── initialData.ts          # Catálogo inicial de productos y códigos precargados
│   ├── utils/
│   │   ├── barcodeService.ts       # Consultas a Open Food Facts, caché y cálculo de días
│   │   ├── imageBarcodeDecoder.ts  # Decodificación rápida de fotos con hardware / ZXing
│   │   ├── i18n.ts                 # Diccionario bilingüe completo (Español / Inglés)
│   │   └── storage.ts              # Persistencia local (LocalStorage / IndexedDB)
│   ├── types.ts                    # Definiciones TypeScript de entidades y enums
│   ├── App.tsx                     # Orquestador principal de estado y vistas
│   ├── main.tsx                    # Punto de montaje de React
│   └── index.css                   # Estilos globales, Tailwind CSS y reglas de cámara
├── server.ts                       # Servidor Express, endpoints de IA y fallback local
├── vite.config.ts                  # Configuración del empaquetador Vite
├── package.json                    # Dependencias y scripts de construcción
├── .gitignore                      # Reglas de exclusión para Git (.env ignorado)
└── .env.example                    # Plantilla de variables de entorno sin credenciales
```

---

## 4. Endpoints del Backend (API REST)

Todas las rutas están centralizadas en `server.ts`:

### 1. `POST /api/ai/recipes`
* **Descripción:** Analiza los productos vigentes y próximos a caducar para generar recetas de aprovechamiento.
* **Payload de entrada:**
  ```json
  {
    "products": [
      { "name": "Leche", "quantity": 1, "unit": "L", "daysRemaining": 2, "isExpiringSoon": true }
    ],
    "preferences": { "language": "es" }
  }
  ```
* **Respuesta:** JSON estructurado validado con `responseSchema` conteniendo array de recetas, pasos e ingredientes faltantes.
* **Resiliencia:** Si la API de Gemini falla o se desconecta, el servidor activa automáticamente `generateLocalRecipes()` sin devolver error 500.

### 2. `POST /api/ai/scan-receipt`
* **Descripción:** Procesa imágenes de tickets de compra mediante Gemini Vision para extraer artículos y estimar fechas de caducidad.
* **Payload:** `{ "imageBase64": "data:image/jpeg;base64,...", "mimeType": "image/jpeg", "language": "es" }`
* **Salida:** `{ "success": true, "data": { "storeName": "Walmart", "items": [...] } }`

### 3. `POST /api/ai/scan-image`
* **Descripción:** Fallback visual para empaques de productos sin código de barras legible.

---

## 5. Variables de Entorno Requeridas

El archivo `.env` en el servidor debe contener:
```env
# Clave secreta obtenida en Google AI Studio
GEMINI_API_KEY="AIzaSy..."

# Puerto del servidor (asignado automáticamente en producción por Render)
PORT=3000

# Entorno de ejecución
NODE_ENV="production"
```

---

## 6. Procedimiento de Compilación y Despliegue

### Compilación Local:
```bash
# Instalar dependencias
npm install

# Compilar frontend (Vite) y backend empaquetado (esbuild)
npm run build

# Iniciar servidor de producción
npm start
```

### Despliegue en Render:
1. Conectar el repositorio de GitHub.
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `npm start`
4. Configurar variable de entorno `GEMINI_API_KEY` en el panel de Render.
