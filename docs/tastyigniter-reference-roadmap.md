# SIMI - Referencia de arquitectura inspirada en TastyIgniter

Este documento usa TastyIgniter como espejo de producto, no como codigo para copiar. SIMI mantiene su propio stack actual: Next.js, Supabase, UI tipo Apple y enfoque mobile-first para restaurantes en Peru.

## Lectura de la repo local

Ruta revisada:

`C:\Users\User\Downloads\PROYECTOS\TastyIgniter-4.x`

La copia local es una app Laravel base que depende de `tastyigniter/core` por Composer. Las carpetas `extensions` y `themes` estan vacias en esta descarga, asi que no conviene copiar estructura interna desde esa carpeta como si fuera el producto completo.

Lo valioso para SIMI es el mapa de dominios:

- Restaurante / ubicaciones
- Menu online
- Carrito y checkout
- Pedidos
- Delivery y recojo
- Reservas
- Metodos de pago
- Promociones
- Panel administrativo
- Roles y permisos

## Principio de crecimiento para SIMI

SIMI debe crecer por modulos claros, no por pantallas sueltas. Cada modulo debe tener:

- Vista publica cuando aplique.
- Vista de negocio.
- Datos en Supabase.
- Acciones controladas por permisos.
- Estados claros.
- Fallback simple si una integracion externa todavia no esta pagada.

## 1. Cliente / Comensal

Ruta principal:

`/menu/[slug]`

Ejemplo:

`/menu/polleria-el-sabor`

### Funcionalidades base

SIMI ya cubre parte importante de este flujo:

- Ver menu.
- Filtrar por categorias.
- Agregar productos al carrito.
- Elegir cantidad.
- Anadir notas por producto.
- Elegir tipo de pedido.
- Confirmar pedido.
- Pago manual por Yape.
- Subir comprobante.
- Enviar pedido por WhatsApp.
- Recibir numero de pedido.
- Ver seguimiento en `/pedido/[orderId]`.

### Tipos de pedido

SIMI debe mantener estos tres tipos como eje del sistema:

- Comer en local: `dine_in`.
- Recojo en tienda: `pickup`.
- Delivery: `delivery`.

### Siguiente mejora para esta vista

El siguiente bloque importante, tomando TastyIgniter como referencia, es mejorar el producto antes del checkout:

- Combos configurables.
- Modificadores de producto.
- Extras.
- Variantes.
- Reglas de disponibilidad por horario.
- Promociones visibles.
- Minimo de pedido para delivery.
- Costo de delivery por zona, manual primero.

## 2. Negocio / Administrador del restaurante

Ruta principal:

`/admin`

SIMI ya separa:

- Super administrador: controla todos los negocios.
- Administrador del negocio: controla solo su plataforma.

El panel del negocio debe crecer hacia:

- Datos del negocio.
- Horarios.
- WhatsApp de pedidos.
- Yape / QR.
- Carta.
- Mesas.
- Pedidos.
- Cocina.
- Delivery.
- Promociones.
- Reservas.
- Reportes simples.

## 3. Menu y productos

SIMI ya tiene:

- Categorias.
- Productos.
- Imagen.
- Precio.
- Disponibilidad.
- Orden.
- Banner promocional.
- Colores del negocio.

Siguiente estructura recomendada:

- `product_options`: grupos de opciones, por ejemplo "Termino", "Gaseosa", "Cremas".
- `product_option_values`: valores, por ejemplo "Inca Kola 1L", "Coca Cola 1L".
- `product_extras`: extras con precio, por ejemplo "Papas adicionales".
- `combo_groups`: grupos dentro de combos.
- `product_availability`: horarios o dias donde un producto se vende.

No conviene implementar todo de golpe. Primero combos y extras, porque son los mas utiles para pollerias.

## 4. Pedidos

SIMI ya tiene:

- Pedido creado antes del pago.
- Items del pedido.
- Estado de pedido.
- Estado de pago.
- Comprobante.
- WhatsApp al negocio.
- Panel de pedidos.

La direccion correcta es mantener el pedido como centro de todo.

Estados operativos actuales de Fase 2:

