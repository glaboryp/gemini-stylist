# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas que se visten a diario. Escanean su armario una vez con un vídeo corto y vuelven cada mañana al chat para decidir qué ponerse según el clima y la ocasión. Uso en móvil y escritorio.

## Product Purpose

Gemini Stylist construye un inventario digital del armario a partir de un único vídeo y actúa como estilista personal: aconseja outfits con el clima local, tendencias verificadas con búsqueda de Google y sugerencias de compra para prendas nuevas. Éxito: la usuaria sube el vídeo, ve su armario completo y recibe un consejo útil en el primer mensaje del chat.

## Positioning

Un solo vídeo corto sustituye a fotografiar y catalogar prenda a prenda. Gemini multimodal identifica cada prenda (tipo, subtipo, color, temporada, formalidad, instante del vídeo) y el consejo posterior combina ese inventario con clima real y tendencias actuales.

## Operating Context

- Flujo: Upload (subida del vídeo y análisis) > Wardrobe (rejilla de prendas) con panel de chat y modal para ver cada prenda en el vídeo.
- Backend FastAPI con Gemini; frontend Vue 3 + Pinia + Tailwind 4 desplegado en Firebase Hosting.
- El inventario, los mensajes y la ubicación se guardan en el almacenamiento local del navegador.
- Clima mediante Open-Meteo con la geolocalización de la usuaria.

## Capabilities and Constraints

- Datos por prenda disponibles: `type`, `subtype`, `primary_color`, `season`, `formality` (1 a 10), `timestamp_seconds`, `emoji`. No hay fotografía de cada prenda.
- Diagnóstico de estilo (vibe y paleta dominante) tras la subida.
- Chat con fuentes de compra (título, origen, enlace, logo).
- Interfaz en inglés. Idioma de la UI sin cambio decidido.
- Solo se cambia presentación en este rediseño: backend y store no se tocan.
- Pruebas con Vitest y cobertura obligatoria en CI; build con Vite.

## Brand Commitments

- Nombre: Gemini Stylist.
- El logo actual se sustituye; el nuevo se genera con una IA de imágenes a partir de un prompt que entrega el equipo de diseño.
- El botón "For Judges" (carga de datos de demostración) se elimina de la interfaz.

## Evidence on Hand

- Sin testimonios, cifras de usuarios ni casos de estudio: no inventarlos.
- Datos de demostración en `frontend/src/data/mock.js`.

## Product Principles

- El armario de la usuaria es el protagonista: sus colores y sus prendas son el único contenido saturado de la interfaz.
- Una acción clara por pantalla: subir el vídeo, o preguntar al estilista.
- El consejo debe sentirse fundamentado (clima, tendencias, fuentes), no genérico.
- La confianza se gana con transparencia: se muestran las fuentes y se puede ver cada prenda en el vídeo.
- Ni la marca ni la interfaz deben parecer una herramienta de IA genérica.

## Accessibility & Inclusion

Estándar objetivo para el rediseño: WCAG AA (contraste, foco visible, uso por teclado, `prefers-reduced-motion`). Uso táctil en móvil.
