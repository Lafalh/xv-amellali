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
| `google-apps-script.gs` | Backend (copiado de la boda). Hoja `Confirmaciones`: `Fecha \| Nombre \| Asiste \| Pases \| Adultos \| Niños \| Mensaje`. |

### Paneles de administración (copiados de la boda y adaptados)

| Archivo | Qué es |
|---|---|
| `index.html` | Panel principal (solo organizadores): carrusel de dedicatorias + lista de confirmaciones con **Adultos / Niños / Total**. |
| `croquis-mesas.html` | Acomodo de mesas (misma lógica que la boda, ver su CLAUDE.md). La mesa principal se llama "Quinceañera" (su id interno sigue siendo `novios`). El Excel puede marcarla como `MESA QUINCEAÑERA`, `MESA PRINCIPAL` o `MESA NOVIOS`. |
| `confirmacion.html` | Lista de invitados del croquis con "Copiar link" / "Vista previa" hacia `mi-confirmacion.html`. |
| `mi-confirmacion.html` | Lo que ve cada invitado con su link (`?invitado=Nombre`): su mesa, Misa y Recepción. Sin aviso de cambio de sede. |

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

- Crear hoja de Google (con las 7 columnas de arriba) + desplegar `google-apps-script.gs` y pegar
  la URL `/exec` en `CONFIG.urlConfirmaciones` de los tres HTML (hoy es un placeholder: el
  formulario "confirma" pero no guarda nada).
- La URL `/exec` también va en `CONFIG.urlConfirmaciones` de `index.html`, `croquis-mesas.html`,
  `confirmacion.html` y `mi-confirmacion.html`.
- El croquis trae el **plano del salón de la boda** (36 mesas redondas de 10 + Quinceañera, Pastel,
  Dulces, pista). Hay que ajustarlo al Auditorio Ejidal Ayotla cuando se sepa el acomodo real.
- Confirmar con la clienta la hora de la misa: el mensaje dice 14:45 y el programa 15:00.
- Galería y Subir fotos están apagadas (`mostrarGaleria`, `mostrarSubirFotos`).
