# SIMI - Infraestructura paga, costos y ruta de escalamiento

Fecha de referencia: 13 de julio de 2026. Los importes en USD no incluyen impuestos, tipo de cambio ni consumo excedente.

## Decision recomendada

SIMI no necesita migrar hoy a una infraestructura compleja. La ruta mas segura y economica es:

1. Cloudflare para dominio, DNS, SSL, DNSSEC y proteccion perimetral.
2. Vercel Pro para `simi-web` y el panel/carta de `simi` durante la primera etapa.
3. Supabase Pro para PostgreSQL, Auth, Storage y Realtime.
4. `simi-api` en Cloud Run cuando los workers y procesos de fondo necesiten ejecucion continua.
5. Upstash Redis solo para rate limiting distribuido y cache de lecturas.
6. La cola transaccional de PostgreSQL como fuente de verdad; QStash solo despierta workers y programa reintentos.
7. Sentry para errores, breadcrumbs, tracing y alertas; Better Stack para uptime, cron y pagina de estado.
8. Cloudflare R2 para respaldos y archivos de auditoria con retencion de dos anos.

Redis nunca debe decidir si un pedido puede existir. Si Redis falla, puede bajar el rendimiento o activarse un limite conservador, pero el pedido debe seguir entrando por PostgreSQL y su outbox transaccional.

## Dominios y subdominios

Comprar un solo dominio principal. Los subdominios no se compran por separado: se crean como registros DNS sin costo adicional.

Estructura sugerida:

- `simiperu.pe`: web comercial.
- `app.simiperu.pe`: panel SIMI y cartas publicas.
- `api.simiperu.pe`: API y webhooks.
- `status.simiperu.pe`: estado publico del servicio.
- `staging.app.simiperu.pe`: pruebas del sistema.
- `staging.api.simiperu.pe`: pruebas del API.

Punto.pe publica `S/ 110` por un ano para `.pe` y `.com.pe`, impuestos incluidos. Un `.com` en Cloudflare se cobra al costo del registro; como presupuesto conservador se puede reservar entre `USD 12 y 20 por ano`, pero el precio real depende del nombre y del registro en el momento de compra.

