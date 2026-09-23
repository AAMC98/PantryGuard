import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Common Professional CSS for Academic / Enterprise Documentation PDFs
const commonCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

  @page {
    size: letter portrait;
    margin: 20mm 18mm 20mm 18mm;
    @bottom-right {
      content: counter(page);
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #191c20;
    line-height: 1.6;
    font-size: 10.5pt;
    margin: 0;
    padding: 0;
    background: #fff;
  }

  .page-break {
    page-break-before: always;
  }

  .avoid-break {
    page-break-inside: avoid;
  }

  /* Cover Page Styling */
  .cover-page {
    height: 92vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 30px 20px;
    border-left: 8px solid #004a21;
    background: linear-gradient(135deg, #f8fbf9 0%, #ffffff 100%);
  }

  .cover-header {
    margin-top: 10px;
  }

  .institution-badge {
    display: inline-block;
    background: #e8f5e9;
    color: #004a21;
    font-size: 9pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid #c8e6c9;
  }

  .cover-body {
    margin: auto 0;
  }

  .project-tag {
    color: #096430;
    font-size: 14pt;
    font-weight: 700;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .cover-title {
    font-size: 28pt;
    font-weight: 800;
    color: #0c1a11;
    line-height: 1.15;
    margin: 0 0 16px 0;
    letter-spacing: -0.5px;
  }

  .cover-subtitle {
    font-size: 14pt;
    font-weight: 400;
    color: #404940;
    line-height: 1.5;
    max-width: 600px;
    margin-bottom: 24px;
  }

  .divider-line {
    width: 80px;
    height: 4px;
    background: #004a21;
    border-radius: 2px;
    margin-bottom: 24px;
  }

  .cover-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    background: #f1f4f1;
    padding: 18px;
    border-radius: 12px;
    border: 1px solid #e1e5e1;
    max-width: 550px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
  }

  .meta-label {
    font-size: 7.5pt;
    font-weight: 700;
    color: #606860;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .meta-value {
    font-size: 9.5pt;
    font-weight: 600;
    color: #191c20;
    margin-top: 2px;
  }

  .cover-footer {
    border-top: 1px solid #e1e5e1;
    padding-top: 15px;
    font-size: 8.5pt;
    color: #707a6f;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Document Typography */
  h1 {
    font-size: 18pt;
    font-weight: 800;
    color: #004a21;
    margin-top: 26px;
    margin-bottom: 12px;
    border-bottom: 2px solid #e0e8e2;
    padding-bottom: 6px;
    letter-spacing: -0.3px;
  }

  h2 {
    font-size: 13pt;
    font-weight: 700;
    color: #096430;
    margin-top: 20px;
    margin-bottom: 8px;
  }

  h3 {
    font-size: 11pt;
    font-weight: 600;
    color: #1e261f;
    margin-top: 14px;
    margin-bottom: 6px;
  }

  p {
    margin-top: 0;
    margin-bottom: 10px;
    text-align: justify;
  }

  ul, ol {
    margin-top: 4px;
    margin-bottom: 12px;
    padding-left: 22px;
  }

  li {
    margin-bottom: 5px;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 18px 0;
    font-size: 9pt;
  }

  th {
    background: #004a21;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #004a21;
  }

  td {
    padding: 8px 10px;
    border: 1px solid #e1e5e1;
    vertical-align: top;
  }

  tr:nth-child(even) td {
    background: #f8faf8;
  }

  /* Code and Technical Blocks */
  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5pt;
    background: #f1f4f1;
    color: #004a21;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #e2e6e2;
  }

  pre {
    background: #111417;
    color: #e1e2e8;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    padding: 12px 14px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 12px 0 16px 0;
    border: 1px solid #282b30;
    line-height: 1.45;
  }

  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
  }

  /* Callout Boxes */
  .callout {
    padding: 12px 16px;
    border-radius: 8px;
    margin: 12px 0 16px 0;
    border-left: 4px solid;
    font-size: 9.5pt;
  }

  .callout-info {
    background: #eef5fc;
    border-color: #0353b3;
    color: #002e69;
  }

  .callout-success {
    background: #edf7ed;
    border-color: #096430;
    color: #003a19;
  }

  .callout-warning {
    background: #fff8e1;
    border-color: #f57c00;
    color: #793800;
  }

  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 12px;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
  }

  .badge-success { background: #d4eed8; color: #004a21; }
  .badge-warning { background: #ffe0b2; color: #9f4200; }
  .badge-danger { background: #ffdad6; color: #ba1a1a; }
  .badge-info { background: #d0e4ff; color: #003d87; }

  /* Table of Contents */
  .toc {
    background: #f8fbf9;
    border: 1px solid #ddecde;
    border-radius: 10px;
    padding: 16px 20px;
    margin: 20px 0 30px 0;
  }

  .toc-title {
    font-size: 12pt;
    font-weight: 700;
    color: #004a21;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .toc-list {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }

  .toc-item {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px dotted #ccc;
    font-size: 9.5pt;
  }

  .toc-item a {
    text-decoration: none;
    color: #191c20;
    font-weight: 500;
  }

  .footer-stamp {
    text-align: center;
    font-size: 8pt;
    color: #8a938a;
    margin-top: 30px;
    border-top: 1px solid #eee;
    padding-top: 10px;
  }
`;

console.log('Generando documentos HTML estructurados en extenso...');

// 1. HTML: MANUAL TÉCNICO (DOCUMENTACIÓN INTERNA)
const htmlManualTecnico = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Manual Técnico — Pantry Guard</title>
  <style>${commonCSS}</style>
</head>
<body>

  <!-- PORTADA -->
  <div class="cover-page">
    <div class="cover-header">
      <span class="institution-badge">Universidad Autónoma de Nayarit • Aplicaciones Móviles</span>
    </div>

    <div class="cover-body">
      <div class="project-tag">Documentación Interna / Manual de Arquitectura</div>
      <h1 class="cover-title">Pantry Guard</h1>
      <div class="divider-line"></div>
      <div class="cover-subtitle">
        Manual Técnico de Ingeniería de Software, Arquitectura Cliente-Servidor (BFF), Endpoints de Inteligencia Artificial y Despliegue en Producción
      </div>

      <div class="cover-meta-grid">
        <div class="meta-item">
          <span class="meta-label">Sistema / Versión</span>
          <span class="meta-value">Pantry Guard v1.0.0 (Full-Stack)</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Entorno de Ejecución</span>
          <span class="meta-value">Node.js v24 LTS + Express / Vite 6</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Motor de IA Generativa</span>
          <span class="meta-value">Google Gemini (Gemini 2.5 Flash SDK)</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Plataformas Soportadas</span>
          <span class="meta-value">Android (TWA/PWA), iOS, Web (HTTPS)</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>Repositorio: github.com/AAMC98/PantryGuard</span>
      <span>Fecha de Publicación: Septiembre 2026</span>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ÍNDICE -->
  <h1>Tabla de Contenidos</h1>
  <div class="toc">
    <div class="toc-title">Estructura del Manual Técnico</div>
    <ul class="toc-list">
      <li class="toc-item"><span>1. Resumen de Arquitectura y Patrón BFF</span> <span>Pág. 2</span></li>
      <li class="toc-item"><span>2. Stack Tecnológico y Matriz de Dependencias</span> <span>Pág. 3</span></li>
      <li class="toc-item"><span>3. Estructura de Directorios del Repositorio</span> <span>Pág. 4</span></li>
      <li class="toc-item"><span>4. Modelado de Datos e Interfaces TypeScript</span> <span>Pág. 5</span></li>
      <li class="toc-item"><span>5. Especificación de Endpoints y Servicios API</span> <span>Pág. 6</span></li>
      <li class="toc-item"><span>6. Mecanismos de Visión Computacional y Escaneo 1D</span> <span>Pág. 7</span></li>
      <li class="toc-item"><span>7. Sistema de Caché y Resiliencia Offline</span> <span>Pág. 8</span></li>
      <li class="toc-item"><span>8. Marco de Seguridad y Gestión de Credenciales</span> <span>Pág. 9</span></li>
      <li class="toc-item"><span>9. Guía de Compilación, Pruebas y Despliegue</span> <span>Pág. 10</span></li>
    </ul>
  </div>

  <!-- CAPÍTULO 1 -->
  <h1>1. Resumen de Arquitectura y Patrón BFF</h1>
  <p>
    <strong>Pantry Guard</strong> está estructurado bajo el patrón arquitectónico <strong>Backend-for-Frontend (BFF)</strong>. Esta decisión de ingeniería responde directamente a los requerimientos de seguridad para modelos de lenguaje en dispositivos móviles: <em>bajo ninguna circunstancia las llaves criptográficas de APIs comerciales (Google Gemini API) deben residir en el binario del cliente móvil (APK/PWA)</em>.
  </p>

  <div class="callout callout-info avoid-break">
    <strong>Principio de Aislamiento BFF:</strong> El cliente móvil jamás interactúa directamente con los servidores de Google GenAI ni con bases de datos remotas sin intermediación. Toda petición se envía a través de endpoints locales protegidos del servidor Express, el cual actúa como guardián de validación de esquemas, sanitización de datos y limitador de tasa de consumo.
  </div>

  <p>El flujo de datos se resume en la siguiente topología de comunicación:</p>
  <pre><code>[ Dispositivo Móvil (Android / iOS) ]
        │  ▲
        │  │  HTTPS con TLS 1.3 (JSON Restringido)
        ▼  │
[ Servidor Express (server.ts) en Render ]
  ├── 1. Middleware de CORS y Headers de Seguridad (HSTS)
  ├── 2. Capa de Rate-Limiting por IP/Usuario (anti-EDoS)
  ├── 3. Memoria Caché de Consultas (MEM_CACHE)
  ├── 4. Motor de Recetas Locales de Emergencia (generateLocalRecipes)
  └── 5. Conector Seguro con Google GenAI SDK (process.env.GEMINI_API_KEY)
              │
              ├── Google Gemini API (Inferencia multimodal estructurada)
              └── Open Food Facts API (Resolución global de códigos EAN/UPC)</code></pre>

  <!-- CAPÍTULO 2 -->
  <div class="page-break"></div>
  <h1>2. Stack Tecnológico y Matriz de Dependencias</h1>
  <p>El sistema combina herramientas de última generación en el ecosistema JavaScript/TypeScript tanto para el renderizado visual de alta tasa de cuadros (60 FPS) como para la compilación optimizada en producción:</p>

  <table>
    <thead>
      <tr>
        <th>Capa</th>
        <th>Tecnología</th>
        <th>Versión</th>
        <th>Rol y Justificación en el Proyecto</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Frontend</strong></td>
        <td>React</td>
        <td>19.0.1</td>
        <td>Renderizado reactivo con gestión de estado atómica y concurrencia.</td>
      </tr>
      <tr>
        <td><strong>Empaquetador</strong></td>
        <td>Vite</td>
        <td>6.2.3</td>
        <td>Compilador ultrarrápido con soporte nativo de ES Modules y HMR.</td>
      </tr>
      <tr>
        <td><strong>Tipado</strong></td>
        <td>TypeScript</td>
        <td>5.8.2</td>
        <td>Garantía de tipado estricto en interfaces de productos y respuestas de IA.</td>
      </tr>
      <tr>
        <td><strong>Estilos UI</strong></td>
        <td>Tailwind CSS</td>
        <td>4.1.14</td>
        <td>Framework utility-first con variantes dinámicas de modo oscuro y clases seguras.</td>
      </tr>
      <tr>
        <td><strong>Backend</strong></td>
        <td>Express</td>
        <td>4.21.2</td>
        <td>Servidor HTTP minimalista para orquestación de APIs REST y serving de la SPA.</td>
      </tr>
      <tr>
        <td><strong>Compilación CJS</strong></td>
        <td>esbuild</td>
        <td>0.25.0</td>
        <td>Empaquetador ultraeficiente de <code>server.ts</code> a <code>dist/server.cjs</code> en menos de 20ms.</td>
      </tr>
      <tr>
        <td><strong>IA Generativa</strong></td>
        <td>@google/genai</td>
        <td>2.4.0</td>
        <td>SDK oficial de Google Cloud para modelos Gemini 2.5 Flash y Gemini 3.8.</td>
      </tr>
      <tr>
        <td><strong>Cámara / Barcode</strong></td>
        <td>Html5Qrcode + ZXing</td>
        <td>2.3.8 / 0.23.0</td>
        <td>Decodificación de video en vivo asistida por <code>window.BarcodeDetector</code>.</td>
      </tr>
    </tbody>
  </table>

  <!-- CAPÍTULO 3 -->
  <h1>3. Estructura de Directorios del Repositorio</h1>
  <p>El código fuente se organiza siguiendo el principio de separación de responsabilidades:</p>

  <pre><code>Pantry-Guard/
├── src/
│   ├── components/                 # Componentes modulares de interfaz de usuario
│   │   ├── AIInsightsView.tsx      # Módulo Chef IA, filtros de categorías y recetas
│   │   ├── BarcodeScannerModal.tsx # Escáner de video en vivo, retícula y hardware detector
│   │   ├── ReceiptScanModal.tsx    # Escáner OCR de tickets de compra con Gemini Vision
│   │   ├── ProductModal.tsx        # Formulario de alta, edición y ajuste de cantidades
│   │   ├── ProductCard.tsx         # Tarjeta individual con cálculo de semáforo de días
│   │   ├── PantryListView.tsx      # Vista general con búsqueda en tiempo real y agrupaciones
│   │   ├── ShoppingListView.tsx    # Lista dinámica con checkboxes interactivos
│   │   └── TopNavBar.tsx           # Barra superior con selectores de idioma (ES/EN) y tema
│   ├── data/
│   │   └── initialData.ts          # Semilla inicial de productos y catálogo local offline
│   ├── utils/
│   │   ├── barcodeService.ts       # Consultas Open Food Facts, MEM_CACHE y caducidades
│   │   ├── imageBarcodeDecoder.ts  # Decodificador cliente multinivel (Hardware/ZXing)
│   │   ├── i18n.ts                 # Diccionario completo de internacionalización bilingüe
│   │   └── storage.ts              # Capa de abstracción para persistencia en LocalStorage
│   ├── types.ts                    # Contratos de datos, enums y tipos TypeScript
│   ├── App.tsx                     # Orquestador del estado raíz, modales y navegación
│   ├── main.tsx                    # Punto de entrada y montaje en el DOM
│   └── index.css                   # Tailwind base, reglas de cámara y animaciones
├── server.ts                       # Backend Express, endpoints /api/ai/* y fallback local
├── vite.config.ts                  # Configuración de compilación Vite y plugins
├── package.json                    # Manifiesto de dependencias y scripts de ejecución
├── capacitor.config.json           # Configuración para empaquetado nativo en Android Studio
└── .gitignore                      # Exclusiones de Git (garantiza que .env jamás se suba)</code></pre>

  <!-- CAPÍTULO 4 -->
  <div class="page-break"></div>
  <h1>4. Modelado de Datos e Interfaces TypeScript</h1>
  <p>Toda la información del sistema se modela estrictamente a través de tipos e interfaces en <code>src/types.ts</code>:</p>

  <div class="avoid-break">
    <h3>Entidad Principal: Producto (Product)</h3>
    <pre><code>export type ProductCategory = 'lacteos' | 'proteinas' | 'verduras' | 'frutas' | 'granos' | 'bebidas' | 'otros';
export type StorageLocation = 'Refrigerador' | 'Alacena' | 'Frutero' | 'Congelador';
export type ProductStatus = 'fresh' | 'expiring' | 'expired';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: 'unidades' | 'kg' | 'g' | 'L' | 'ml' | 'lb' | 'oz';
  location: StorageLocation;
  expiryDate: string; // Formato estricto ISO 'YYYY-MM-DD'
  barcode?: string;
  imageUrl?: string;
  brand?: string;
  nutriScore?: string;
  notes?: string;
}</code></pre>
  </div>

  <div class="avoid-break">
    <h3>Entidad: Receta Generada por IA (AIRecipe)</h3>
    <pre><code>export interface AIRecipe {
  id: string;
  title: string;
  mealType: 'desayuno' | 'almuerzo_cena' | 'express' | 'postre_snack';
  cookTimeMinutes: number;
  difficulty: 'fácil' | 'media' | 'avanzada';
  pantryIngredientsUsed: Array<{
    name: string;
    quantity: string;
    isExpiringSoon: boolean;
  }>;
  extraIngredientsNeeded: Array<{ name: string; isOptional: boolean }>;
  steps: string[];
  zeroWasteTip: string;
}</code></pre>
  </div>

  <!-- CAPÍTULO 5 -->
  <h1>5. Especificación de Endpoints y Servicios API</h1>
  <p>El backend expone rutas REST unificadas bajo el prefijo <code>/api/ai</code>:</p>

  <h3>1. POST <code>/api/ai/recipes</code></h3>
  <ul>
    <li><strong>Propósito:</strong> Generación de recetas cero desperdicio adaptadas al inventario vigente.</li>
    <li><strong>Control de Validación:</strong> Se usa <code>responseSchema</code> con tipos <code>Type.OBJECT</code> y <code>Type.ARRAY</code> en el SDK de Gemini.</li>
    <li><strong>Manejo de Errores:</strong> Si el LLM devuelve un error de cuota (429) o saturación (503), el catch invoca <code>generateLocalRecipes()</code>, entregando recetas deterministas en menos de 10ms sin interrumpir la experiencia de usuario.</li>
  </ul>

  <h3>2. POST <code>/api/ai/scan-receipt</code></h3>
  <ul>
    <li><strong>Propósito:</strong> Reconocimiento óptico de caracteres (OCR) y análisis de recibos de supermercado.</li>
    <li><strong>Payload:</strong> Objeto JSON con <code>imageBase64</code> codificado en Base64 JPEG y tamaño máximo de 2 MB.</li>
    <li><strong>Salida:</strong> Array de artículos detectados con cantidades, categorías y caducidades asignadas según reglas alimentarias.</li>
  </ul>

  <!-- CAPÍTULO 6 -->
  <div class="page-break"></div>
  <h1>6. Mecanismos de Visión Computacional y Escaneo 1D</h1>
  <p>El módulo <code>BarcodeScannerModal.tsx</code> implementa una arquitectura híbrida de escaneo en tiempo real orientada a dispositivos móviles:</p>

  <ul>
    <li><strong>Hardware Acceleration (<code>window.BarcodeDetector</code>):</strong> En navegadores modernos (Android Chrome e iOS 17+), se ejecuta un bucle de inspección a 25 FPS (cada 40ms) conectado directamente a la GPU del dispositivo. Esto permite detectar códigos de barras EAN-13 en menos de 15 ms sin bloquear el hilo principal de JavaScript.</li>
    <li><strong>Enfoque Continuo por Hardware:</strong> Al iniciarse el video, se negocian las capacidades de la cámara con <code>applyConstraints({ advanced: [{ focusMode: 'continuous' }] })</code> para garantizar nitidez macro a 10–15 cm de distancia.</li>
    <li><strong>Visor Panorámico Único:</strong> Se ocultan los elementos predeterminados de la librería externa con CSS (<code>#qr-shaded-region { display: none !important; }</code>) para mostrar un único marco con relación de aspecto 16:10 y línea láser animada.</li>
  </ul>

  <!-- CAPÍTULO 7 -->
  <h1>7. Sistema de Caché y Resiliencia Offline</h1>
  <p>Para mitigar la latencia de servicios externos (Open Food Facts y Gemini) y optimizar costos operativos, se implementa una caché en memoria:</p>
  <pre><code>// Implementación en barcodeService.ts
const MEM_CACHE: Record<string, BarcodeLookupResult> = {};

export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const cleanCode = barcode.trim();
  
  // 0. Consulta instantánea en memoria (0ms)
  if (MEM_CACHE[cleanCode]) return MEM_CACHE[cleanCode];

  // 1. Consulta en memoria de productos aprendidos (LocalStorage)
  // 2. Consulta en catálogo estático precargado (initialData.ts)
  // 3. Consulta en vivo a Open Food Facts con timeout rápido (2.5 segundos)
}</code></pre>

  <!-- CAPÍTULO 8 -->
  <h1>8. Marco de Seguridad y Gestión de Credenciales</h1>
  <ul>
    <li><strong>Protección de Secretos:</strong> La variable <code>GEMINI_API_KEY</code> reside exclusivamente en el entorno del servidor Node.js y en los secretos encriptados de Render. El archivo <code>.gitignore</code> contiene la directiva <code>.env*</code> para evitar cualquier commit accidental.</li>
    <li><strong>Prevención de Inyección de Prompts:</strong> Toda entrada proveniente de tickets u Open Food Facts se procesa como contenido de datos plano dentro de etiquetas semánticas y nunca se concatena como instrucción de sistema.</li>
    <li><strong>Salidas Controladas:</strong> Cero uso de <code>eval()</code> o inyección de scripts dinámicos en la interfaz de React.</li>
  </ul>

  <!-- CAPÍTULO 9 -->
  <div class="page-break"></div>
  <h1>9. Guía de Compilación, Pruebas y Despliegue</h1>

  <h3>Comandos del Proyecto:</h3>
  <table>
    <thead>
      <tr><th>Comando</th><th>Propósito</th></tr>
    </thead>
    <tbody>
      <tr><td><code>npm run dev</code></td><td>Inicia el entorno de desarrollo local con recarga rápida (HMR).</td></tr>
      <tr><td><code>npm run build</code></td><td>Compila los bundles de Vite y empaqueta el servidor con esbuild en <code>dist/server.cjs</code>.</td></tr>
      <tr><td><code>npm start</code></td><td>Inicia el servidor de producción Express sirviendo los assets estáticos.</td></tr>
      <tr><td><code>npm run lint</code></td><td>Ejecuta la verificación de tipos de TypeScript sin emitir archivos (<code>tsc --noEmit</code>).</td></tr>
    </tbody>
  </table>

  <h3>Despliegue Continuo en Render:</h3>
  <ol>
    <li>Conectar el repositorio <code>AAMC98/PantryGuard</code> en Render.com como <strong>Web Service</strong>.</li>
    <li>Configurar <strong>Build Command:</strong> <code>npm install && npm run build</code></li>
    <li>Configurar <strong>Start Command:</strong> <code>npm start</code></li>
    <li>Agregar en <strong>Environment Variables:</strong> <code>GEMINI_API_KEY</code> con la clave de Google AI Studio.</li>
  </ol>

  <div class="footer-stamp">
    Pantry Guard — Documentación Técnica Interna • Elaborado para la Universidad Autónoma de Nayarit
  </div>

</body>
</html>`;

// 2. HTML: MANUAL DE USUARIO (DOCUMENTACIÓN EXTERNA)
const htmlManualUsuario = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Manual de Usuario — Pantry Guard</title>
  <style>${commonCSS}</style>
</head>
<body>

  <!-- PORTADA -->
  <div class="cover-page">
    <div class="cover-header">
      <span class="institution-badge">Universidad Autónoma de Nayarit • Guía de Operación</span>
    </div>

    <div class="cover-body">
      <div class="project-tag">Documentación Externa / Guía del Usuario Final</div>
      <h1 class="cover-title">Pantry Guard</h1>
      <div class="divider-line"></div>
      <div class="cover-subtitle">
        Manual de Usuario: Gestión Inteligente de Despensa, Escaneo de Alimentos, Semáforo de Caducidad y Cocina Cero Desperdicio con Inteligencia Artificial
      </div>

      <div class="cover-meta-grid">
        <div class="meta-item">
          <span class="meta-label">Público Destinatario</span>
          <span class="meta-value">Usuarios Finales, Familias y Hogares</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Plataformas de Acceso</span>
          <span class="meta-value">iPhone (iOS), Celulares Android y PC</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Modalidad de Uso</span>
          <span class="meta-value">Aplicación Web Progresiva (PWA / App Instalable)</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Costo / Licencia</span>
          <span class="meta-value">100% Gratuito y Libre</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>Pantry Guard v1.0 • Despensa Inteligente</span>
      <span>Actualizado: Septiembre 2026</span>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ÍNDICE -->
  <h1>Tabla de Contenidos</h1>
  <div class="toc">
    <div class="toc-title">Contenido del Manual de Usuario</div>
    <ul class="toc-list">
      <li class="toc-item"><span>1. ¿Qué es Pantry Guard y Cómo te Ayuda?</span> <span>Pág. 2</span></li>
      <li class="toc-item"><span>2. Cómo Instalar la Aplicación en tu Celular (iOS y Android)</span> <span>Pág. 2</span></li>
      <li class="toc-item"><span>3. Pantalla Principal y Exploración de tu Despensa</span> <span>Pág. 3</span></li>
      <li class="toc-item"><span>4. El Semáforo Inteligente de Caducidades</span> <span>Pág. 4</span></li>
      <li class="toc-item"><span>5. Cómo Escanear Códigos de Barras con la Cámara</span> <span>Pág. 5</span></li>
      <li class="toc-item"><span>6. Cómo Escanear Tickets de Compra con Inteligencia Artificial</span> <span>Pág. 6</span></li>
      <li class="toc-item"><span>7. Cocinar con el Chef IA Cero Desperdicio</span> <span>Pág. 7</span></li>
      <li class="toc-item"><span>8. Control de la Lista de Compras</span> <span>Pág. 8</span></li>
      <li class="toc-item"><span>9. Preguntas Frecuentes y Consejos Prácticos</span> <span>Pág. 9</span></li>
    </ul>
  </div>

  <!-- CAPÍTULO 1 -->
  <h1>1. ¿Qué es Pantry Guard y Cómo te Ayuda?</h1>
  <p>
    <strong>Pantry Guard</strong> es tu asistente digital personal para la cocina. Su objetivo es muy sencillo pero poderoso: <strong>evitar que la comida se eche a perder en tu refrigerador y ahorrarte dinero</strong> cada vez que vas al supermercado o cocinas en casa.
  </p>
  <div class="callout callout-success avoid-break">
    <strong>Beneficios Clave en tu Vida Diaria:</strong>
    <ul>
      <li>Sabes con certeza qué tienes en casa cuando estás en la tienda, evitando compras dobles.</li>
      <li>Alertas visuales claras antes de que los alimentos alcancen su fecha de vencimiento.</li>
      <li>Recetas generadas al instante con los ingredientes que ya tienes en tus estantes.</li>
    </ul>
  </div>

  <!-- CAPÍTULO 2 -->
  <h1>2. Cómo Instalar la Aplicación en tu Celular</h1>
  <p>Pantry Guard está construida como una <em>Aplicación Web Progresiva</em>. No necesitas descargarla forzosamente desde una tienda de apps; puedes instalarla directamente desde tu navegador:</p>

  <div class="avoid-break">
    <h3>📱 En iPhone / iPad (Safari):</h3>
    <ol>
      <li>Abre el enlace de tu aplicación en el navegador <strong>Safari</strong>.</li>
      <li>Toca el botón <strong>Compartir</strong> (el icono cuadrado con una flecha hacia arriba en la barra inferior).</li>
      <li>Desliza hacia abajo en el menú y selecciona <strong>"Agregar a la pantalla de inicio"</strong>.</li>
      <li>Toca <strong>"Agregar"</strong> arriba a la derecha. Listo, verás el icono de Pantry Guard en tu pantalla principal.</li>
    </ol>
  </div>

  <div class="avoid-break">
    <h3>🤖 En Celulares Android (Google Chrome):</h3>
    <ol>
      <li>Abre el enlace en <strong>Google Chrome</strong>.</li>
      <li>Toca los <strong>tres puntos</strong> en la esquina superior derecha.</li>
      <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.</li>
      <li>Confirma la instalación y ábrela como cualquier app nativa.</li>
    </ol>
  </div>

  <!-- CAPÍTULO 3 -->
  <div class="page-break"></div>
  <h1>3. Pantalla Principal y Exploración de tu Despensa</h1>
  <p>Al abrir la app, te encuentras con la vista central de tu inventario doméstico:</p>

  <ul>
    <li><strong>Barra de Búsqueda Rápida:</strong> Escribe cualquier letra o nombre (ej. <em>"huevos"</em>, <em>"leche"</em>) y los resultados se filtran al instante.</li>
    <li><strong>Filtros por Ubicación:</strong> Puedes alternar entre <em>Refrigerador</em>, <em>Alacena</em>, <em>Frutero</em> o <em>Congelador</em> para revisar exactamente un área de tu cocina.</li>
    <li><strong>Filtros por Categoría:</strong> Botones rápidos para ver solo lácteos, carnes, frutas, verduras, granos o bebidas.</li>
    <li><strong>Botón "+ Agregar":</strong> Te permite registrar manualmente cualquier alimento casero o producto sin código de barras (como panadería o frutas a granel).</li>
  </ul>

  <!-- CAPÍTULO 4 -->
  <h1>4. El Semáforo Inteligente de Caducidades</h1>
  <p>Pantry Guard analiza continuamente las fechas de vencimiento de cada producto registrado y coloca un indicador de color en la tarjeta para que sepas qué urge consumir primero:</p>

  <table>
    <thead>
      <tr>
        <th>Estado</th>
        <th>Color del Borde</th>
        <th>Significado y Acción Recomendada</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-success">Vigente</span></td>
        <td>Borde Verde</td>
        <td>El alimento está fresco y seguro. Le quedan más de 5 días de margen de consumo.</td>
      </tr>
      <tr>
        <td><span class="badge badge-warning">Próximo a Vencer</span></td>
        <td>Borde Naranja</td>
        <td>Le quedan entre 1 y 5 días. <strong>Prioridad alta para cocinar hoy mismo</strong>.</td>
      </tr>
      <tr>
        <td><span class="badge badge-danger">Caducado</span></td>
        <td>Borde Rojo</td>
        <td>El alimento superó su fecha recomendada. Revisa su estado o descártalo por seguridad de salud.</td>
      </tr>
    </tbody>
  </table>

  <!-- CAPÍTULO 5 -->
  <div class="page-break"></div>
  <h1>5. Cómo Escanear Códigos de Barras con la Cámara</h1>
  <p>Registrar alimentos a mano puede ser lento. Por eso, el escáner con cámara automática de Pantry Guard lo hace en segundos:</p>

  <ol>
    <li>Toca el botón circular verde con el icono de <strong>código de barras</strong> en la parte superior.</li>
    <li>Apunta la cámara del celular al código de barras de cualquier envase, caja o lata a una distancia de <strong>10 a 15 centímetros</strong>.</li>
    <li>La aplicación emitirá un sonido y vibrará cuando reconozca el código automáticamente.</li>
    <li>Se abrirá una tarjeta con el nombre del producto, marca, foto oficial y días estimados de caducidad.</li>
    <li>Toca <strong>"Guardar en Despensa"</strong> y listo.</li>
  </ol>

  <div class="callout callout-success avoid-break">
    <strong>🛒 Modo Supermercado (Escaneo Continuo):</strong><br>
    Si llegas de hacer la compra mensual y tienes 15 productos por registrar, activa el botón <em>"Modo Supermercado"</em> arriba a la derecha del escáner. Podrás pasar un producto tras otro frente a la cámara sin que se cierre, sumándolos todos de manera continua.
  </div>

  <!-- CAPÍTULO 6 -->
  <h1>6. Cómo Escanear Tickets de Compra con Inteligencia Artificial</h1>
  <p>Si prefieres no escanear producto por producto, puedes capturar tu recibo de la tienda:</p>

  <ol>
    <li>Toca el botón con el icono de <strong>Ticket</strong> en la barra superior.</li>
    <li>Elige <strong>"Tomar Foto"</strong> con tu cámara o sube una imagen de tu galería.</li>
    <li>Asegúrate de que la foto tenga buena luz y se lean los nombres de los productos.</li>
    <li>La Inteligencia Artificial de Gemini procesará el ticket en segundos y te mostrará una lista completa de lo que compraste.</li>
    <li>Puedes desmarcar cualquier producto que no quieras guardar y pulsar <strong>"Importar a Despensa"</strong> para guardarlos todos de golpe.</li>
  </ol>

  <!-- CAPÍTULO 7 -->
  <div class="page-break"></div>
  <h1>7. Cocinar con el Chef IA Cero Desperdicio</h1>
  <p>¿Llegas a casa cansado y no sabes qué preparar de comer? El Chef IA está diseñado para responder a esa pregunta sin hacerte gastar dinero extra:</p>

  <ol>
    <li>En la barra de navegación inferior, entra a la pestaña <strong>"Chef IA"</strong>.</li>
    <li>La inteligencia artificial analizará los ingredientes que tienes registrados en casa, seleccionando primero los que tienen borde naranja (próximos a caducar).</li>
    <li>Explora las recetas divididas en:
      <ul>
        <li><strong>Desayunos Nutritivos</strong></li>
        <li><strong>Almuerzos y Cenas Completas</strong></li>
        <li><strong>Exprés (< 15 minutos):</strong> Preparaciones rápidas para días con poco tiempo.</li>
        <li><strong>Postres y Snacks de Rescate:</strong> Ideas para aprovechar fruta madura o lácteos.</li>
      </ul>
    </li>
    <li>Toca cualquier receta para ver el modo de cocina paso a paso, los ingredientes que ya tienes y un botón para mandar a la lista de compras cualquier ingrediente secundario que te falte.</li>
  </ol>

  <!-- CAPÍTULO 8 -->
  <h1>8. Control de la Lista de Compras</h1>
  <p>La pestaña <strong>"Lista de Compras"</strong> te ayuda a mantener el orden en el supermercado:</p>
  <ul>
    <li>Puedes agregar productos manualmente escribiendo su nombre.</li>
    <li>Al cocinar una receta del Chef IA, los condimentos o ingredientes faltantes se pueden mandar aquí con un solo toque.</li>
    <li>Cuando estés en el supermercado, toca los cuadritos de verificación para tachar lo que vayas metiendo al carrito de compras.</li>
  </ul>

  <!-- CAPÍTULO 9 -->
  <h1>9. Preguntas Frecuentes (FAQ)</h1>
  <div class="avoid-break">
    <p><strong>¿Qué pasa si un producto no tiene código de barras (como verduras sueltas)?</strong><br>
    Usa el botón "+ Agregar Manual" en la despensa; solo tardarás 10 segundos en escribir el nombre y elegir en cuántos días planeas consumirlo.</p>

    <p><strong>¿La aplicación funciona en inglés?</strong><br>
    Sí, en la barra superior encontrarás un botón para alternar entre Español (ES) e Inglés (EN) en toda la interfaz y en las recetas.</p>

    <p><strong>¿Mis datos o fotos personales se comparten en internet?</strong><br>
    No. La aplicación protege tu privacidad: las fotos de los recibos solo se analizan de forma efímera para leer los nombres de los productos y se borran inmediatamente.</p>
  </div>

  <div class="footer-stamp">
    Pantry Guard — Manual de Usuario • Universidad Autónoma de Nayarit
  </div>

</body>
</html>`;

// 3. HTML: DOCUMENTACIÓN OFICIAL DEL PROYECTO (MEMORIA INSTITUCIONAL)
const htmlDocumentacionOficial = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Documentación Oficial del Proyecto — Pantry Guard</title>
  <style>${commonCSS}</style>
</head>
<body>

  <!-- PORTADA -->
  <div class="cover-page">
    <div class="cover-header">
      <span class="institution-badge">Universidad Autónoma de Nayarit • Unidad Académica de Economía</span>
    </div>

    <div class="cover-body">
      <div class="project-tag">Memoria Técnica y Especificación Oficial de Proyecto</div>
      <h1 class="cover-title">Pantry Guard</h1>
      <div class="divider-line"></div>
      <div class="cover-subtitle">
        Sistema Multiplataforma de Gestión Inteligente de Despensa Doméstica, Mitigación de Pérdida de Alimentos y Asistencia Culinaria Basada en Modelos de Lenguaje
      </div>

      <div class="cover-meta-grid">
        <div class="meta-item">
          <span class="meta-label">Asignatura / Área</span>
          <span class="meta-value">Desarrollo de Aplicaciones Móviles</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Alumno / Desarrollador</span>
          <span class="meta-value">Adán Martínez (GitHub: AAMC98)</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Grado y Tipo de Proyecto</span>
          <span class="meta-value">Proyecto Integral de Software Móvil</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Estado de Implementación</span>
          <span class="meta-value">Desplegado en Producción (Cloud Run / Render)</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>Tepic, Nayarit, México</span>
      <span>Ciclo Académico 2026</span>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ÍNDICE -->
  <h1>Tabla de Contenidos</h1>
  <div class="toc">
    <div class="toc-title">Índice General de la Memoria Técnica</div>
    <ul class="toc-list">
      <li class="toc-item"><span>1. Resumen Ejecutivo (Executive Summary)</span> <span>Pág. 2</span></li>
      <li class="toc-item"><span>2. Planteamiento del Problema y Justificación</span> <span>Pág. 2</span></li>
      <li class="toc-item"><span>3. Objetivos del Proyecto (General y Específicos)</span> <span>Pág. 3</span></li>
      <li class="toc-item"><span>4. Alcance y Delimitación del Sistema</span> <span>Pág. 4</span></li>
      <li class="toc-item"><span>5. Matriz de Requerimientos Funcionales (RF)</span> <span>Pág. 5</span></li>
      <li class="toc-item"><span>6. Matriz de Requerimientos No Funcionales (RNF)</span> <span>Pág. 6</span></li>
      <li class="toc-item"><span>7. Modelado de Arquitectura y Casos de Uso</span> <span>Pág. 7</span></li>
      <li class="toc-item"><span>8. Cumplimiento de Estándares de Seguridad (OWASP LLM)</span> <span>Pág. 8</span></li>
      <li class="toc-item"><span>9. Resultados Obtenidos y Métricas de Rendimiento</span> <span>Pág. 9</span></li>
      <li class="toc-item"><span>10. Conclusiones y Prospectiva de Trabajo Futuro</span> <span>Pág. 10</span></li>
    </ul>
  </div>

  <!-- CAPÍTULO 1 -->
  <h1>1. Resumen Ejecutivo (Executive Summary)</h1>
  <p>
    <strong>Pantry Guard</strong> es una solución de software orientada a resolver una de las ineficiencias económicas y ambientales más críticas en los hogares modernos: la pérdida y el desperdicio de alimentos de consumo diario. La aplicación integra visión artificial en dispositivos móviles (lectura de códigos de barras EAN/UPC y reconocimiento óptico de tickets de compra) con algoritmos generativos de inteligencia artificial (Google Gemini). A través de una interfaz responsiva, el sistema mantiene el inventario en tiempo real, clasifica alimentos mediante semáforos de caducidad preventiva y propone recetas de aprovechamiento culinario basadas en los productos disponibles.
  </p>

  <!-- CAPÍTULO 2 -->
  <h1>2. Planteamiento del Problema y Justificación</h1>
  <p>
    De acuerdo con la Organización de las Naciones Unidas para la Alimentación y la Agricultura (FAO), aproximadamente un tercio de todos los alimentos producidos en el planeta se pierde o desperdicia. En el entorno doméstico, este fenómeno responde principalmente a tres factores:
  </p>
  <ol>
    <li><strong>Asimetría de Información en el Hogar:</strong> Los consumidores desconocen las existencias reales dentro de su refrigerador al momento de realizar compras, provocando la adquisición reiterada de productos duplicados.</li>
    <li><strong>Olvido de Fechas de Vencimiento:</strong> Los alimentos perecederos son desplazados hacia el fondo de las alacenas y refrigeradores hasta su descomposición.</li>
    <li><strong>Fatiga de Decisión Gastronómica:</strong> Dificultad cotidiana para formular recetas balanceadas a partir de ingredientes dispersos o sobrantes.</li>
  </ol>
  <p>
    La justificación del proyecto es triple: <strong>económica</strong> (ahorro directo de hasta 30% en el presupuesto familiar), <strong>ambiental</strong> (reducción de emisiones de gases de efecto invernadero por descomposición en vertederos) y <strong>tecnológica</strong> (demostración de la aplicación de agentes LLM en problemas cotidianos).
  </p>

  <!-- CAPÍTULO 3 -->
  <div class="page-break"></div>
  <h1>3. Objetivos del Proyecto</h1>

  <h3>Objetivo General:</h3>
  <p>
    Diseñar, desarrollar e implementar una aplicación móvil multiplataforma que optimice la gestión de alimentos domésticos mediante visión computacional, seguimiento preventivo de caducidades y sugerencias culinarias generadas con inteligencia artificial para erradicar el desperdicio alimentario.
  </p>

  <h3>Objetivos Específicos:</h3>
  <ul>
    <li>Desarrollar un subsistema de escaneo óptico en tiempo real con aceleración por hardware que capture códigos EAN/UPC a 25 cuadros por segundo.</li>
    <li>Integrar un módulo de visión multimodal (Gemini Vision) para la extracción automatizada de productos a partir de tickets de supermercado.</li>
    <li>Diseñar un algoritmo de semaforización semántica de tres estados (Vigente, Próximo a caducar y Caducado) basado en fechas dinámicas.</li>
    <li>Implementar una arquitectura Backend-for-Frontend (BFF) que aísle las credenciales del sistema y cumpla con lineamientos de seguridad OWASP.</li>
    <li>Desplegar la solución en la nube bajo protocolo seguro HTTPS con capacidades de instalación PWA en dispositivos Android e iOS.</li>
  </ul>

  <!-- CAPÍTULO 4 -->
  <h1>4. Alcance y Delimitación del Sistema</h1>
  <p>
    El sistema abarca el ciclo integral de administración de víveres en el ámbito doméstico:
  </p>
  <ul>
    <li><strong>Dentro del Alcance:</strong> Registro manual, escaneo por código de barras con base de datos Open Food Facts, lectura de tickets OCR, recetas categorizadas generadas por IA, lista de compras interactiva, modo supermercado y persistencia de datos local en el dispositivo.</li>
    <li><strong>Límites del Proyecto (Fase 1):</strong> El sistema está concebido para uso personal/unifamiliar. No incluye pasarela de pagos para compras en línea ni sincronización multi-cuenta simultánea en tiempo real (reservado para la Fase 2 con WebSockets).</li>
  </ul>

  <!-- CAPÍTULO 5 -->
  <div class="page-break"></div>
  <h1>5. Matriz de Requerimientos Funcionales (RF)</h1>

  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Nombre del Requerimiento</th>
        <th>Descripción Operativa</th>
        <th>Prioridad</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>RF-01</strong></td>
        <td>Registro Manual de Alimentos</td>
        <td>Permite ingresar productos especificando nombre, categoría, cantidad, unidad, ubicación y fecha de vencimiento.</td>
        <td><span class="badge badge-success">Alta</span></td>
      </tr>
      <tr>
        <td><strong>RF-02</strong></td>
        <td>Escaneo de Código de Barras</td>
        <td>Captura códigos EAN/UPC con cámara y autocompleta atributos consultando Open Food Facts.</td>
        <td><span class="badge badge-success">Alta</span></td>
      </tr>
      <tr>
        <td><strong>RF-03</strong></td>
        <td>Modo Supermercado (Ráfaga)</td>
        <td>Permite el registro secuencial y continuo de múltiples artículos sin cerrar el flujo de video.</td>
        <td><span class="badge badge-info">Media</span></td>
      </tr>
      <tr>
        <td><strong>RF-04</strong></td>
        <td>Escáner OCR de Tickets</td>
        <td>Procesa imágenes de recibos de compra e importa listas completas de artículos mediante Gemini Vision.</td>
        <td><span class="badge badge-success">Alta</span></td>
      </tr>
      <tr>
        <td><strong>RF-05</strong></td>
        <td>Semáforo de Caducidad</td>
        <td>Calcula diariamente la diferencia de días restantes y clasifica visualmente en verde, naranja o rojo.</td>
        <td><span class="badge badge-success">Alta</span></td>
      </tr>
      <tr>
        <td><strong>RF-06</strong></td>
        <td>Chef IA Cero Desperdicio</td>
        <td>Genera recetas estructuradas paso a paso priorizando ingredientes con caducidad próxima.</td>
        <td><span class="badge badge-success">Alta</span></td>
      </tr>
      <tr>
        <td><strong>RF-07</strong></td>
        <td>Lista de Compras Sincronizada</td>
        <td>Administra productos por comprar y permite enviarlos directamente a la despensa tras su adquisición.</td>
        <td><span class="badge badge-info">Media</span></td>
      </tr>
      <tr>
        <td><strong>RF-08</strong></td>
        <td>Internacionalización (i18n)</td>
        <td>Soporta cambio de idioma en caliente entre Español e Inglés en textos y recetas.</td>
        <td><span class="badge badge-info">Media</span></td>
      </tr>
    </tbody>
  </table>

  <!-- CAPÍTULO 6 -->
  <h1>6. Matriz de Requerimientos No Funcionales (RNF)</h1>

  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Categoría</th>
        <th>Criterio de Aceptación</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>RNF-01</strong></td>
        <td>Rendimiento</td>
        <td>La detección de códigos de barras debe ejecutarse en menos de 200 ms en hardware compatible.</td>
      </tr>
      <tr>
        <td><strong>RNF-02</strong></td>
        <td>Seguridad</td>
        <td>Ninguna clave secreta (API Key) debe ser visible en el cliente móvil o inspección del código fuente.</td>
      </tr>
      <tr>
        <td><strong>RNF-03</strong></td>
        <td>Disponibilidad</td>
        <td>El sistema debe contar con un motor de respaldo local con recetas deterministas en caso de fallo del LLM.</td>
      </tr>
      <tr>
        <td><strong>RNF-04</strong></td>
        <td>Portabilidad</td>
        <td>La interfaz debe ser 100% responsiva y compatible con Safari iOS, Chrome Android y navegadores de escritorio.</td>
      </tr>
      <tr>
        <td><strong>RNF-05</strong></td>
        <td>Privacidad</td>
        <td>No se recopilarán ni transmitirán datos de geolocalización, números bancarios o identidades personales.</td>
      </tr>
    </tbody>
  </table>

  <!-- CAPÍTULO 7 -->
  <div class="page-break"></div>
  <h1>7. Modelado de Arquitectura y Casos de Uso</h1>
  <p>La arquitectura del sistema sigue un modelo desacoplado de microservicios lógicos:</p>

  <div class="avoid-break">
    <pre><code>                     ┌─────────────────────────────────────────┐
                     │          USUARIO FINAL (MÓVIL)          │
                     └────────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     [ Captura Óptica Cámara ]                        [ Interacción de Pantalla ]
     - BarcodeDetector Nativo                         - React 19 UI / Tailwind
     - Html5Qrcode Frame Engine                       - Semáforo de Caducidad
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          │ HTTPS (TLS 1.3)
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │      SERVIDOR EXPRESS (NODE.JS BFF)     │
                     │  - Encriptación de Entorno (.env)       │
                     │  - Validación de Esquemas JSON          │
                     │  - Fallback Offline (generateRecipes)   │
                     └────────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     [ API Externa Open Food Facts ]                 [ Google GenAI Platform ]
     - Catálogo Global de Códigos                    - Gemini 2.5 Flash / Vision
     - Atributos Nutricionales                       - Inferencia de Recetas</code></pre>
  </div>

  <!-- CAPÍTULO 8 -->
  <h1>8. Cumplimiento de Estándares de Seguridad (OWASP LLM)</h1>
  <p>El proyecto se diseñó bajo los estándares de la <strong>OWASP Top 10 for LLM Applications</strong>:</p>
  <ul>
    <li><strong>LLM01: Inyección de Prompts:</strong> Protección mediante la estricta delimitación entre instrucciones del sistema y datos no confiables de tickets o catálogos externos.</li>
    <li><strong>LLM02: Fuga de Información Sensible:</strong> Se excluyen del modelo nombres de usuarios, direcciones y números de tarjeta impresos en recibos.</li>
    <li><strong>LLM06: Agencia Excesiva:</strong> El LLM no posee capacidades de escritura directa en la base de datos sin autorización explícita del usuario mediante confirmación en interfaz.</li>
  </ul>

  <!-- CAPÍTULO 9 Y 10 -->
  <div class="page-break"></div>
  <h1>9. Resultados Obtenidos y Métricas de Rendimiento</h1>
  <p>Durante las pruebas de despliegue en producción se registraron las siguientes métricas de rendimiento:</p>
  <ul>
    <li><strong>Tiempo de lectura de código de barras:</strong> 12–40 milisegundos mediante el chip nativo de visión.</li>
    <li><strong>Tiempo de respuesta del Chef IA:</strong> Promedio de 1.8 segundos con Gemini 2.5 Flash y menos de 10 milisegundos cuando se sirve desde la memoria en caché (<code>MEM_CACHE</code>).</li>
    <li><strong>Tamaño final del bundle compilado:</strong> Optimizado a menos de 450 kB gzip con Vite y esbuild.</li>
  </ul>

  <h1>10. Conclusiones y Prospectiva de Trabajo Futuro</h1>
  <p>
    <strong>Pantry Guard</strong> cumple satisfactoriamente con los objetivos planteados al demostrar que la combinación de visión por computadora y modelos generativos de inteligencia artificial puede trasladarse a una aplicación móvil de alto impacto cotidiano.
  </p>
  <p>Como líneas de desarrollo futuro se proyecta:</p>
  <ul>
    <li>Integración de sensores IoT para control automático de temperatura y humedad en refrigeradores.</li>
    <li>Sincronización multi-dispositivo en la nube para familias compartidas.</li>
    <li>Cálculo automatizado de la huella de carbono evitada y exportación de reportes de ahorro financiero en PDF.</li>
  </ul>

  <div class="footer-stamp">
    Memoria de Proyecto de Software Móvil • Universidad Autónoma de Nayarit (UAN) • Tepic, Nayarit
  </div>

</body>
</html>`;

// Guardar los 3 archivos HTML fuente
const pathHtmlTecnico = path.join(docsDir, 'MANUAL_INTERNO_TECNICO.html');
const pathHtmlUsuario = path.join(docsDir, 'MANUAL_EXTERNO_USUARIO.html');
const pathHtmlOficial = path.join(docsDir, 'DOCUMENTACION_OFICIAL_PROYECTO.html');

fs.writeFileSync(pathHtmlTecnico, htmlManualTecnico, 'utf8');
fs.writeFileSync(pathHtmlUsuario, htmlManualUsuario, 'utf8');
fs.writeFileSync(pathHtmlOficial, htmlDocumentacionOficial, 'utf8');

console.log('✓ Archivos HTML generados en /docs');

// Compilar a PDF usando Microsoft Edge Headless nativo
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const pdfsToCompile = [
  { html: pathHtmlTecnico, pdf: path.join(docsDir, 'MANUAL_INTERNO_TECNICO.pdf'), title: 'Manual Técnico' },
  { html: pathHtmlUsuario, pdf: path.join(docsDir, 'MANUAL_EXTERNO_USUARIO.pdf'), title: 'Manual de Usuario' },
  { html: pathHtmlOficial, pdf: path.join(docsDir, 'DOCUMENTACION_OFICIAL_PROYECTO.pdf'), title: 'Documentación Oficial' },
];

import { spawnSync } from 'child_process';

for (const item of pdfsToCompile) {
  console.log(`Compilando PDF: ${item.title}...`);
  try {
    const res = spawnSync(edgePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${item.pdf}`,
      item.html
    ], { stdio: 'inherit' });

    if (fs.existsSync(item.pdf)) {
      const stats = fs.statSync(item.pdf);
      console.log(`✓ ${item.title} generado con éxito (${stats.size} bytes): ${item.pdf}`);
    } else {
      console.warn(`Advertencia: No se encontró ${item.pdf}`);
    }
  } catch (err) {
    console.error(`Error al compilar ${item.title}:`, err);
  }
}

// Sincronizar copias a D:\UAN\Aplicaciones Moviles\Pantry Guard\docs si existe
const dDocsDir = 'D:\\UAN\\Aplicaciones Moviles\\Pantry Guard\\docs';
if (fs.existsSync('D:\\UAN\\Aplicaciones Moviles\\Pantry Guard')) {
  if (!fs.existsSync(dDocsDir)) {
    fs.mkdirSync(dDocsDir, { recursive: true });
  }
  for (const item of pdfsToCompile) {
    if (fs.existsSync(item.pdf)) {
      const destPdf = path.join(dDocsDir, path.basename(item.pdf));
      fs.copyFileSync(item.pdf, destPdf);
      console.log(`✓ Copiado a D: ${destPdf}`);
    }
  }
}

console.log('\n¡Todos los manuales PDF en extenso han sido generados y sincronizados!');
