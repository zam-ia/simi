# SIMI - Operacion, monitoreo y escalamiento

Este documento resume la base operativa actual de SIMI y las siguientes capas recomendadas para soportar crecimiento.

## MVP en produccion

SIMI ya debe operar con foco en tres usuarios:

- Comensal: entra a la carta, arma pedido, sube comprobante y consulta estado.
- Negocio: administra carta, productos, pedidos, pagos, cocina, delivery y reservas.
- Repartidor: por ahora se gestiona desde el modulo Delivery del negocio; la app de repartidor es fase 2.

## Protecciones implementadas

- Header de seguridad en todas las rutas.
- `x-simi-request-id` para rastrear errores entre navegador, API y logs.
- Limite basico por IP en endpoints publicos sensibles:
  - `/api/public/orders`
  - `/api/public/reservations`
  - `/api/public/orders/[orderId]/proof`
  - `/api/monitoring/client-error`
- Health check en `/api/health` con medicion de respuesta de Supabase.
- Captura de errores frontend con breadcrumbs basicos de clics.
- Tabla `monitoring_events` para registrar errores de cliente, API, health, seguridad y colas.
- Idempotencia en pedidos y outbox transaccional durable para notificaciones.
- Campana de alertas en el header del administrador, separada del toggle claro/oscuro.

## Alta de negocios

1. Entrar como superadmin.
2. Ir a `Negocios`.
3. Crear nuevo cliente con:
   - nombre comercial
   - slug publico
   - WhatsApp publico
   - WhatsApp de notificaciones
   - logo
   - colores de marca
4. Configurar modulos activos segun el plan contratado.
5. Cargar categorias y productos.
6. Probar la carta publica en `/menu/[slug]`.
7. Generar o entregar QR permanente.

## Alta de repartidores

1. Entrar al negocio.
2. Ir a `Delivery`.
3. Crear zonas de cobertura con costo y tiempo estimado.
4. Registrar repartidor con nombre, telefono y estado activo.
5. Cuando cocina marque un pedido como listo, asignar repartidor desde Delivery.

## Capacidad objetivo

Objetivo comercial inicial:

- 100 administradores simultaneos.
- 1000 comensales navegando o haciendo pedidos.

La base actual puede soportar el MVP si:

- Las imagenes se mantienen livianas.
- La carta publica evita consultas innecesarias.
- Los endpoints de escritura se protegen con limites.
- Supabase mantiene indices y RLS bien aplicados.
- Se monitorea `/api/health` desde fuera cada 1 a 5 minutos.

## Siguiente capa tecnica

Antes de una campana grande o de operar como marketplace multi-lado, agregar:

- Redis para sustituir el limite en memoria por rate limiting distribuido. Redis no debe ser requisito para crear pedidos.
- QStash o un scheduler para despertar workers; PostgreSQL mantiene la outbox como fuente de verdad.
- Dashboard de colas en tiempo real.
- Dead-letter y alertas por edad de mensajes para la outbox existente.
- Sentry u OpenTelemetry para tracing completo y errores con contexto.
- Uptime monitor externo con alertas por WhatsApp/Telegram/Slack.
- Telemetria tecnica de 30 a 90 dias y auditoria de negocio archivada por 2 anos.
- App o PWA para repartidor con geolocalizacion y estados.
- Load testing antes de campanas grandes.

La seleccion de proveedores, costos y reglas de tolerancia a fallos se encuentra en `docs/infraestructura-produccion-costos.md`.

## Reglas de producto para Huancayo

- Reducir pasos en checkout: cada campo extra puede perder pedidos.
- Yape/Plin deben ser visibles y simples.
- Permitir pedidos con conectividad inestable: formularios cortos, imagenes comprimidas y feedback claro.
- El negocio debe poder operar sin entrar a muchos modulos: campana, sonido y tablero operativo primero.
- El repartidor necesita pocas acciones: aceptar, en camino, entregado.