Fuentes: [Punto.pe](https://punto.pe/search.php) y [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/).

## Presupuesto mensual

### Etapa 1 - lanzamiento controlado

| Servicio | Configuracion | Mensual | Anual aproximado |
| --- | --- | ---: | ---: |
| Vercel | Pro, un desarrollador | USD 20 | USD 240 |
| Supabase | Pro + compute Small, aplicando credito de USD 10 | USD 30 | USD 360 |
| Upstash Redis | Fixed 250 MB | USD 10 | USD 120 |
| Upstash QStash | Pago por uso, USD 1 por 100 mil mensajes | USD 0-3 | USD 0-36 |
| Sentry | Team, facturacion anual | USD 26 | USD 312 |
| Better Stack | Free para uptime y heartbeats iniciales | USD 0 | USD 0 |
| Cloudflare R2 | Hasta 10 GB incluidos | USD 0 | USD 0 |
| Cloudflare DNS/SSL | Free | USD 0 | USD 0 |
| Total estimado | Sin dominio ni mensajeria WhatsApp | **USD 86-89** | **USD 1,032-1,068** |

Esta configuracion es adecuada para salir a produccion y medir. No garantiza por si sola 1,100 usuarios simultaneos; esa capacidad se confirma con una prueba de carga del flujo real.

### Etapa 2 - crecimiento con mayor margen

| Servicio | Configuracion | Mensual |
| --- | --- | ---: |
| Vercel | Pro + consumo | USD 20+ |
| Supabase | Pro + compute Medium, aplicando credito | USD 75 |
| Upstash Redis | Fixed 1 GB | USD 20 |
| QStash | Pago por uso | USD 1-10 |
| Sentry | Team | USD 26 |
| Better Stack | Nano mensual para logs, traces y metricas | USD 30 |
| Cloud Run | API/workers segun uso | USD 0-25 estimado |
| R2 | Auditoria y respaldos | USD 0-5 estimado |
| Total estimado | Sin PITR ni WhatsApp | **USD 172-211** |

Si el negocio requiere recuperacion a un segundo exacto, Supabase ofrece PITR desde `USD 100/mes`. Debe activarse cuando el volumen y facturacion justifiquen ese costo; mientras tanto se mantienen backups diarios y exportaciones externas.

Fuentes oficiales: [Vercel](https://vercel.com/pricing), [Supabase](https://supabase.com/pricing), [Upstash Redis](https://upstash.com/pricing/redis), [Upstash QStash](https://upstash.com/pricing/qstash), [Sentry](https://sentry.io/pricing/), [Better Stack](https://betterstack.com/pricing), [Cloud Run](https://cloud.google.com/run/pricing) y [Cloudflare R2](https://developers.cloudflare.com/r2/pricing/).

## Publicacion en tiendas moviles

| Concepto | Costo |
| --- | ---: |
| Google Play Console | USD 25, pago unico |
| Apple Developer Program | USD 99 por ano |
| Expo EAS Starter, opcional | USD 19 por mes |

Expo EAS Free permite comenzar y enviar builds, pero Starter da cola prioritaria y credito de compilacion. La primera app debe ser para comensales y operaciones esenciales; la app independiente de repartidor puede ir en fase 2.

Fuentes: [Google Play Console](https://support.google.com/googleplay/android-developer/answer/6112435?hl=es-419), [Apple Developer Program](https://developer.apple.com/help/account/membership/program-enrollment/) y [Expo EAS](https://expo.dev/pricing).

## Arquitectura operativa

```text
Cliente / Admin / Repartidor
          |
Cloudflare DNS + WAF + limites de borde
          |
Vercel: landing, carta y panel Next.js
          |
API / workers desacoplados
          |
Supabase PostgreSQL + Auth + Storage + Realtime
          |
Outbox transaccional -> QStash/worker -> WhatsApp y notificaciones

Redis: cache y rate limit solamente
R2: backups, auditoria y archivo de dos anos
Sentry + Better Stack: errores, traces, uptime y alertas
```

## Mitigacion de fallos

### API saturada

- Limites por IP, usuario, negocio y ruta.
- Limite de tamano de payload e imagenes.
- Idempotencia obligatoria en pedidos y pagos.
- Cache de carta publica y datos de lectura frecuente.
- Backpressure: responder `429` con `Retry-After` antes de agotar PostgreSQL.

### Redis caido

- El checkout y la cola no dependen de Redis.
- Lecturas pasan temporalmente a PostgreSQL con cache local corta.
- Escrituras sensibles usan un limite conservador y la idempotencia de base de datos.
- Alerta inmediata; no se intenta reconstruir pedidos desde Redis.

### PostgreSQL lento

- Pooler de Supabase en todas las conexiones serverless.
- Timeout por consulta y circuit breaker para operaciones no esenciales.
- Indices revisados con consultas reales y `EXPLAIN ANALYZE`.
- La carta publica se sirve desde cache durante una degradacion corta.
- Alertar cuando p95 supere 800 ms o el pool mantenga mas de 70% de uso.

### Cola acumulada

- Outbox durable en PostgreSQL con reintentos exponenciales.
- Dead-letter despues del maximo de intentos.
- Alerta si el mensaje mas antiguo pendiente supera 2 minutos.
- Cron de respaldo procesa la outbox aunque falle QStash.
- Panel de cola por estado, edad, proveedor e intentos.

### Servidor o proveedor caido

- Frontend y API sin estado local.
- Health checks externos cada minuto.
- Rollback inmediato a la ultima version estable.
- Backups fuera de Supabase y procedimiento probado de restauracion.
- Segunda region solo cuando el costo de inactividad sea mayor que su costo operativo.

## Monitoreo y retencion

Sentry/Better Stack no deben ser el unico historial legal. La retencion se separa en:

- Telemetria tecnica: errores, traces y replays por 30 a 90 dias.
- Auditoria de negocio: accesos, cambios, pedidos, pagos y estados por 24 meses.
- Archivo: exportacion mensual cifrada a R2 en JSONL o Parquet, con checksum y prueba trimestral de restauracion.
- Privacidad: no guardar contrasenas, tokens, QR de pago completos ni datos sensibles innecesarios en logs.

Alertas minimas:

- API 5xx mayor a 1% durante 5 minutos.
- p95 de checkout mayor a 1.5 segundos.
- PostgreSQL p95 mayor a 800 ms.
- Outbox pendiente mayor a 2 minutos o dead-letter mayor a cero.
- Health check fallido en dos ubicaciones.
- Uso de conexiones, CPU o disco mayor a 70% sostenido.

## Prueba de capacidad

Antes de prometer la capacidad comercial, ejecutar en staging una prueba escalonada:

1. 100 administradores consultando y actualizando pedidos.
2. 1,000 comensales navegando cartas cacheadas.
3. Un pico controlado de creacion de pedidos con idempotencia.
4. Caida simulada de Redis, worker de WhatsApp y respuesta lenta de PostgreSQL.
5. Verificar que no se pierdan pedidos y que la cola se recupere.

Objetivos iniciales: error menor a 1%, carta p95 menor a 800 ms, checkout p95 menor a 1.5 s y cero pedidos duplicados o perdidos.

## Estado actual y siguientes tareas

Ya existe en SIMI:

- idempotencia de pedidos;
- outbox transaccional para notificaciones;
- reintentos y bloqueo de trabajos;
- RLS y aislamiento por negocio;
- request ID, headers de seguridad y health check;
- rate limit distribuido con Upstash y respaldo local cuando Redis no responde;
- captura de errores frontend con breadcrumbs basicos;
- tabla de eventos de monitoreo.

Falta antes de una campana grande:

1. Conectar Sentry y Better Stack con secretos separados por ambiente.
2. Automatizar exportacion mensual a R2 y restauracion de prueba.
3. Crear dashboard y alertas de outbox.
4. Ejecutar la prueba de carga y dimensionar Supabase Small o Medium con evidencia.
5. Contenerizar `simi-api` para que pueda moverse de Vercel a Cloud Run sin cambiar el frontend.

## Activar Upstash en Vercel

1. Crear una base Redis regional en Upstash, preferiblemente cerca de Lima o de la region usada por Vercel.
2. Abrir la base y copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` desde la seccion REST API.
3. En Vercel, abrir el proyecto `simi`, entrar a Settings > Environment Variables y registrar ambas variables.
4. Activarlas en Production y Preview. Usar una base separada para Development si se desea aislar pruebas locales.
5. Volver a desplegar `main` y `staging` para que cada ambiente reciba los secretos.
6. Verificar una escritura publica: la respuesta debe incluir `x-simi-ratelimit-source: upstash`.

Si Upstash no responde en 750 ms o falla, SIMI usa automaticamente un limite local conservador. Redis no almacena pedidos ni decide si el pedido existe.

## Conectar un dominio con Cloudflare

1. Comprar o agregar el dominio a Cloudflare y completar el cambio de nameservers solicitado por Cloudflare.
2. En Vercel, abrir el proyecto correspondiente y agregar primero el dominio o subdominio en Settings > Domains.
3. Copiar exactamente el registro DNS que Vercel muestre; no inventar el destino CNAME.
4. Crear ese registro en Cloudflare DNS. Mantenerlo en `DNS only` hasta que Vercel lo marque como valido.
5. Cuando SSL y la validacion esten correctos, activar el proxy naranja si no interfiere con la verificacion de Vercel.
6. Usar `app.dominio` para el panel/carta, `www.dominio` para la web comercial y `staging.app.dominio` para pruebas.
7. Actualizar `NEXT_PUBLIC_APP_URL` en Vercel con la URL final del panel y volver a desplegar.

No compartir tokens de Upstash por chat. Deben pegarse directamente en Vercel como secretos. Para terminar Cloudflare se necesita confirmar el dominio exacto y a que proyecto de Vercel apuntara cada subdominio.
