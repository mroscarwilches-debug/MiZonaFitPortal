# Guía del proyecto — qué hace cada archivo

Este documento explica, en palabras simples, para qué sirve cada carpeta y cada
archivo del repositorio. Si quieres el detalle técnico completo de un tema
(seguridad, despliegue, pagos, etc.), los demás documentos en `docs/` entran
en profundidad — esta guía es el mapa general.

## La idea del proyecto en una frase

Es una página web para el negocio **"El Código del Guerrero — by Mr.
Wilches"**: una landing page pública, más un flujo de registro, pago,
diligenciamiento de información y agenda para quien compra un plan personal.
Hoy vive solo en tu computador (modo local); todavía no está publicada en
internet.

## El árbol de carpetas, explicado

```
warrior-code-portal/
├── app/              → El sitio web y cómo se sirve (Docker + nginx)
├── supabase/         → Las 4 funciones pequeñas que conectan el sitio con Wompi, Sheets y Calendar
├── google-workspace/ → Script que crea los formularios y hojas de cálculo del negocio
├── terraform/        → Los "planos" del servidor en AWS (código, nada creado hoy)
├── tests/            → Pruebas automáticas que revisan que el sitio funcione bien
├── tools/            → Un script que prepara las fotos del sitio
├── docs/             → Toda la documentación técnica
├── .github/          → Revisión automática (CI) cada vez que subes cambios
├── package.json      → Lista de herramientas de prueba que usa el proyecto
├── playwright.config.js → Configuración de las pruebas de navegador
└── README.md         → Presentación general del proyecto
```

---

## 1. `app/` — el sitio web en sí

Esta carpeta contiene todo lo necesario para que el sitio funcione, ya sea en
tu computador o en un servidor real.

- **`app/html/index.html`** — La página completa. Tiene el menú, el hero
  (la sección grande de arriba), el método de entrenamiento, los servicios,
  los planes/precios, el formulario de contacto y el pie de página. Todo el
  contenido visible del sitio vive aquí.
- **`app/html/css/main.css`** — Los estilos: colores, tipografía, cómo se
  acomodan las cosas en pantalla, y cómo se ve en celular vs. computador.
- **`app/html/js/main.js`** — El comportamiento interactivo de la página
  principal: abrir/cerrar el menú en celular, mover el carrusel de planes con
  las flechas, y manejar el envío del formulario de contacto.
- **`app/html/js/validation.js`** — Las reglas que revisan los formularios
  (nombre, correo, mensaje, contraseña) antes de enviarlos, y detectan bots
  con un campo trampa oculto ("honeypot"). Está separado para poder probarlo
  automáticamente sin abrir un navegador (ver `tests/unit/`).
- **`app/html/assets/`** — Imágenes (fotos en formato AVIF/WebP, en varios
  tamaños para que cargue rápido en celular y en pantallas grandes), el ícono
  del sitio (favicon) y la imagen que aparece al compartir el link en redes
  sociales (`og-image.jpg`).
- **`app/html/robots.txt`** — Le dice a Google y otros buscadores que sí
  pueden indexar el sitio.
- **`app/Dockerfile`** — La receta para construir la "caja" (imagen Docker)
  que sirve el sitio: toma un servidor web nginx ya armado y le copia adentro
  los archivos de `app/html/`.
- **`app/docker-compose.yml`** — El comando que arranca esa caja en tu
  computador con un solo paso (`docker compose up --build`). Por defecto usa
  el puerto 8080.
- **`app/nginx.conf`** — La configuración del servidor web: compresión,
  cabeceras de seguridad, caché, y qué sitios externos puede contactar el
  navegador (Supabase, para el login y los datos del cliente).

## 2. Login, pago, valoración y agenda (el flujo del cliente)

Explicado a fondo en `docs/AUTH_AND_AGENDAMIENTO.md` — aquí, el resumen de
para qué sirve cada archivo:

- **`app/html/signup.html` / `login.html`** — Crear cuenta e iniciar sesión.
- **`app/html/checkout.html`** — Resume el plan elegido y redirige a pagar
  con Wompi.
