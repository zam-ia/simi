# SIMI - Variables para Vercel

Configura estas variables en Vercel, dentro de Project Settings -> Environment Variables.

## Obligatorias

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_PUBLIC_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_SECRET
NEXT_PUBLIC_APP_URL=https://TU-DOMINIO-DE-VERCEL.vercel.app
ADMIN_EMAIL=admin@test.com
```

## Recomendadas para prueba

```env
BUSINESS_ADMIN_EMAIL=supervisor@test.com
BUSINESS_ADMIN_CLIENT_SLUG=pollo-loco
DEFAULT_WHATSAPP_NUMBER=+51987088359
```

## Opcional para futuro

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

No llenes `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` todavia si no vas a usar Google Maps. La Fase 2 funciona con estados manuales y Supabase Realtime.

## Supabase antes del deploy

Ejecuta estas migraciones en orden:

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
supabase/migrations/010_client_visual_settings_sync.sql
supabase/migrations/011_menu_hero_and_promo_cta.sql
supabase/migrations/012_menu_category_images.sql
```

La migracion `009` activa los modulos de crecimiento: zonas de delivery, promociones, reservas, metodos de pago y estructura inicial para combos/modificadores. Las migraciones `010`, `011` y `012` agregan ajustes visuales, portada/promocion y fotos de categorias.

## Usuarios de prueba

Crea estos usuarios en Supabase Auth:

```txt
admin@test.com
supervisor@test.com
```

`admin@test.com` entra como super administrador por `ADMIN_EMAIL`.

`supervisor@test.com` entra como administrador del negocio demo por `BUSINESS_ADMIN_EMAIL` mientras se usa el fallback. Cuando la migracion `008` este aplicada, tambien puedes gestionarlo desde `/admin/users`.
