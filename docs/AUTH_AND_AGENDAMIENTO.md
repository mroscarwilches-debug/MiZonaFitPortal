# Login, Pago, Valoración y Agenda — cómo funciona y cómo configurarlo

Este documento explica el nuevo módulo del sitio: registro de clientes, pago,
diligenciamiento de la valoración física/nutricional, agenda de la primera
entrevista, y activación de la guía de entrenamiento/nutrición según el plan
comprado. Está pensado para que tú (el dueño) puedas configurarlo paso a paso,
sin depender de que alguien más lo haga por ti.

## El flujo completo

1. El cliente hace clic en un plan personal (Consultoría Express, Protocolo
   Estándar o Protocolo Black) en la página principal → llega a
   `signup.html` y crea su cuenta (nombre, correo, contraseña).
2. Lo llevamos a `checkout.html` → paga con Wompi (en modo sandbox por
   ahora).
3. Wompi confirma el pago a través de un webhook seguro (nunca desde el
   navegador) → el estado de pago queda registrado en tu hoja de cálculo.
4. En `dashboard.html`, el cliente ve la guía de toma de medidas y el link
   (ya prellenado con su nombre y correo) al formulario de "Valoración Física
   y Nutricional".
5. Al terminarlo, el panel habilita `schedule.html`: solo se muestran
   horarios de 6–8 a.m. y 7–9 p.m., y solo en los días que tu Google Calendar
   real tenga libres. Al confirmar, se crea el evento en tu calendario con un
   link de Google Meet, y se le invita al cliente por correo.
6. Después de la llamada, tú armas la guía de entrenamiento/nutrición y
   pegas el link en la columna "Link de guía" de la hoja "Estado de
   Cliente" — el panel del cliente lo detecta automáticamente.
7. Si el plan es **Protocolo Black**, el panel además avisa que tú
   contactarás al cliente para acordar el horario fijo de sus 3 clases
   semanales — eso se agenda manualmente por ahora (no está automatizado en
   esta primera versión).
8. Cada mes, el panel invita a diligenciar el formulario de "Seguimiento
   Mensual" (también prellenado).

## Dónde vive cada dato

Todo lo operativo vive en **Google Sheets/Forms/Calendar**, bajo un perfil de
Google dedicado al negocio (nunca en las cuentas de terceros que tenían las
hojas anteriores). El sitio solo usa **Supabase** para el login — no hay
ninguna base de datos propia con la información de los clientes.

| Herramienta | Para qué |
|---|---|
| Google Form "Valoración Física y Nutricional" | Captura medidas, hábitos, salud, objetivos |
| Google Form "Seguimiento Mensual" | Captura el progreso mensual |
| Hoja "Registro Inicial" | Respuestas del formulario de valoración (Google la administra sola) |
| Hoja "Registro de Avances" | Respuestas del seguimiento mensual |
| Hoja "Estado de Cliente" (pestaña nueva, dentro del mismo archivo que "Registro Inicial") | Estado de pago, plan, entrevista agendada, link de guía — la única hoja que el sitio actualiza |
| Google Calendar (del dueño) | Disponibilidad real para la entrevista — bloquear/desbloquear ahí ajusta lo que el sitio ofrece |
| Supabase Auth | Solo login/cuenta — nada más |

**Por qué "Estado de Cliente" es una pestaña aparte:** Google Forms siempre
agrega una fila nueva por cada respuesta — nunca actualiza una fila
existente. Como el pago normalmente llega *antes* de que el cliente
diligencie el formulario, no hay una fila de "Registro Inicial" que
actualizar en ese momento. Por eso el estado de pago/entrevista/guía vive en
su propia pestaña, indexada por correo, que el sitio sí puede actualizar.

## Paso 1 — Crea el perfil de Google del negocio

Crea una cuenta de Google nueva, dedicada al negocio (no una personal ni una
de terceros). Todo lo siguiente se hace con sesión iniciada en esa cuenta.