- **`app/html/payment-confirmation.html`** — A donde Wompi devuelve al
  cliente tras pagar; confirma el estado real del pago.
- **`app/html/dashboard.html`** — El panel del cliente: muestra el siguiente
  paso según su estado (pagar, diligenciar valoración, agendar entrevista,
  ver su guía).
- **`app/html/schedule.html`** — Agenda la primera entrevista, mostrando
  solo horarios realmente libres (6–8 a.m. / 7–9 p.m.) en el Google Calendar
  real del dueño.
- **`app/html/js/supabase-client.js`** — Conexión al proyecto de Supabase
  (login). **`auth.js`** — registrarse/entrar/salir/verificar sesión.
- **`app/html/js/checkout.js`, `dashboard.js`, `schedule.js`, `signup.js`,
  `login.js`, `payment-confirmation.js`, `client-status-client.js`** — la
  lógica de cada página de arriba.
- **`app/html/js/trm.js`** — consulta la tasa de cambio oficial del día
  (dólar a peso colombiano) para que el cliente vea el precio en USD pero se
  le cobre en COP al valor real de ese momento.
- **`app/html/js/config.js`** (no se sube a git — cada quien pone sus propias
  llaves) **/ `config.example.js`** (la plantilla, sí se sube) — todas las
  llaves públicas del sitio: Supabase, Wompi, links de los formularios.
- **`supabase/functions/`** — Las 4 funciones que sí corren en un servidor
  (de Supabase, no propio): confirmar el pago de Wompi, responder el estado
  del cliente, mostrar horarios libres y agendar la entrevista en el
  Calendar real.
- **`google-workspace/setup-forms.gs`** — Un script que, al correrlo una vez
  en la cuenta de Google del negocio, crea automáticamente los 2 formularios
  (valoración física/nutricional y seguimiento mensual) con todos sus campos,
  y sus hojas de respuesta.

## 3. `terraform/` — el plano del servidor en AWS (solo código, hoy nada existe)

Terraform es una herramienta que describe infraestructura como si fuera una
receta de cocina: en vez de crear el servidor a mano en la consola de AWS,
se describe en archivos `.tf` y una herramienta lo construye. **Hoy nada de
esto está creado** — es solo el plano, listo para usarse el día que se decida
publicar el sitio.

- **`terraform/ec2.tf`** — Describe el servidor (una máquina virtual EC2 en
  AWS): qué sistema operativo usa, qué hace al encender (instalar Docker,
  descargar el sitio desde GitHub y arrancarlo).
- **`terraform/security_group.tf`** — Describe el "portón" del servidor: qué
  puertos están abiertos al público (80 y 443, para la página web) y cuál
  está restringido solo a tu IP (22, para poder entrar por SSH).
- **`terraform/variables.tf`** — Los valores que se pueden ajustar sin tocar
  el resto del código: tu IP de administrador, si el sitio es público o
  privado, el tamaño del servidor, etc.
- **`terraform/outputs.tf`** — Lo que Terraform te muestra después de crear
  el servidor: su dirección IP, la URL del sitio y el comando exacto para
  conectarte por SSH.
- **`terraform/provider.tf`** — Le dice a Terraform en qué región de AWS
  trabajar y dónde guardar su "memoria" (el estado) de forma segura, en un
  bucket S3.
- **`terraform/.terraform/`, `terraform.tfstate*`** — Archivos internos que
  genera Terraform al ejecutarse (no se editan a mano).

## 4. `tests/` — pruebas automáticas

Antes de publicar cualquier cambio, estas pruebas revisan que nada se haya
roto.

- **`tests/unit/validation.test.js`** — Prueba las reglas de
  `validation.js` una por una: ¿rechaza un nombre vacío? ¿acepta un correo
  válido? ¿detecta el bot? Son rápidas y no necesitan abrir un navegador.
