# Guia Upstash para SIMI - primer uso

Esta guia parte desde una cuenta de Upstash recien creada. El objetivo es activar la proteccion compartida contra demasiadas solicitudes en `simi`, sin guardar pedidos ni datos importantes en Redis.

## Resultado esperado

Al terminar:

- Upstash tendra una base Redis exclusiva para los limites de SIMI.
- Vercel tendra dos variables secretas.
- Produccion y staging usaran la misma proteccion distribuida.
- Si Upstash falla o tarda demasiado, SIMI continuara usando la proteccion local de respaldo.

## Parte 1 - crear la base en Upstash

1. Entra a [console.upstash.com](https://console.upstash.com/).
2. En el menu principal elige **Redis**.
3. Pulsa **Create Database** o **+ Create Database**.
4. En **Database Name** escribe `simi-rate-limit-production`.
5. Elige una base **Regional**.
6. En **Primary Region** elige `N. Virginia / us-east-1` mientras Vercel siga usando su region predeterminada de Estados Unidos. Si mas adelante SIMI cambia de region, se revisa esta eleccion.
7. Para comenzar, selecciona el plan gratuito o de pago por uso disponible. No actives complementos costosos todavia.
8. Mantén las opciones de seguridad predeterminadas y crea la base.

Upstash indica oficialmente que la base se crea desde **Redis > Create Database**, solicitando nombre y region principal: [Getting Started](https://upstash.com/docs/redis/overall/getstarted).

## Parte 2 - copiar las credenciales correctas

1. Abre la base `simi-rate-limit-production`.
2. Busca el bloque **REST API** o **Connect**.
3. Localiza exactamente estas dos variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Copia la URL HTTPS completa de la primera variable.
5. Copia el **Token estándar** de la segunda variable.

No uses:

- `UPSTASH_REDIS_REST_READ_ONLY_TOKEN`, porque SIMI necesita escribir contadores temporales.
- La contraseña TCP o una URL que comience con `redis://`.
- Un token pegado directamente dentro del codigo.

El token estandar permite escrituras y debe mantenerse como secreto. Upstash recomienda guardarlo mediante variables de entorno: [REST API y seguridad](https://upstash.com/docs/redis/features/restapi).

## Parte 3 - agregar las variables en Vercel

1. Abre [vercel.com](https://vercel.com/) e ingresa al equipo `zam-ias-projects`.
2. Abre el proyecto **simi**. No selecciones `simi-web` ni `simi-api` para este paso.
3. Entra a **Settings**.
4. Abre **Environment Variables**.
5. Crea la primera variable:
   - Name: `UPSTASH_REDIS_REST_URL`
   - Value: la URL HTTPS copiada desde Upstash.
   - Environments: marca **Production** y **Preview**.
6. Crea la segunda variable:
   - Name: `UPSTASH_REDIS_REST_TOKEN`
   - Value: el token estandar copiado desde Upstash.
   - Environments: marca **Production** y **Preview**.
7. Guarda ambas variables.

No agregues `NEXT_PUBLIC_` a estos nombres. Eso expondria el token al navegador.

Vercel cifra las variables y permite asignarlas por ambiente. Los cambios solo afectan despliegues nuevos: [Variables de entorno en Vercel](https://vercel.com/docs/environment-variables).

## Parte 4 - volver a desplegar

Las variables no se incorporan a versiones que ya estaban publicadas.

1. En Vercel abre **Deployments**.
2. Busca el despliegue mas reciente de `main`.
3. Abre el menu de tres puntos y elige **Redeploy**.
4. Repite el proceso con el despliegue mas reciente de la rama `staging`.
5. Espera a que ambos indiquen **Ready**.

Tambien se puede generar un nuevo despliegue enviando un commit a cada rama.

## Parte 5 - comprobar que funciona

Abre PowerShell y ejecuta:

```powershell
curl.exe -s -i -X POST https://simi-peru.vercel.app/api/monitoring/client-error -H "Content-Type: application/json" -d "{}" | Select-String -Pattern "HTTP/|x-simi-ratelimit-source|x-ratelimit-limit|x-ratelimit-remaining"
```

El resultado correcto incluye:

```txt
X-Simi-Ratelimit-Source: upstash
```

Un estado `400 Bad Request` en esta prueba es normal: se envia un evento vacio intencionalmente. Lo importante es que el encabezado indique `upstash`.

Luego abre la base en Upstash. Las metricas y comandos comenzaran a aparecer despues de las primeras solicitudes.

## Si aparece `memory`

Revisa en este orden:

1. Los nombres deben ser exactamente `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
2. La URL debe comenzar con `https://`.
3. El token debe ser el estandar, no el de solo lectura.
4. Ambas variables deben estar habilitadas para Production y Preview.
5. Debes hacer un despliegue nuevo despues de guardar las variables.
6. Confirma que estas editando el proyecto Vercel `simi`.

Si todo esta correcto y sigue apareciendo `memory`, SIMI esta usando el respaldo porque Upstash no respondio en el tiempo esperado. Los pedidos continuan funcionando.

## Desarrollo local opcional

Para probar Upstash en la computadora, agrega estas dos lineas a `.env.local` y reinicia el servidor:

```env
UPSTASH_REDIS_REST_URL=https://TU-ENDPOINT.upstash.io
UPSTASH_REDIS_REST_TOKEN=TU_TOKEN_ESTANDAR
```

`.env.local` no debe subirse a GitHub.

## Que informacion puedes compartir sin riesgo

Puedes enviar:

- una captura donde los valores esten ocultos;
- los nombres de las variables;
- los ambientes seleccionados;
- el estado del despliegue;
- el resultado de la comprobacion sin incluir tokens.

No compartas el token completo por chat, correo, capturas o GitHub. Si se expone accidentalmente, restablece las credenciales de la base en Upstash y actualiza Vercel.
