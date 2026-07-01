# NAVE — Control y Gestión de Motocicletas

> **Creative North Star: "The Mechanical Redline"**
> NAVE es una aplicación web y PWA diseñada bajo una estética de **Brutalismo Orgánico**. Con bordes afilados (0px border-radius), tipografía técnica y un contraste agresivo en tonos negros, rojos y dorados, NAVE emula la precisión y el estilo visual de los tacómetros y manuales mecánicos de alto rendimiento.

## ⚡ Características Principales

- **Gestión Multi-Vehículo**: Añade y cambia rápidamente entre diferentes motocicletas con avatares personalizables (DiceBear) y clasificaciones por cilindrada (CC).
- **Dashboard de Alto Rendimiento**: Visualización de estadísticas de combustible reactivas, distancia recorrida e interfaces rápidas para logs de combustible y kilometraje.
- **Registro Unificado**: Sistema interactivo para almacenar rutas, cargas de gasolina y registros históricos de mantenimiento.
- **Mapa de Rutas (MapView)**: Seguimiento interactivo e intuitivo de las rutas recorridas utilizando MapLibre GL.
- **Cronogramas de Mantenimiento**: Consulta de programas de servicio de marcas populares de motocicletas (incluyendo Bera y Empire Keeway), con alertas de kilometraje y fechas.
- **Biblioteca de Manuales**: Acceso rápido a manuales de usuario y hojas técnicas de referencia de tu moto.
- **Soporte PWA (Progressive Web App)**: Diseñada para dispositivos móviles con soporte offline, instalación en pantalla de inicio e iconos de marca unificados.
- **Localización Completa (i18n)**: Soporte multiidioma dinámico con detección automática.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19, TypeScript
- **Estilos**: Tailwind CSS v4 con variables CSS personalizadas
- **Construcción y Servidor**: Vite + TSX (TypeScript Execute)
- **Mapas**: MapLibre GL
- **Internacionalización**: i18next & react-i18next
- **Animaciones**: Motion (framer-motion)
- **Base de Datos Local**: SQLite (motos.db) y JSON integrado para marcas
- **Iconografía**: Lucide React

---

## 🚀 Instalación y Desarrollo Local

### Requisitos Previos

- **Node.js** (versión 18 o superior recomendada)
- **npm** o **pnpm**

### Pasos para Ejecutar

1. **Instalar dependencias**:

   ```bash
   npm install
   ```

   _(O usando pnpm)_

   ```bash
   pnpm install
   ```

2. **Configurar Variables de Entorno**:
   Crea un archivo `.env.local` en la raíz del proyecto y agrega tu API Key de Gemini:

   ```env
   GEMINI_API_KEY=tu_gemini_api_key_aqui
   ```

3. **Ejecutar en modo Desarrollo**:

   ```bash
   npm run dev
   ```

   La aplicación estará disponible por defecto en [http://localhost:3000](http://localhost:3000).

4. **Construir para Producción**:
   ```bash
   npm run build
   ```

---

## 📝 Historial de Cambios (Changelog)

A continuación se detallan las mejoras y nuevas características del proyecto organizadas según el historial de confirmaciones de Git:

### v2.1.0

- **Imágenes Optimizadas**: Integración de recursos gráficos comprimidos de motocicletas para los modelos más populares de **Bera** y **Empire Keeway** (`4dc214d`).
- **Base de Datos Enriquecida**: Raspado de datos de motos, integración de logos de marcas en los módulos de _onboarding_ y vehículo, avatares dinámicos usando DiceBear y categorización por cilindrada (CC) (`d59fbd1`).

### v2.0.0 (UX Overhaul & Rebrand)

- **Rebranding Completo**: Transición oficial de marca de _Apex Velocity_ a **NAVE**, incluyendo la renovación de logotipos, favicons e iconos PWA (`8bc02e8`, `56f99b1`, `f620afc`).
- **Mejoras Reactivas y Correcciones**: Telemetría de combustible reactiva, guardas de seguridad en logs base y renderizado corregido de rutas en la sección de actividad reciente (`5f36736`).
- **Dashboard UX**: Inclusión de ventana modal de notificaciones estilo campana, formularios rápidos en línea para kilómetros y gasolina, y cálculo reactivo de distancias (`7af3e09`).
- **Experiencia de Usuario Rediseñada (Fases 1-7)**: Uso de lenguaje más humano y accesible, onboarding intuitivo paso a paso y la introducción del "Modo Experto" (`ca39195`).

### v1.1.0

- **Integración de Servicios**: Lista de programas de mantenimiento preventivo vinculada al selector de servicios, con inputs de fecha y kilometraje para el registro histórico (`f1713c8`).
- **Consolidación de Pantallas**: Corrección del error de pantalla de rutas no definida renderizando `LogsScreen` con la pestaña inicial configurada en `routes` (`c3108de`).
- **Unificación de Registros**: Interfaz unificada de rutas y logs de mantenimiento, optimización de layouts para pantallas móviles, integración de watcher con polling continuo y adición de `ConfirmModal` (`673a47e`).
- **Manuales y Rutas**: Implementación de MapView interactivo, carga dinámica de manuales técnicos y fichas de mantenimiento de vehículos venezolanos (`c9eedba`, `d987b8f`).

### v1.0.0

- **Optimizaciones PWA**: Mejora de capacidades offline, registro de Service Workers y centralización del sistema de temas visuales (`72e211b`).
- **Rediseño MD3 & Multi-vehículo**: Soporte para gestionar múltiples motos, indicador gráfico de nivel de gasolina, sección de notificaciones y controles avanzados de privacidad de datos (`b24fb82`, `72e93f4`).
- **Inicialización**: Creación y configuración inicial del proyecto bajo el nombre de Apex Velocity (`f3ef8e4`, `a33d0e2`).