- **`tests/e2e/site.spec.js`** — Prueba el sitio completo como lo haría una
  persona real, abriendo un navegador: título correcto, menú de celular,
  carrusel de planes, formulario con errores en español, redirecciones de
  login, y accesibilidad (con axe).
- **`playwright.config.js`** — Configura cómo se ejecutan esas pruebas de
  navegador: contra qué dirección (`BASE_URL`), y en qué tamaños de pantalla
  (computador y celular).

## 5. `tools/optimize-images.mjs` — preparación de fotos

Un script que toma las fotos originales (que viven fuera de este repositorio,
en el computador del dueño del sitio) y genera versiones livianas en varios
tamaños y formatos (AVIF y WebP) para que el sitio cargue rápido. También
genera la imagen que se ve al compartir el link en redes sociales. Se corre
manualmente cuando se quiere cambiar una foto — ver
`docs/LOCAL_DEVELOPMENT.md`.

## 6. `.github/workflows/ci.yml` — revisión automática

Cada vez que subes cambios a GitHub (push o pull request), esto se ejecuta
solo, sin que nadie lo tenga que lanzar a mano:

1. Corre las pruebas unitarias (`tests/unit`).
2. Construye la imagen Docker del sitio y la levanta, revisando que responda
   bien y que las cabeceras de seguridad estén presentes.
3. Corre las pruebas de navegador (`tests/e2e`) contra esa imagen.
4. Valida que los archivos de Terraform estén bien escritos (sin crear nada
   en AWS ni necesitar credenciales).

**Importante:** este proceso automático nunca publica el sitio ni toca AWS.
Solo avisa si algo se rompió. Publicar el sitio es un paso manual — ver
`docs/DEPLOYMENT.md`.

## 7. Archivos en la raíz del proyecto

- **`package.json`** — La lista de herramientas de desarrollo (Vitest para
  pruebas unitarias, Playwright + axe para pruebas de navegador y
  accesibilidad) y los atajos para correrlas (`npm test`, etc.).
- **`package-lock.json`** — Registro exacto de versiones de esas
  herramientas, para que siempre se instale lo mismo.
- **`README.md`** — La puerta de entrada al proyecto: qué es, cómo correrlo
  en un solo comando, y un índice hacia el resto de la documentación.
- **`warrior-code-portal.code-workspace`** — Configuración de espacio de
  trabajo para el editor Visual Studio Code.
- **`.gitignore`** — Lista de archivos que Git debe ignorar (no subir al
  repositorio), como carpetas temporales, resultados de pruebas, o
  `config.js` (que contiene tus propias llaves, distintas a las de otra
  persona que clone el repo).

## 8. `docs/` — el resto de la documentación

Cada archivo cubre un tema específico a fondo:

| Archivo | De qué habla |
|---|---|
| `AUTH_AND_AGENDAMIENTO.md` | Login, pago, valoración, agenda: cómo funciona y cómo configurarlo paso a paso |
| `ASSESSMENT.md` | Diagnóstico inicial del proyecto (cómo estaba antes de mejorarlo) |
| `ARCHITECTURE.md` | Por qué se eligió cada pieza técnica y qué opciones de hosting se compararon |
| `LOCAL_DEVELOPMENT.md` | Cómo correr el sitio y las pruebas en tu computador |
| `DEPLOYMENT.md` | Cómo publicar el sitio en AWS, paso a paso |
| `ROLLBACK.md` | Qué hacer si algo sale mal después de publicar, para volver atrás |
| `BACKUP.md` | Qué se respalda, dónde, y cómo restaurarlo si se pierde algo |
| `PRODUCTION_CHECKLIST.md` | Lista de tareas pendientes antes de publicar el sitio de verdad |
| `SECURITY.md` | Qué medidas de seguridad existen y qué credenciales hay que cuidar |
| `PAYMENTS.md` | Cómo funciona el cobro de los planes en línea (Wompi, en modo de pruebas) |

Todos estos documentos ya fueron reescritos en un lenguaje más simple,
manteniendo exactos los comandos y pasos técnicos.
