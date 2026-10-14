/**
 * BACKEND GRATUITO — CONFIRMACIONES + CROQUIS DE MESAS
 * =========================================================
 * Este script maneja dos cosas:
 *   1. Las confirmaciones de asistencia (index.html y panel-dedicatorias.html)
 *   2. El acomodo de mesas (croquis-mesas.html)
 *
 * Todo vive en la MISMA hoja de cálculo, en pestañas separadas, así que
 * una cosa no interfiere con la otra.
 *
 * =========================================================
 * PASO 1 — LA HOJA DE CÁLCULO
 * =========================================================
 * Solo necesitas la pestaña que YA tienes con las confirmaciones.
 * Asegúrate de que se llame "Confirmaciones" (clic derecho sobre la
 * pestaña > Cambiar nombre), con estos encabezados en la fila 1:
 *
 *     Fecha | Nombre | Asiste | Pases | Adultos | Niños | Mensaje
 *
 * (Pases = total de personas; Adultos y Niños menores de 12 es el desglose.)
 *
 * La pestaña "Croquis" NO la crees tú: el script la genera sola la
 * primera vez que guardes el acomodo de mesas.
 *
 * =========================================================
 * PASO 2 — INSTALAR
 * =========================================================
 * 1. En la hoja, ve a Extensiones > Apps Script.
 * 2. Borra lo que haya y pega TODO este archivo.
 * 3. Implementar > Nueva implementación > Aplicación web:
 *      - Ejecutar como: "Yo"
 *      - Quién tiene acceso: "Cualquier usuario"   <-- IMPRESCINDIBLE
 * 4. Copia la URL que te da y pégala en CONFIG.urlConfirmaciones de:
 *      - index.html
 *      - panel-dedicatorias.html
 *      - croquis-mesas.html
 *    (es la misma URL en los tres archivos)
 *
 * ⚠️ Cada vez que edites este script, ve a Implementar > Gestionar
 * implementaciones > lápiz > Versión: "Nueva versión" > Implementar.
 * Si solo guardas (Ctrl+S), la URL sigue usando el código viejo.
 *
 * =========================================================
 * PROBAR QUE FUNCIONA
 * =========================================================
 * Pega tu URL terminada en /exec en el navegador y agrégale "?prueba=1".
 * Si ves "✅ Fila de prueba agregada" y aparece una fila nueva con el
 * nombre "PRUEBA", todo está bien. Si te pide iniciar sesión o da error,
 * revisa los permisos del paso 3.
 */

const HOJA_CONFIRMACIONES = "Confirmaciones";
const HOJA_CROQUIS = "Croquis";

/* ============================================================
   ESCRITURA (POST)
   ============================================================ */
function doPost(e) {
  const datos = JSON.parse(e.postData.contents);

  // Guardar el acomodo de mesas
  if (datos.accion === "guardarCroquis") {
    return responderJSON(guardarCroquis(datos.croquis));
  }

  // Por defecto: confirmación de asistencia
  guardarConfirmacion(datos);
  return responderJSON({ ok: true });
}

/* ============================================================
   LECTURA (GET)
   ============================================================ */
function doGet(e) {
  // Prueba rápida de escritura
  if (e.parameter.prueba) {
    guardarConfirmacion({
      nombre: "PRUEBA", asiste: "si", pases: 1,
      mensaje: "Fila de prueba generada desde el navegador"
    });
    return ContentService
      .createTextOutput("✅ Fila de prueba agregada. Revisa tu hoja de cálculo.")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  // Confirmaciones (panel-dedicatorias.html y el importador del croquis)
  if (e.parameter.accion === "listar") {
    return responderJSON({ ok: true, confirmaciones: leerConfirmaciones() });
  }

  // Acomodo de mesas (croquis-mesas.html)
  if (e.parameter.accion === "croquis") {
    return responderJSON({ ok: true, croquis: leerCroquis() });
  }

  return ContentService
    .createTextOutput("Endpoint activo. Usa ?prueba=1, ?accion=listar o ?accion=croquis.")
    .setMimeType(ContentService.MimeType.TEXT);
}

/* ============================================================
   CONFIRMACIONES
   ============================================================ */
function guardarConfirmacion(datos) {
  const hoja = hojaPorNombre(HOJA_CONFIRMACIONES);
  hoja.appendRow([
    new Date(),
    datos.nombre || "",
    datos.asiste === "si" ? "Sí" : "No",
    datos.pases || 0,
    datos.adultos || 0,
    datos.ninos || 0,
    datos.mensaje || ""
  ]);
}

function leerConfirmaciones() {
  const hoja = hojaPorNombre(HOJA_CONFIRMACIONES);
  const filas = hoja.getDataRange().getValues();
  const datos = filas.slice(1).map(f => ({
    fecha: f[0] instanceof Date ? f[0].toISOString() : String(f[0] || ""),
    nombre: String(f[1] || ""),
    asiste: String(f[2] || ""),
    pases: Number(f[3]) || 0,
    adultos: Number(f[4]) || 0,
    ninos: Number(f[5]) || 0,
    mensaje: String(f[6] || "")
  }));
  datos.reverse();
  return datos;
}

/* ============================================================
   CROQUIS DE MESAS
   ============================================================
   Se guarda como texto JSON dentro de la pestaña "Croquis", repartido
   en trozos por la columna A (las celdas de Sheets admiten un máximo
   de caracteres). Vive en su propia pestaña, así que no interfiere
   con las confirmaciones. La pestaña se crea sola al primer guardado.
   ============================================================ */
const TROZO = 45000;

function leerCroquis() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = libro.getSheetByName(HOJA_CROQUIS);
  if (!hoja) return null;
  const valores = hoja.getRange(1, 1, Math.max(hoja.getLastRow(), 1), 1).getValues();
  const texto = valores.map(f => String(f[0] || "")).join("");
  if (!texto.trim()) return null;
  try {
    return JSON.parse(texto);
  } catch (err) {
    return null;
  }
}

function guardarCroquis(croquis) {
  const candado = LockService.getScriptLock();
  try {
    candado.waitLock(10000);
  } catch (err) {
    return { ok: false, error: "El sistema está ocupado. Intenta de nuevo." };
  }

  try {
    const libro = SpreadsheetApp.getActiveSpreadsheet();
    let hoja = libro.getSheetByName(HOJA_CROQUIS);
    if (!hoja) hoja = libro.insertSheet(HOJA_CROQUIS);

    const texto = JSON.stringify(croquis);
    const trozos = [];
    for (let i = 0; i < texto.length; i += TROZO) {
      trozos.push([texto.substring(i, i + TROZO)]);
    }

    hoja.clear();
    hoja.getRange(1, 1, trozos.length, 1).setValues(trozos);
    return { ok: true, guardado: texto.length };
  } catch (err) {
    return { ok: false, error: String(err) };
  } finally {
    candado.releaseLock();
  }
}

/* ============================================================
   UTILIDADES
   ============================================================ */
function hojaPorNombre(nombre) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = libro.getSheetByName(nombre);
  if (hoja) return hoja;
  // Si todavía no le cambiaste el nombre a la pestaña, usa la primera
  // para no romper las confirmaciones.
  return libro.getSheets()[0];
}

function responderJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
