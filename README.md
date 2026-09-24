# Ousia Studio — Web

Web estática (HTML + CSS + JS, sin build) para Ousia Studio. Responsive para celular, tablet y escritorio, bilingüe ES/EN y con Libro de Reclamaciones Virtual.

## Estructura

```
index.html        → estructura de la página
css/styles.css    → estilos (responsive)
js/config.js      → DATOS EDITABLES: contacto, RUC, EmailJS y proyectos del slider
js/i18n.js        → todos los textos en español e inglés
js/main.js        → funcionamiento (slider, filtros, modales, formularios)
content/proyectos.json → los proyectos (se editan desde Pages CMS)
content/estudio.json   → retrato, biografía, cargo y formación de "El estudio" (Pages CMS)
img/              → imágenes (favicon, img/proyectos, img/estudio)
.pages.yml        → configuración de Pages CMS
.github/          → GitHub Action que optimiza las imágenes subidas
render.yaml       → configuración para Render
```

## 1. Completar los datos

Los datos de contacto (WhatsApp, correo, Instagram, dirección, horario, textos y tipos de proyecto) se editan en Pages CMS, sección **Contacto** (`content/contacto.json`). `js/config.js` guarda una copia de respaldo de WhatsApp, correo, Instagram y dirección, que solo se usa si ese archivo no carga, además de la razón social y el RUC (si están vacíos no se muestran).

Los textos que dicen `[X]` o `[...]` están en `js/i18n.js` (plazos, rangos de presupuesto). La biografía se edita en Pages CMS (sección **Estudio**).

## 2. Contenido editable (Pages CMS)

