# Configuración de Google · XV años de Amellali

Guía para dejar funcionando las confirmaciones, el croquis de mesas y la subida de fotos.
Todo es gratis y toma unos **20 minutos**. Solo se hace **una vez**.

> **¿Qué hace cada pieza?**
> - **Hoja de Google** → guarda invitados, mesas y la lista de fotos.
> - **Apps Script** (dentro de la hoja) → es el "servidor": recibe las confirmaciones y las fotos.
> - **Token de GitHub** → permiso para que el Apps Script guarde la copia de las fotos en el repositorio.
> - **`ajustes.js`** → el único archivo donde se pega la dirección del Apps Script; todas las páginas la leen de ahí.

---

## Paso 1 · Crear la hoja de cálculo

1. Entra a [sheets.google.com](https://sheets.google.com) con la cuenta de Google que va a administrar el evento
   (en el Drive de **esa** cuenta se va a crear la carpeta de fotos; tiene 15 GB gratis).
2. Crea una **hoja en blanco** y ponle de nombre, por ejemplo, `XV Amellali – Invitados`.
3. **No crees pestañas ni encabezados**: `Invitados`, `Fotos` y `Croquis` se crean solas.

## Paso 2 · Pegar el Apps Script

1. En la hoja: menú **Extensiones → Apps Script**.
2. Arriba a la izquierda, cambia el nombre del proyecto (ej. `XV Amellali`).
3. Borra todo el código que aparece en `Código.gs`.
4. Abre [google-apps-script.gs en GitHub](https://github.com/Lafalh/xv-amellali/blob/main/google-apps-script.gs),
   presiona el botón **Copy raw file** (ícono de copiar, arriba a la derecha del código) y pégalo en el editor.
5. Guarda con el ícono del disco (o `Ctrl + S`).

## Paso 3 · Zona horaria

1. En el editor de Apps Script, abre **Configuración del proyecto** (ícono de engrane, a la izquierda).
2. En **Zona horaria** elige **(GMT-06:00) Ciudad de México**.

## Paso 4 · Crear el token de GitHub (para la copia de las fotos)

> Si te lo saltas, todo funciona igual, pero las fotos solo se guardarán en Drive y el panel
> **Fotos** no podrá mostrar las miniaturas.

1. Entra a GitHub con la cuenta **Lafalh**.
2. Foto de perfil (arriba a la derecha) → **Settings** → hasta abajo a la izquierda **Developer settings**
   → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
3. Llénalo así:
   - **Token name:** `xv-amellali-fotos`
   - **Expiration:** *Custom* → una fecha después del evento (ej. **31 de diciembre de 2026**).
   - **Repository access:** *Only select repositories* → elige **`Lafalh/xv-amellali`**.
   - **Permissions** → pestaña **Repositories** → botón **+ Add permissions** → marca **Contents**.
     En la fila nueva **Contents**, cambia **Access** de *Read-only* a **Read and write**.
     **Metadata** se queda en *Read-only* (GitHub lo pone solo). No agregues nada en la pestaña **Account**.

     | Permiso | Access |
     |---|---|
     | Metadata | Read-only |
     | **Contents** | **Read and write** |
4. **Generate token** y **copia** el token (empieza con `github_pat_…`). GitHub solo lo muestra una vez.

> ⚠️ El token es como una contraseña: **no lo pegues en ningún HTML ni lo mandes por WhatsApp**.
> Solo va en el paso 5.

## Paso 5 · Guardar el token en el Apps Script

1. En **Configuración del proyecto** (engrane), baja a **Propiedades del script** → **Agregar propiedad del script**.
2. **Propiedad:** `GITHUB_TOKEN` · **Valor:** el token del paso 4.
3. **Guardar propiedades del script**.

Opcionales (no hace falta ponerlas, ya tienen buen valor por defecto):

| Propiedad | Para qué | Por defecto |
|---|---|---|
| `GITHUB_REPO` | Repositorio donde van las copias | `Lafalh/xv-amellali` |
| `GITHUB_RAMA` | Rama de las fotos (se crea sola) | `fotos` |
| `DRIVE_CARPETA` | Id de una carpeta de Drive ya existente | se crea sola: *XV Amellali · Fotos de invitados* |

## Paso 6 · Publicar el Apps Script como aplicación web

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En **Seleccionar tipo** (engrane) elige **Aplicación web**.
3. Llénalo así:
   - **Descripción:** `v1`
   - **Ejecutar como:** **Yo** (tu cuenta)
   - **Quién tiene acceso:** **Cualquier usuario** ← **imprescindible**; si queda en "Solo yo", nada se guarda.
4. **Implementar** → **Autorizar acceso** → elige tu cuenta.
5. Google va a decir *"Google no verificó esta app"*. Es normal (el script es tuyo):
   **Configuración avanzada → Ir a XV Amellali (no seguro) → Permitir**.
   Te pide permiso para la hoja, Google Drive (fotos) y servicios externos (GitHub).
6. Copia la **URL de la aplicación web** (termina en **`/exec`**).

## Paso 7 · Pegar la URL en `ajustes.js`

Desde el navegador, sin instalar nada:

1. Abre [ajustes.js para editar en GitHub](https://github.com/Lafalh/xv-amellali/edit/main/ajustes.js).
2. Reemplaza `PEGA_AQUI_LA_URL_DE_TU_APPS_SCRIPT` por tu URL **dejando las comillas**:
   ```js
   urlAppsScript: "https://script.google.com/macros/s/AKfy…/exec"
   ```
3. **Commit changes…** → **Commit changes**.
4. Espera **1–2 minutos** a que GitHub Pages se actualice.

(Si lo editas en la computadora: guarda el archivo y haz `git add ajustes.js`, `git commit` y `git push`.)

## Paso 8 · Probar que todo funciona

Haz las pruebas en una **ventana de incógnito** (así tu celular no se queda "recordando" una confirmación de prueba).

| # | Prueba | Qué debe pasar |
|---|---|---|
| 1 | Abre tu URL `/exec` con `?prueba=1` al final | Dice **"✅ Fila de prueba agregada"** y en la hoja aparece la pestaña **Invitados** con "PRUEBA". |
| 2 | Abre la [invitación](https://lafalh.github.io/xv-amellali/invitacion.html) y confirma como "Prueba" | Aparece en el panel [Invitados](https://lafalh.github.io/xv-amellali/confirmacion.html) y en la hoja. |
| 3 | Abre [subir-fotos.html](https://lafalh.github.io/xv-amellali/subir-fotos.html) y sube una foto | En el panel [Fotos](https://lafalh.github.io/xv-amellali/fotos.html) sale la miniatura; en Drive aparece la carpeta *XV Amellali · Fotos de invitados*; en GitHub aparece la rama `fotos`. |
| 4 | Abre el [croquis](https://lafalh.github.io/xv-amellali/croquis-mesas.html), sienta a "Prueba" en una mesa y presiona **Guardar** | Dice "Acomodo guardado" y en la hoja aparece la pestaña **Croquis**. |

**Limpiar las pruebas:**
- Invitados de prueba: en el panel **Invitados** usa el bote de basura (o en la hoja pon **Estado = Eliminado**).
- Foto de prueba: borra su fila en la pestaña **Fotos** y el archivo de la carpeta de Drive.
  La copia en el repo se borra en GitHub: rama `fotos` → carpeta `fotos/…` → archivo → ícono de bote.

## Actualización: eliminar fotos desde el panel

El panel **Fotos** ahora tiene un botón para eliminar cada foto. Para que funcione, el Apps Script
necesita la versión nueva del código:

1. Copia otra vez [google-apps-script.gs](https://github.com/Lafalh/xv-amellali/blob/main/google-apps-script.gs)
   (**Copy raw file**), reemplaza todo el código del editor y **guarda**.
2. **Implementar → Gestionar implementaciones → lápiz (App web) → Versión: Nueva versión → Implementar.**

Al eliminar una foto, el original va a la **papelera de Google Drive** (se puede recuperar durante 30 días),
la copia se quita de la rama `fotos` y en la pestaña **Fotos** la fila queda con **Estado = Eliminada**
(si borras esa palabra, la foto vuelve a aparecer en el panel).

Los paneles también se **actualizan solos cada 20 segundos** (indicador "En vivo"); ya no hace falta recargar.

## Si después cambias el código del Apps Script

Guardar no basta. Ve a **Implementar → Gestionar implementaciones → lápiz (editar) → Versión: Nueva versión → Implementar**.
La URL `/exec` **no cambia**, así que `ajustes.js` se queda igual.

---

## Links del evento

| Para quién | Página | Link |
|---|---|---|
| **Invitados** | Invitación (la que se manda) | https://lafalh.github.io/xv-amellali/invitacion.html |
| Invitados | Subir fotos (el QR lleva aquí) | https://lafalh.github.io/xv-amellali/subir-fotos.html |
| Invitados | Su lugar (link personal, se genera solo) | `mi-confirmacion.html?id=…` |
| Organizadores | Dedicatorias | https://lafalh.github.io/xv-amellali/ |
| Organizadores | Invitados (lista, mesas, WhatsApp) | https://lafalh.github.io/xv-amellali/confirmacion.html |
| Organizadores | Croquis de mesas | https://lafalh.github.io/xv-amellali/croquis-mesas.html |
| Organizadores | Fotos + **Imprimir QR para las mesas** | https://lafalh.github.io/xv-amellali/fotos.html |

> Los paneles de organizadores **no tienen contraseña**: no compartas esos links.

## Problemas comunes

| Lo que ves | Qué revisar |
|---|---|
| "Falta configurar CONFIG.urlConfirmaciones…" | `ajustes.js` todavía tiene `PEGA_AQUI…`, o GitHub aún no se actualiza: espera 2 minutos y recarga. |
| "No se pudo conectar" o te pide iniciar sesión (abrir la URL `/exec` da **403 / Prohibido** o una página de Google para entrar) | En **Implementar → Gestionar implementaciones → lápiz**, **Quién tiene acceso** debe ser exactamente **"Cualquier usuario"** — **no** "Solo yo" ni "Cualquier usuario con una cuenta de Google". Elige **Versión: Nueva versión** → Implementar (la URL no cambia). Si la opción "Cualquier usuario" no aparece, la cuenta es de empresa/escuela (Google Workspace) con eso bloqueado: usa una cuenta @gmail.com. |
| Abrir la URL `/exec` dice **"No se encontró la función de la secuencia de comandos: doGet"** | Se implementó la versión con el `myFunction` vacío que trae el editor. Pega el código, **guarda** (el menú junto a *Ejecutar* debe mostrar `doGet`, `doPost`…) y luego **Gestionar implementaciones → lápiz (la *App web*, no una *Biblioteca*) → Nueva versión → Implementar**. |
| La invitación dice "confirmado" pero no llega a la hoja | Lo mismo de arriba. Prueba `…/exec?prueba=1`. |
| Las fotos llegan a Drive pero no salen miniaturas en el panel | Falta o venció `GITHUB_TOKEN`, o no tiene **Contents: Read and write** sobre `xv-amellali`. Las fotos ya están a salvo en Drive. |
| Un video no sube ("Pesa más de 30 MB") | Es el límite de Google. Pídele al invitado que te lo mande por WhatsApp. |
| La música no suena | Suena al tocar **Abrir invitación** (los celulares no dejan reproducir antes). Si YouTube no carga, la invitación sigue funcionando sin música. |
| El panel abierto con doble clic no carga datos | Los paneles se usan desde internet (los links de arriba), no abriendo el archivo en la computadora. |

## Pendientes con la clienta

- Confirmar la **hora de la misa**: el mensaje dice 14:45 y el programa dice 15:00.
- El **croquis** trae el plano del salón de la boda (36 mesas de 10). Hay que ajustarlo al
  **Auditorio Ejidal Ayotla** cuando se sepa cuántas mesas habrá (botón **Organizar mesas**).

## Después del evento

1. Descarga la carpeta de Drive *XV Amellali · Fotos de invitados* (clic derecho → Descargar) y entrégala.
2. Si no quieres que las copias sigan públicas en GitHub: borra la rama `fotos` del repositorio.
3. En GitHub → *Fine-grained tokens*, borra el token `xv-amellali-fotos` (o deja que venza).
