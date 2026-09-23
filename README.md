# 🛒 Pantry Guard

**Sistema Multiplataforma de Gestión Inteligente de Despensa, Mitigación de Pérdida de Alimentos y Asistencia Culinaria Basada en Inteligencia Artificial.**

Pantry Guard es una solución de software (PWA / Android / iOS) orientada a resolver el desperdicio de alimentos de consumo diario en el hogar. Integra visión artificial (escaneo de códigos EAN/UPC y reconocimiento de tickets de compra) con algoritmos generativos de Google Gemini para mantener un inventario en tiempo real, clasificar alimentos con semáforos preventivos de caducidad y proponer recetas de aprovechamiento (Zero-Waste Cooking).

---

## ✨ Características Principales

* **📸 Escáner de Códigos de Barras (Hardware Accelerated):** Detección en tiempo real (60 FPS) usando la cámara del dispositivo para registrar productos automáticamente consultando la base de datos de *Open Food Facts*.
* **🧾 OCR de Tickets de Supermercado:** Procesamiento de imágenes de recibos de compra mediante **Gemini Vision** para extraer, categorizar y estimar fechas de caducidad de múltiples productos en segundos.
* **🚦 Semáforo Preventivo de Caducidades:** Algoritmo de clasificación visual (Vigente, Próximo a Vencer, Caducado) basado en fechas dinámicas.
* **🧑‍🍳 Chef IA Cero Desperdicio:** Motor impulsado por **Gemini 2.5 Flash** que analiza tu despensa y genera recetas deliciosas utilizando *estrictamente* los ingredientes disponibles, priorizando los que están por caducar.
* **☁️ Arquitectura BFF (Backend-for-Frontend):** Despliegue en Node.js/Express para proteger llaves criptográficas (.env), con sistema de caché en memoria y protección *Rate-Limiting*.
* **📄 Exportación de Reportes PDF:** Generación nativa de listas de compras y estado de inventario para compartir o imprimir.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React 19, TypeScript, Tailwind CSS, Vite
* **Backend:** Node.js, Express (Arquitectura BFF)
* **Inteligencia Artificial:** SDK de Google GenAI (@google/genai)
* **Visión Computacional:** Html5Qrcode (ZXing / BarcodeDetector API nativa)
* **Contenedor Móvil:** Ionic Capacitor 8.5 (Android / Web)
* **Despliegue:** Render.com (Web Service HTTPS)

---

## 🚀 Instalación y Ejecución Local

**Requisitos previos:** Node.js (v20 o superior).

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/AAMC98/PantryGuard.git
   cd PantryGuard
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Crea un archivo llamado `.env` en la raíz del proyecto y agrega tu llave de Google AI Studio:
   ```env
   GEMINI_API_KEY="TU_LLAVE_SECRETA_AQUI"
   ```

4. **Levantar el entorno de desarrollo (con recarga rápida):**
   ```bash
   npm run dev
   ```
   El servidor frontend y backend se ejecutarán simultáneamente en `http://localhost:3000`.

---

## 📱 Compilación para Producción (Android / Web)

Para generar la versión optimizada de producción y sincronizar los assets con Android Studio:

```bash
npm run build
npx cap sync android
```
Posteriormente, puedes abrir la carpeta `android` en Android Studio para compilar y firmar el APK.

---

## 🛡️ Seguridad

Este proyecto implementa recomendaciones del **OWASP Top 10 for LLM Applications**:
* Las llaves de API nunca se exponen al cliente móvil.
* Exclusión estricta de información sensible (PII) mediante prompts de sistema en el escáner de tickets.
* Prevención de inyección de prompts indirecta delegando el renderizado a componentes controlados de React.

---
*Desarrollado por Adán Mejía para la Universidad Autónoma de Nayarit (Unidad Académica de Economía) - Ciclo Académico 2026.*