Milagros edita sus proyectos y su perfil desde [Pages CMS](https://app.pagescms.org), sin tocar código. La configuración está en `.pages.yml` y tiene dos secciones:

- **Proyectos** → `content/proyectos.json`. Se pueden crear, editar, reordenar y borrar proyectos; cada uno con varias fotos y planos (se guardan en `img/proyectos/`). El orden de la lista es el orden en la web y la primera foto es la portada.
- **Estudio** → `content/estudio.json`. Retrato (se guarda en `img/estudio/`), biografía, cargo, pie de foto y formación. Si el retrato está vacío se muestra la silueta; si el archivo no carga, la web usa los textos de `js/i18n.js`.
- **Contacto** → `content/contacto.json`. Título y subtítulo, WhatsApp, correo, Instagram, dirección y horario (se ocultan si están vacíos) y los tipos de proyecto del formulario. Si el archivo no carga, la web usa `js/config.js` y `js/i18n.js`.

Otros detalles:

- Qué proyectos salen en el slider de inicio se define en `heroSlides` de `js/config.js` (posición en la lista, empieza en 0).
- Las fotos originales en alta resolución van en `fotos-originales/`, que no se sube al repositorio (`.gitignore`).

### Optimización automática de imágenes

El GitHub Action `.github/workflows/optimizar-imagenes.yml` se ejecuta en cada push que agrega o cambia imágenes en `img/` (por ejemplo, al subirlas desde Pages CMS). Las deja en máx. 2000 px de ancho, JPG calidad ~80 y menos de 400 KB, y hace un commit "Optimizar imágenes".

- Los PNG se convierten a JPG y se actualizan solas las rutas en `content/*.json`. Los WebP se quedan en WebP.
- Las imágenes que ya cumplen los límites no se tocan.
- No entra en bucle: los commits hechos con el token del Action no disparan workflows, el job ignora pushes del bot y, además, en una segunda pasada ya no habría nada que optimizar.
- En GitHub → **Settings → Actions → General → Workflow permissions** debe estar en **Read and write permissions** para que el Action pueda hacer commit.

Render publica dos veces cuando se sube una foto (el commit de Milagros y el de la optimización); es normal.

### Invitar a Milagros a Pages CMS

Ella no necesita cuenta de GitHub; entra con su correo.

1. Entra a [app.pagescms.org](https://app.pagescms.org) con tu cuenta de GitHub e instala la GitHub App de Pages CMS en el repositorio (solo la primera vez).
2. Abre el repositorio y ve a **Collaborators** (en el menú lateral).
3. Escribe el correo de Milagros y dale a **Invite**.
4. Le llega un correo con un enlace para entrar. Desde ahí puede editar contenido e imágenes, pero no la configuración del sitio.

### Guía para Milagros

Entra a [app.pagescms.org](https://app.pagescms.org) con el enlace que te llegó por correo y abre el sitio de Ousia Studio. Cada vez que das **Save**, la web se actualiza sola en unos minutos.

**Subir un proyecto nuevo**
1. En el menú, entra a **Proyectos** y pulsa **Add an entry** (o el botón "+").
2. Llena nombre (español e inglés), categoría, estado, ubicación, año, área y los textos de "El reto" y "La respuesta".
3. En **Fotos o renders**, sube las imágenes. La primera es la portada; puedes arrastrarlas para cambiar el orden. Si tienes planos, súbelos en **Planos**.
4. Arrastra el proyecto en la lista si quieres que aparezca en otra posición, y pulsa **Save**.

No hace falta achicar las fotos antes: el sistema las optimiza solo. Evita subir archivos de más de 20–30 MB.

**Cambiar tu foto**
1. Entra a **Estudio**.
2. En **Retrato**, quita la foto actual y sube la nueva (mejor vertical, proporción 4:5).
3. Pulsa **Save**.

**Editar tu descripción**
1. Entra a **Estudio**.
2. Cambia **Biografía (español)** y **Biografía (inglés)**. Ahí mismo puedes cambiar tu cargo, el pie de foto y tu formación.
3. Pulsa **Save**.

**Cambiar tus datos de contacto**
1. Entra a **Contacto**.
2. Cambia lo que necesites: WhatsApp (51 + número, sin espacios ni +), correo, Instagram (sin @), dirección, horario, los textos de arriba del formulario o los tipos de proyecto. Si dejas vacíos la dirección o el horario, no se muestran.
3. Pulsa **Save**.

**Imagen para compartir en WhatsApp/redes:** `img/og.jpg` (1200 × 630 px). Las etiquetas `og:url`, `og:image` y `twitter:image` de `index.html` usan la URL absoluta de Render; cámbialas cuando conectes el dominio definitivo (hay un comentario ahí).

## 3. Subir a Render

1. Sube esta carpeta a un repositorio de GitHub.
2. En Render: **New → Static Site** y conecta el repositorio.
3. Configura:
   - **Build Command:** déjalo vacío
   - **Publish Directory:** `.`
4. Dale a **Create Static Site**. En un par de minutos queda en `ousia-studio.onrender.com`.

Cada vez que hagas push al repo, Render actualiza la web solo. Los Static Sites de Render no se "duermen" como los Web Services gratis, así que carga rápido siempre.

## 4. Conectar ousiastudio.com

1. En Render, dentro del sitio: **Settings → Custom Domains → Add** y agrega `ousiastudio.com` y `www.ousiastudio.com`.
2. Render te muestra los registros DNS exactos que debes crear (un registro para el dominio raíz y un CNAME para `www`).
3. Créalos en el panel donde compraste el dominio (Cloudflare o Porkbun). Si usas Cloudflare, pon esos registros en modo **DNS only** (nube gris) para que Render pueda emitir el certificado SSL.
4. Espera a que Render marque el dominio como verificado. El HTTPS se activa automático.

## 5. Configurar EmailJS (formulario y Libro de Reclamaciones)

Sin EmailJS la web igual funciona: el formulario de contacto abre WhatsApp con el mensaje armado y el Libro abre la app de correo del usuario con la hoja completa. Pero para que el libro envíe la copia automática al consumidor (lo recomendable), configura EmailJS:

1. Crea una cuenta en emailjs.com (tiene plan gratis).
2. **Email Services → Add Service** y conecta el correo del estudio (Gmail u otro). Copia el **Service ID**.
3. **Account → General** y copia la **Public Key**.
4. Crea 3 plantillas en **Email Templates** y copia el ID de cada una:

**a) Contacto** (llega al estudio)
- To: correo del estudio · Reply-To: `{{reply_to}}`
- Asunto: `Nuevo contacto web — {{nombre}}`
- Cuerpo:
```
Nombre: {{nombre}}
Correo: {{correo}}
Tipo de proyecto: {{tipo}}
Presupuesto: {{presupuesto}}
Mensaje: {{mensaje}}
```

**b) Libro — copia al estudio**
- To: correo del estudio · Reply-To: `{{reply_to}}`
- Asunto: `Hoja de Reclamación {{codigo}} — {{tipo}}`
- Cuerpo:
```
HOJA DE RECLAMACIÓN VIRTUAL
Proveedor: {{proveedor}} {{ruc_texto}}
Domicilio: {{domicilio_proveedor}}

{{resumen}}

Plazo de respuesta: 15 días hábiles.
```

**c) Libro — copia al consumidor**
- To: `{{to_email}}` · Reply-To: `{{correo_estudio}}`
- Asunto: `Tu Hoja de Reclamación {{codigo}} — {{proveedor}}`
- Cuerpo: el mismo de la plantilla (b), más una línea tipo "Hemos recibido tu reclamo y te responderemos en un plazo no mayor a 15 días hábiles."

5. Pega todo en `js/config.js`:

```js
emailjs: {
  publicKey: "tu_public_key",
  serviceId: "service_xxx",
  templateContacto: "template_xxx",
  templateLibroEstudio: "template_xxx",
  templateLibroCliente: "template_xxx"
}
```

6. En EmailJS → **Account → Security**, agrega `ousiastudio.com` en los dominios permitidos para que nadie más use tus llaves.

**Archivo del libro:** las hojas quedan en el correo del estudio. Crea una etiqueta/carpeta "Libro de Reclamaciones" con un filtro por asunto `Hoja de Reclamación` y no borres nada: deben conservarse al menos 2 años.

## 6. Aviso oficial de Indecopi

Entra a consumidor.indecopi.gob.pe/tulibro, elige libro virtual, genera tu hoja con tus datos y descarga el aviso. Si quieres mostrar la imagen oficial del aviso, súbela a `img/` y reemplaza el ícono dentro del botón `id="libroOpen"` en `index.html`.

## Probar en tu compu

Levanta un servidor local (abriendo `index.html` directo no se cargan los proyectos, porque se leen con `fetch`):

```
npx serve .
```
