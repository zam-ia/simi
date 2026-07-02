# SIMI — Pack de iconos SVG para Web y App móvil

Entregable vectorial basado en la línea gráfica enviada: rojo brasa, naranja delivery, ají amarillo, carbón, crema y esquinas tipo QR.

## Estructura

- `web_24_outline/`: iconos individuales para web, grid estándar `24x24`, trazos redondeados.
- `mobile_32_accent/`: iconos individuales para apps móviles, `32x32`, contenedor crema y acento SIMI.
- `brand_app_icons/`: icono fuente para app/favicons en SVG.
- `tokens/`: variables de color en CSS y JSON.
- `simi-icons-sprite.svg`: sprite SVG para implementación web.
- `manifest.json`: inventario de nombres, rutas y descripción de cada icono.
- `previews/`: láminas PNG para revisar visualmente el set.

## Estándar técnico aplicado

- SVG puro, editable y escalable.
- `viewBox="0 0 24 24"` para web y `viewBox="0 0 32 32"` para móvil.
- `stroke-linecap="round"` y `stroke-linejoin="round"` para mantener la personalidad redondeada de SIMI.
- Accesibilidad básica incluida: `<title>` y `<desc>`.
- Sin tipografías embebidas ni imágenes raster dentro de los SVG.

## Recomendación de uso

- Web navegación/menús: 20–24 px.
- Web cards/dashboard: 24–32 px.
- App tab bar: 24 px visual dentro de contenedor 32 px.
- App home cards: 32–48 px.
- Estados del sistema: usar `exito`, `advertencia`, `error`, `informacion` con sus colores funcionales.

## Paleta incluida

- Rojo Brasa: `#D92D20`
- Ají Amarillo: `#FFB000`
- Naranja Delivery: `#FF6B00`
- Carbón Parrilla: `#111111`
- Crema Carta: `#FFF4E5`
- Tinta Menú: `#1F2933`
- Acero Cocina: `#6B7280`

## Nota de implementación

Para React/Vue/Flutter/React Native, usar los SVG individuales. Para web estática, se puede usar `simi-icons-sprite.svg` o importar cada archivo como asset.
