# SIMI

SIMI es una app multi-cliente para crear cartas digitales con QR permanente. Esta pensada para restaurantes, pollerias, cafeterias y negocios similares.

## Stack

- Next.js 14 con App Router
- Supabase PostgreSQL, Auth y Storage
- Tailwind CSS
- `qrcode.react`
- Deploy recomendado en Vercel

## Instalacion local

1. Instala dependencias:

```bash
npm install
```

2. Copia `.env.example` a `.env.local` y completa:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@test.com
BUSINESS_ADMIN_EMAIL=supervisor@test.com
BUSINESS_ADMIN_CLIENT_SLUG=demo-pollo-loco
DEFAULT_WHATSAPP_NUMBER=+51987088359
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

3. En Supabase, ejecuta las migraciones en este orden:

```txt
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_storage_policies.sql
supabase/migrations/004_client_visual_settings.sql
supabase/migrations/005_orders_tables_payment_proofs.sql
supabase/migrations/006_business_admin_access.sql
supabase/migrations/007_realtime_kitchen_delivery.sql
supabase/migrations/008_client_users_roles_permissions.sql
supabase/migrations/009_growth_modules.sql
```

4. Crea en Supabase Auth un usuario con el correo configurado en `ADMIN_EMAIL`.

5. Para probar la vista del negocio, crea tambien el usuario configurado en `BUSINESS_ADMIN_EMAIL`.

6. Ejecuta el proyecto:

```bash
npm run dev
```

7. Abre:

```txt
http://localhost:3000/login
```

## Rutas principales

```txt
/login
/admin
/admin/kitchen
/admin/orders
/admin/delivery
/admin/promotions
/admin/reservations
/admin/payments
/admin/settings
/admin/users
/menu/demo-pollo-loco
/reservar/demo-pollo-loco
/pedido/[orderId]
```

## Seed demo

Cuando Supabase ya este configurado:

```bash
npm run seed
```

Esto crea el negocio demo `Polleria El Sabor` en:

```txt
/menu/demo-pollo-loco
```

## Referencia de arquitectura

La referencia de crecimiento inspirada en TastyIgniter esta documentada en:

```txt
docs/tastyigniter-reference-roadmap.md
```

## Roles y permisos

SIMI maneja dos niveles:

- `ADMIN_EMAIL`: super administrador global.
- `client_users`: usuarios del negocio con rol y permisos por modulo.

Roles de negocio:

- `business_owner`
- `business_admin`
- `cashier`
- `kitchen`
- `delivery`
- `viewer`

La gestion esta en:

```txt
/admin/users
```

## Deploy en Vercel

1. Crea el proyecto en Vercel conectado al repositorio.
2. Agrega las mismas variables de `.env.local` en Vercel.
3. Cambia `NEXT_PUBLIC_APP_URL` por el dominio final.
4. Ejecuta el deploy.

## Seguridad

- `.env.local` no se commitea.
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en servidor y scripts.
- El super admin se valida comparando el correo autenticado con `ADMIN_EMAIL`.
- El admin del negocio se valida por `admin_email` en Supabase o por las variables de prueba `BUSINESS_ADMIN_EMAIL` y `BUSINESS_ADMIN_CLIENT_SLUG`.
- La pagina publica `/menu/[slug]` no requiere login.
- La pagina publica `/reservar/[slug]` no requiere login y crea reservas pendientes.