- `new`
- `received`
- `payment_pending`
- `payment_submitted`
- `payment_validated`
- `preparing`
- `ready`
- `handed_to_courier`
- `on_the_way`
- `arriving`
- `delivered`
- `cancelled`

Proxima mejora:

- Motivo de cancelacion.
- Tiempo prometido.
- Responsable interno.
- Reimpresion o vista tipo ticket.
- Separar vista de cocina por columnas.

## 5. Delivery / recojo

Para MVP barato, no usar Google Maps todavia como dependencia principal.

Ahora debe funcionar asi:

- Cliente escribe direccion y referencia.
- Negocio asigna repartidor manualmente.
- Negocio coloca tiempo estimado manual.
- Negocio cambia estados.
- Cliente ve seguimiento.

Cuando haya presupuesto, se puede activar:

- Google Maps Places para autocompletar direccion.
- Google Maps Distance Matrix para costo/tiempo estimado.
- Ubicacion del repartidor en tiempo real.
- Zonas de delivery con poligonos.

Estructura ya preparada:

- `courier_name`
- `courier_phone`
- `courier_latitude`
- `courier_longitude`
- `estimated_delivery_time`
- `tracking_note`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## 6. Reservas

TastyIgniter incluye reservas como dominio importante. En SIMI esto debe ir despues de que pedidos y cocina funcionen bien.

Modelo minimo recomendado:

- Cliente.
- Fecha.
- Hora.
- Cantidad de personas.
- Mesa opcional.
- Nombre.
- Telefono.
- Estado: pendiente, confirmada, cancelada, atendida.

No mezclar reservas con pedidos. Deben ser modulos distintos, aunque compartan mesas.

## 7. Pagos

SIMI ahora usa Yape manual, que es correcto para MVP Peru.

Modelo actual:

- El dinero va directo al negocio.
- SIMI registra pedido y comprobante.
- El negocio valida manualmente.

Futuro:

- Multiples metodos de pago por negocio.
- Efectivo.
- Tarjeta contra entrega.
- Plin.
- Yape.
- Pasarela automatica.

No activar pago automatico hasta que haya cliente real o presupuesto, porque complica conciliacion, comisiones y soporte.

## 8. Promociones

SIMI ya tiene banner promocional.

Siguiente version:

- Promocion por producto.
- Promocion por categoria.
- Combo promocional.
- Cupon simple.
- Regla por horario.

Ejemplos utiles para pollerias:

- "Combo familiar".
- "2 pollos + gaseosa".
- "Delivery gratis desde S/ 60".
- "Promo solo de lunes a jueves".

## 9. Panel administrativo

SIMI debe mantener dos niveles:

- Super admin: gestiona negocios, usuarios, planes y configuracion global.
- Admin del negocio: opera su carta, pedidos, cocina, delivery y configuracion.

Siguiente crecimiento:

- Crear usuarios por negocio.
- Roles internos: administrador, cocina, caja, repartidor.
- Permisos por modulo.
- Vista solo cocina.
- Vista solo delivery.

## Ruta recomendada de fases

### Fase 1

Ya cubierta:

- Menu publico.
- Carrito.
- Pedido.
- Yape manual.
- Comprobante.
- WhatsApp.
- Panel.

### Fase 2

En progreso:

- Cocina.
- Estados en vivo.
- Tracking publico del pedido.
- Delivery manual.

### Fase 3

Siguiente recomendada:

- Combos.
- Extras.
- Modificadores.
- Promociones simples.

### Fase 4

- Horarios.
- Zonas de delivery manuales.
- Costo de delivery por zona.
- Tiempo estimado por zona.

### Fase 5

- Reservas.
- Mesas con disponibilidad.
- Calendario simple.

### Fase 6

- Pagos avanzados.
- Google Maps.
- Repartidor en tiempo real.
- Reportes.

## Decision para SIMI

No clonar TastyIgniter. Usarlo como mapa de madurez.

SIMI debe ser mas simple, mas mobile-first y mas enfocado en negocios pequenos de Peru. La ventaja no sera tener mas funciones desde el dia uno, sino que el flujo principal funcione muy bien:

Cliente escanea QR -> arma pedido -> confirma -> paga por Yape -> sube comprobante -> negocio recibe -> cocina prepara -> delivery/recojo/local entrega -> cliente ve estado.
