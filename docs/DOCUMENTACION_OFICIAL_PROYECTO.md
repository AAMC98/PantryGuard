# Documento Oficial de Especificación del Proyecto
## Pantry Guard — Sistema de Gestión Inteligente de Despensa y Mitigación de Desperdicio Alimentario

---

## 1. Resumen Ejecutivo
**Pantry Guard** es una solución de software multiplataforma diseñada para resolver la problemática del desperdicio de alimentos y el gasto económico innecesario en los hogares. Integrando tecnologías modernas de visión computacional en dispositivos móviles e inteligencia artificial generativa, el sistema automatiza el inventario doméstico, predice fechas de caducidad, analiza tickets de compra y genera propuestas culinarias de aprovechamiento en tiempo real con base en las existencias vigentes.

---

## 2. Justificación y Planteamiento del Problema
A nivel global y nacional, el desperdicio alimentario representa uno de los mayores desafíos ambientales y económicos. En el ámbito doméstico, la falta de visibilidad sobre los alimentos almacenados, las compras duplicadas y la desorganización provocan que entre el 20% y el 35% de los víveres terminen en la basura antes de ser consumidos. Pantry Guard surge como una herramienta tecnológica accesible, sin barreras de costo y orientada a la economía circular (*Zero Waste*).

---

## 3. Objetivos del Proyecto

### Objetivo General:
Desarrollar una aplicación móvil y web progresiva que optimice la administración de alimentos en el hogar mediante el escaneo de códigos de barras, reconocimiento óptico de recibos y asistencia de inteligencia artificial generativa, disminuyendo el desperdicio de comida y facilitando la planificación de compras y recetas.

### Objetivos Específicos:
1. Implementar un módulo de escaneo óptico en tiempo real para códigos EAN/UPC y tickets de compra mediante hardware de cámara móvil.
2. Construir un sistema semántico de semaforización de caducidades con alertas visuales preventivas.
3. Integrar un motor de razonamiento de IA (*Chef Cero Desperdicio*) con Gemini que elabore recetas a partir de insumos en riesgo de vencer.
4. Diseñar una arquitectura segura que proteja las credenciales del sistema y preserve la privacidad de los datos del usuario.
5. Garantizar la interoperabilidad multiplataforma en sistemas Android, iOS y navegadores web.

---

## 4. Requerimientos del Sistema

### Requerimientos Funcionales (RF):
* **RF-01:** El sistema debe permitir el registro manual de alimentos (nombre, cantidad, unidad, ubicación y caducidad).
* **RF-02:** El sistema debe capturar códigos de barras 1D mediante la cámara del dispositivo móvil e identificar el producto a través de la base de datos Open Food Facts.
* **RF-03:** El sistema debe contar con un modo ráfaga (*Modo Supermercado*) para escaneo continuo de múltiples productos.
* **RF-04:** El sistema debe procesar fotografías de tickets de compra e identificar automáticamente la lista de artículos adquiridos mediante OCR con IA.
* **RF-05:** El sistema debe clasificar los alimentos en tres estados visuales: Vigente, Próximo a caducar y Caducado.
* **RF-06:** El sistema debe generar recetas culinarias categorizadas (Desayuno, Almuerzo/Cena, Exprés, Postre/Snack) basadas en el inventario real.
* **RF-07:** El sistema debe permitir guardar recetas en una sección de favoritos y enviar ingredientes faltantes a la lista de compras.
* **RF-08:** El sistema debe contar con soporte multi-idioma (Español e Inglés) y modo oscuro/claro.

### Requerimientos No Funcionales (RNF):
* **RNF-01 (Rendimiento):** El tiempo de detección de códigos de barras mediante el hardware del teléfono debe ser menor a 200 ms.
* **RNF-02 (Seguridad):** Las llaves de API deben residir exclusivamente en el backend y no viajar al cliente móvil.
* **RNF-03 (Disponibilidad):** El sistema debe incluir un motor de respaldo local con recetas deterministas en caso de desconexión del LLM.
* **RNF-04 (Usabilidad):** La interfaz debe ser responsiva y adaptarse a pantallas de teléfonos, tabletas y ordenadores de escritorio.
* **RNF-05 (Compatibilidad):** Cumplimiento con los estándares PWA de W3C e instalación en Android e iOS.

---

## 5. Marco de Seguridad y Privacidad
El proyecto implementa las recomendaciones del **OWASP Top 10 for LLM Applications**:
* **BFF (Backend-for-Frontend):** Desacoplamiento de credenciales del binario móvil.
* **Validación Rígida de Esquemas:** Control de salida de IA mediante `responseSchema` en formato JSON estricto.
* **Minimización de Datos (Privacy by Design):** Redacción de números bancarios o datos de pago antes de cualquier consulta externa.
* **Cifrado en Tránsito:** Uso de TLS 1.3 / HTTPS obligatorio.

---

## 6. Conclusiones y Trabajo a Futuro
Pantry Guard demuestra la viabilidad de aplicar modelos de lenguaje y visión por computadora a un problema doméstico universal. Como líneas de trabajo futuro se contempla la sincronización en la nube multi-usuario para familias compartidas, integración con sensores de temperatura IoT en refrigeradores y exportación de métricas de huella de carbono evitada.
