# XV años de Amellali — invitación digital (Cliente 1, Ema)

Basada en la invitación de la boda (`Z:\WorkSpaces\Boda-Yuxzitl-Olaf\invitacion.html`):
misma estructura, mismo bloque `CONFIG`, mismo backend de Apps Script.

- **Quinceañera:** Amellali Abigail Montes de Oca Soriano (en pantalla: "Amellali")
- **Padrinos:** Lorena Cardenas Reyes y Mishel Edgar Castillo Diaz
- **Fecha:** sábado 14 de noviembre de 2026
- **Misa:** 14:45 — Parroquia de Nuestra Señora del Rosario, Londres 20, Ayotla, Ixtapaluca, Méx.
  (https://maps.app.goo.gl/bDWb1PbUTC4ujSkd8)
- **Recepción:** 16:00 — Auditorio Ejidal Ayotla, Cda. de Agricultores Manzana 024, Centro, 56530 Ixtapaluca, Méx.
  (https://maps.app.goo.gl/7xX6cZBrFkpDLNy7A)
- **Programa:** 15:00 Misa · 16:00 Recepción · 17:00 Alimentos · 18:00 Primer baile con orquesta
  en vivo · 21:00 Vals · 22:00 Sigue la fiesta con la batucada · 23:00 Banda de rock INVITRO ·
  02:00 Fin de la fiesta
- **Confirmar antes del:** 24 de octubre
- **Color rosa reservado** para la quinceañera (va en la invitación).
- **Sin código de vestimenta** (la clienta pidió quitar "Formal"); solo queda el aviso del color reservado.
- **Música de fondo:** Indila – *Love Story* (https://youtu.be/DF3XjEhJ40Y), con un reproductor de
  YouTube invisible (`CONFIG.musicaYouTube`, `musicaInicioSeg`, `musicaVolumen`). Arranca al tocar
  "Abrir invitación" (los navegadores no dejan sonar música antes de un toque); el botón ♪ la pausa.
  No se descarga el audio: se usa el video oficial embebido.

## Reglas de la clienta

- **No debe aparecer ninguna foto de la quinceañera** ni de su vestido (el vestido es rosa).
- **Ilustración que mandó la clienta** (quinceañera de espaldas en acuarela, rosas, mariposas,
  medallón "Mis 15 Años"): `img/xv-ilustracion.webp` (1642×2924, ~130 KB). Es un dibujo genérico,
  no foto. La original venía muy comprimida (855 px de una captura), así que: se recortó la franja
  gris, se **borró el medallón** de la imagen (relleno con la acuarela de alrededor) y se amplió con
  **IA (Real-ESRGAN, modelo `realesrgan-x4plus`)** a 4x y se guardó a 2x. El modelo `-anime` la
  volvía caricatura: no usarlo para acuarelas. Real-ESRGAN está en `C:\Users\LAFALH\Tools\realesrgan`. El medallón se **redibujó en SVG** (`SVG_MEDALLON_15`,
  en `.il-medallon`, mismas coordenadas que el original) para que tiara, aro y "Mis 15 Años" se
  vean nítidos. Va en `invitacion.html` como tarjeta `.ilustracion` con la frase encima, en la zona
  blanca de la izquierda (tamaños en `cqw`).
- Estilo: **época victoriana** con marco ovalado dorado, rosas, corazones y corona
  (según la imagen de referencia). Colores: **rosa baby + dorado + blanco**
  (al principio era rojo vino como la referencia; se cambió a petición).

## Publicación (GitHub Pages)

- Repo público: https://github.com/Lafalh/xv-amellali (rama `main`, raíz `/`, con `.nojekyll`).
- **Link para invitados:** https://lafalh.github.io/xv-amellali/invitacion.html
- Panel de organizadores: https://lafalh.github.io/xv-amellali/ (`index.html`, sin clave — no compartir).
- Cada `git push` a `main` republica el sitio solo (tarda ~1 min).

## Archivos

| Archivo | Qué es |
|---|---|
| `invitacion.html` | **La que se entrega: versión combinada** de los dos diseños. |
| `invitacion-marco.html` | Diseño 1 (se conserva): portada con marco ovalado, tarjetas, esquineros. |
| `invitacion-victoriana.html` | Diseño 2 (se conserva): estilo de https://eventday.ar/cumple/modelo-victorian/ — sobre con sello, filigranas, grabados, línea de tiempo. |
| `ajustes.js` | **Único lugar donde se pega la URL `/exec` del Apps Script** (`window.AJUSTES.urlAppsScript`); lo cargan las 9 páginas. |
| `en-vivo.js` | **Refresco automático** de los paneles (Dedicatorias, Invitados, Fotos y la lista del croquis) cada 20 s, con indicador "En vivo". Se pausa con la pestaña oculta, con el visor de fotos abierto o al arrastrar / organizar mesas en el croquis. Cada panel recarga en modo *silencioso* (no borra la pantalla, solo repinta si cambió la firma de los datos, conserva búsqueda/filtro/orden/carrusel) y descarta respuestas que llegan tarde (contador `pedido`). En el croquis solo se refresca la lista de invitados: el acomodo sin guardar no se toca. |
| `CONFIGURACION.md` | Guía paso a paso para configurar Google (hoja, Apps Script, token de GitHub, pruebas, problemas comunes). |
| `google-apps-script.gs` | Backend. Pestaña **`Invitados`** (se crea sola): `ID \| Fecha \| Nombre \| Teléfono \| Adultos \| Niños \| Total \| Mensaje \| Estado \| Actualizado`. Pestaña `Croquis` (JSON). |

## Lista de invitados: una sola, ligada por ID

Decisión de la clienta: **un solo link para todos** y **cada invitado se registra al confirmar**
(no hay lista previa). Para que los paneles no se desincronicen (problema de la boda, donde todo
se ligaba por el texto del nombre):

- La invitación genera un **ID** de 8 caracteres al confirmar y lo guarda en el celular
  (`localStorage` clave `xv-amellali-invitado`). Si la persona vuelve a confirmar desde ese celular,
  ve "Ya confirmaste como…", el formulario viene lleno y se **actualiza su misma fila** (upsert por ID).
- Al confirmar recibe su link `mi-confirmacion.html?id=ID` (botón "Ver mi lugar" + QR).
- WhatsApp opcional en el formulario → en el panel de invitados sale botón **WhatsApp** con mensaje
  armado (mesa + link). 10 dígitos → se antepone 52.
- **Todos los paneles leen `?accion=invitados`** y el croquis guarda `asign[ID]`. El croquis NO guarda
  la lista: la reconstruye al cargar (`sincronizarConInvitados`), conserva los agregados **a mano**
  (`origen:"manual"`, botón "+ Agregar invitado", ej. familia que no confirma), y libera lugares de
  eliminados o de quien bajó su número de personas.
- Duplicados (misma persona desde dos celulares): el panel de invitados los marca "¿duplicado?"
  (mismo nombre normalizado) y tiene **Eliminar** → `Estado = Eliminado` en la hoja (no borra la fila).
- El importador de Excel de la boda quedó oculto en el croquis.

## Fotos de los invitados (Drive + repositorio)

- La invitación (las 3 versiones) tiene la sección **"Sube tus fotos"**: QR que también se toca y
  botón, ambos a **`subir-fotos.html`** (página de invitados, sin nav de admin).
- `subir-fotos.html`: nombre (prellenado si ya confirmó), Galería / Cámara, miniaturas con estado,
  máx. 30 MB por archivo. Cada foto se manda **dos veces** al Apps Script con la misma clave:
  **original → carpeta de Google Drive** y **copia comprimida en el celular (1600 px, JPG ~300 KB) →
  rama `fotos` del repo** (`fotos/AAAA-MM-DD/<clave>.jpg`). Los videos solo van a Drive.
- Apps Script: `subirFoto` (Drive / GitHub API) + pestaña **`Fotos`** de la hoja
  (`Fecha | Clave | Autor | ID invitado | Tipo | Archivo | Drive | Repo`) + `?accion=fotos`.
  Necesita en **Propiedades del script**: `GITHUB_TOKEN` (fine-grained, solo este repo,
  Contents: Read and write). Opcionales: `GITHUB_REPO`, `GITHUB_RAMA`, `DRIVE_CARPETA`.
  La rama `fotos` y la carpeta de Drive se crean solas. **El token nunca va en los HTML.**
- Las fotos NO van a `main`: cada commit a `main` republica Pages (límite ~10/hora).
- Panel **`fotos.html`** (organizadores): galería desde la copia del repo
  (`raw.githubusercontent.com/<repo>/fotos/...`), filtro por quién subió, visor, link al original en
  Drive, botón a la carpeta y **"Imprimir QR para las mesas"** (tarjeta lista para imprimir).
- **Eliminar fotos** desde el panel (bote en cada foto y en el visor, con confirmación): `POST {accion:"eliminarFoto", clave}` → original a la **papelera de Drive** (30 días), copia quitada de la rama `fotos` con un commit (Git Data API; sigue en el historial) y la fila marcada **Estado = Eliminada** (columna 9 de la pestaña `Fotos`).
- Ojo: el repo es **público**, así que las copias comprimidas se pueden ver con el link directo.

### Paneles de administración (copiados de la boda y adaptados)

| Archivo | Qué es |
|---|---|
| `index.html` | Panel **Dedicatorias** (página principal, solo organizadores): **solo mensajes** — carrusel + muro con todas las dedicatorias y buscador. La lista de invitados ya NO está aquí. |
| `croquis-mesas.html` | Acomodo de mesas (misma lógica que la boda, ver su CLAUDE.md), con la lista sincronizada de `Invitados`. La mesa principal se llama "Quinceañera" (su id interno sigue siendo `novios`). |
| `confirmacion.html` | Panel **Invitados** (la lista de invitados vive solo aquí): todos con su mesa, fecha en que confirmaron, totales de personas/adultos/niños, filtros (sin mesa / posibles duplicados), orden (A-Z, más recientes, más personas), Vista previa, Copiar link, WhatsApp, Eliminar. |
| `mi-confirmacion.html` | Lo que ve cada invitado con su link (`?id=ID`; `?invitado=Nombre` sigue funcionando): su mesa, Misa y Recepción. |

Mejoras de UI/UX (guías de la habilidad ui-ux-pro-max), bloque **"MEJORAS UX"** al final del
`<style>` de cada panel: foco visible, objetivos táctiles ≥44px en celular, letras de apoyo ≥12px,
spinner de carga con `aria-live`, avisos breves (toast) al copiar/eliminar, íconos SVG (no emoji).
Por panel: dedicatorias con cifras en tarjetitas y muro de dedicatorias con buscador;
Invitados con WhatsApp como acción principal, vista previa y eliminar como íconos (eliminar aparte, con
confirmación), página que se desplaza normal en celular con buscador fijo; croquis con botones en una
fila deslizable (Guardar primero); mi-confirmacion con el **número de mesa en grande** (medallón) y
estado "pendiente" claro.

Los cuatro llevan al final del `<style>` un bloque **"TEMA XV AÑOS"** que sobreescribe los
colores/fuentes de la boda (rosa baby, dorado, Cinzel Decorative, damasco, puntos laterales,
botones píldora). Para cambiar el look de los paneles, editar ese bloque.
`confirmacion-general.html` NO se copió (era solo el aviso del cambio de salón de la boda).
Igual que en la boda: la barra `.nav-sitio` solo existe en los paneles, nunca en páginas de invitados.
Para probarlos local: `python -m http.server 8765` (config en `.claude/launch.json`).

Los tres HTML de invitación comparten el mismo `CONFIG`: un cambio de datos hay que hacerlo en los tres.

**Combinada** = sobre + inicio (filigranas barrocas + marco ovalado + cuenta regresiva) de la
victoriana; **esquineros victorianos grandes** (volutas barrocas con relieve, acanto, flor de lis y corazón-joya, 185px en celular / 270px en compu) que salen de **rieles verticales** dorados a los lados de las secciones rosas (como el pergamino de referencia); líneas punteadas laterales, etiquetas sobre títulos, tarjetas de
lugar con mapa, tarjetas de padrinos, itinerario en tarjetas y recuadro de color reservado
de la de marco; títulos Cinzel Decorative y grabados en todas las secciones.

## Lecciones aplicadas (en los tres)

- **Adultos y niños menores de 12** por separado en la confirmación (Pases = total; `?pases=N`
  en el link limita la suma).
- **Botón de confirmar llamativo** (brillo + latido + onda dorada): uno dentro de la página
  y uno flotante que lleva a `#seccion-rsvp`; el flotante se esconde mientras se ve el de la
  página o la sección de confirmar.
- **Botón "Abrir invitación" animado** (late, destello, ondas doradas).
- **Sobre animado al cargar** (victoriana y combinada): entra el sobre → se abre la tapa →
  sale la carta → aparece el botón.

## Sistema de diseño

```css
--tinta:#5B3A41 (malva, texto); --titulo:#A64D69 (rosa profundo, títulos);
--vino:#F6C9D5 (rosa baby, secciones de color); --carmesi:#C9637F;
--pergamino:#FFFAF8 (blanco); --pergamino-2:#F5E1E7 (campos del formulario);
--oro:#C9A227; --oro-texto:#8F6B17; rosas de los ornamentos #E48AA3;
--capitular:"Cinzel Decorative" (nombre y títulos); --script:"Pinyon Script";
--texto:"Cormorant Garamond"; --etiqueta:"Jost";
```

Ornamentos generados en JS como SVG: `SVG_MARCO`, `SVG_FILIGRANA`, `DAMASCO`, `ESQUINA`,
`ROSA`, `CORONA`, `JOYA`, `GRABADOS` (libro, iglesia, candelabro, reloj, rosa, abanico, tintero).

## Pendiente

- **Configurar Google**: seguir `CONFIGURACION.md` (hoja nueva, Apps Script, token de GitHub en
  Propiedades del script, implementar como app web). La URL `/exec` se pega **solo en `ajustes.js`**
  (todas las páginas la leen de `window.AJUSTES.urlAppsScript`). Mientras siga el placeholder, el
  formulario "confirma" pero no guarda nada.
- El croquis trae el **plano del salón de la boda** (36 mesas redondas de 10 + Quinceañera, Pastel,
  Dulces, pista). Hay que ajustarlo al Auditorio Ejidal Ayotla cuando se sepa el acomodo real.
- Confirmar con la clienta la hora de la misa: el mensaje dice 14:45 y el programa 15:00.
- Galería de la invitación apagada (`mostrarGaleria`). Subir fotos ya está activa.