## Paso 2 — Genera los formularios y hojas con el script

1. Ve a [script.google.com](https://script.google.com).
2. Nuevo proyecto → pega todo el contenido de `google-workspace/setup-forms.gs`.
3. En el menú superior, selecciona la función `setupAll` → Ejecutar.
4. Acepta los permisos (son solo sobre Forms/Sheets de esta misma cuenta).
5. Abre "Ejecuciones" (o Ver → Registros) y copia lo que imprime: las URLs de
   cada formulario, la hoja de cálculo, y una **URL de ejemplo prellenada**
   para cada uno — de ahí sale el `entry.<id>` de "Nombre" y "Correo" que
   necesitas para `config.js` (búscalos en la URL de ejemplo, son los
   parámetros `entry.NUMERO=...`).
6. Sube el PDF de toma de medidas al Drive de esta misma cuenta, compártelo
   como "Cualquiera con el link puede ver", y guarda el link.

## Paso 3 — Cuenta de servicio de Google (para que el sitio pueda leer/escribir)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) con la
   cuenta nueva del negocio → crea un proyecto.
2. Habilita **Google Sheets API** y **Google Calendar API** (Biblioteca de
   APIs → buscar cada una → Habilitar).
3. Ve a "Credenciales" → "Crear credenciales" → "Cuenta de servicio". Dale
   un nombre (por ejemplo `sitio-web`).
4. Entra a la cuenta de servicio creada → pestaña "Claves" → "Agregar
   clave" → JSON. Descarga el archivo — contiene `client_email` y
   `private_key`. Estos dos valores van como **secrets** de las Edge
   Functions (nunca en el repositorio).
5. Comparte la hoja "Registro Inicial - El Código del Guerrero" (la que
   contiene también la pestaña "Estado de Cliente") con el correo de la
   cuenta de servicio, con permiso de **Editor**.
6. Comparte tu Google Calendar con esa misma cuenta de servicio, con
   permiso de **"Hacer cambios en los eventos"** (Configuración de tu
   calendario → Compartir con personas específicas).

## Paso 4 — Supabase (solo para login)

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En Configuración → API: copia la **Project URL** y la **anon public
   key** → van en `app/html/js/config.js`.
3. En Authentication → Providers → Email: si quieres que el registro sea lo
   más fluido posible (recomendado, ver la sección de orden del flujo),
   puedes desactivar "Confirm email" — así el cliente pasa directo de
   registrarse a pagar, sin esperar un correo de confirmación.
4. En Authentication → URL Configuration: agrega la URL de tu sitio (o
   `http://localhost:8080` mientras pruebas localmente) a las "Redirect
   URLs" permitidas.

## Paso 5 — Wompi (sandbox)

1. Crea una cuenta sandbox en [Wompi](https://wompi.co).
2. Copia la **llave pública de pruebas** (`pub_test_...`) → va en
   `config.js`.
3. En la configuración de eventos/webhooks de Wompi, apunta la URL de
   eventos a tu función desplegada:
   `https://<tu-proyecto>.supabase.co/functions/v1/wompi-webhook`.
4. Copia el **secreto de eventos** (events secret) — va como secret de la
   función `wompi-webhook`, nunca en el repositorio ni en `config.js`.

## Paso 6 — Configurar y desplegar las Edge Functions

Con el [CLI de Supabase](https://supabase.com/docs/guides/cli) instalado:

```bash
supabase login
supabase link --project-ref <tu-project-ref>

# Secrets (nunca se commitean; se guardan cifrados en Supabase)
supabase secrets set \
  GOOGLE_SERVICE_ACCOUNT_EMAIL="sitio-web@tu-proyecto.iam.gserviceaccount.com" \
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" \
  REGISTRO_INICIAL_SHEET_ID="<ID de la hoja, está en su URL>" \
  OWNER_CALENDAR_ID="<tu correo de la cuenta nueva, o el ID del calendario>" \
  WOMPI_EVENTS_SECRET="<secreto de eventos de Wompi>" \
  SITE_ORIGIN="http://localhost:8080"

supabase functions deploy wompi-webhook
supabase functions deploy client-status
supabase functions deploy booking-availability
supabase functions deploy booking-create
```

Actualiza `SITE_ORIGIN` a la URL real del sitio una vez esté publicado
(mientras tanto, `http://localhost:8080` sirve para probar en local).

## Paso 7 — Completa `config.js`

Copia `app/html/js/config.example.js` a `app/html/js/config.js` (este último
está en `.gitignore`, nunca se sube al repositorio) y llena:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (paso 4).
- `WOMPI_PUBLIC_KEY` (paso 5).
- `MEASUREMENT_GUIDE_URL` (paso 2).
- `VALORACION_FORM` y `SEGUIMIENTO_FORM`: la URL base de cada formulario
  (`.../viewform`, sin parámetros) y los `entry.<id>` de Nombre/Correo
  (paso 2).

## Cómo se maneja la moneda: USD mostrado, COP cobrado según la TRM

Los precios se muestran siempre en **USD** ($25/$90/$115 — un solo lugar,
`PLANS` en `app/html/js/config.js`, usado por `index.html`, `signup.html` y
`checkout.html`). Como Wompi cobra en pesos colombianos, `checkout.js`
convierte el precio a COP justo en el momento en que el cliente hace clic en
"Pagar", usando la TRM oficial del día (dato abierto del gobierno
colombiano, `app/html/js/trm.js`). Si esa fuente no responde, se usa una
tasa de referencia fija (`FALLBACK_USD_TO_COP` en `config.js`) para que el
pago nunca se bloquee por eso — solo actualízala de vez en cuando para que
siga siendo razonable. El cliente ve el estimado en COP antes de pagar, y
Wompi confirma el monto exacto cobrado.

## Seguridad: HTTPS ya no es opcional

Antes de este módulo, el sitio en producción podía quedarse en HTTP porque no
manejaba contraseñas ni pagos (ver docs/SECURITY.md). Ahora que existe login
y pago, **el sitio debe tener HTTPS antes de publicarse de verdad** — ver la
sección "HTTPS / custom domain" de docs/DEPLOYMENT.md.

## Probarlo todo en sandbox (guía paso a paso)

1. Levanta el sitio localmente (`docker compose up --build` en `app/`).
2. Regístrate desde `index.html` eligiendo un plan.
3. En `checkout.html`, paga con una
   [tarjeta de prueba de Wompi](https://docs.wompi.co/docs/en/pruebas) (sandbox).
4. Confirma en tu hoja "Estado de Cliente" que aparece la fila con "Estado
   de pago = approved".
5. En `dashboard.html`, diligencia el formulario de valoración prellenado.
6. Agenda una llamada desde `schedule.html` y confirma que aparece en tu
   Google Calendar real, con el cliente invitado y un link de Meet.
7. Pega manualmente un link cualquiera en la columna "Link de guía" de
   "Estado de Cliente" y confirma que `dashboard.html` lo muestra al
   recargar.

## Credenciales — dónde vive cada una

| Credencial | Dónde vive | Notas |
|---|---|---|
| Supabase anon key, Supabase URL | `app/html/js/config.js` (gitignored) | Públicas por diseño, protegidas por Supabase Auth |
| Wompi public key (sandbox) | `app/html/js/config.js` | Pública por diseño |
| Google service account (`client_email` + `private_key`) | Secrets de Supabase Edge Functions | Nunca en el repo ni en el navegador |
| Wompi events secret | Secret de la función `wompi-webhook` | Nunca en el repo ni en el navegador |
| `REGISTRO_INICIAL_SHEET_ID`, `OWNER_CALENDAR_ID` | Secrets de las Edge Functions | No son secretos por naturaleza, pero se guardan igual junto a los demás por simplicidad |
