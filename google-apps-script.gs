/**
 * BACKEND GRATUITO — LISTA DE INVITADOS + CROQUIS DE MESAS (XV de Amellali)
 * =========================================================
 * UNA SOLA LISTA DE INVITADOS. Cada invitado se registra al confirmar en
 * la invitación y recibe un ID (lo genera la invitación y lo guarda en su
 * celular). Todos los paneles usan ese ID, nunca el nombre, así que:
 *   - si la misma persona vuelve a confirmar desde su celular, se ACTUALIZA
 *     su fila en vez de crear otra;
 *   - el croquis guarda las mesas por ID: corregir un nombre en la hoja no
 *     rompe nada;
 *   - el link de "mi mesa" de cada invitado es mi-confirmacion.html?id=ID.
 *
 * =========================================================
 * PASO 1 — LA HOJA DE CÁLCULO
 * =========================================================
 * Crea una hoja de cálculo nueva. NO necesitas crear pestañas: la primera
 * vez que alguien confirme se crea sola la pestaña "Invitados" con estos
 * encabezados:
 *
 *   ID | Fecha | Nombre | Teléfono | Adultos | Niños | Total | Mensaje | Estado | Actualizado
 *
 * - Puedes corregir a mano Nombre, Teléfono, Adultos, Niños o Mensaje.
 *   (Total se recalcula solo la próxima vez que esa persona confirme; si lo
 *   corriges a mano, corrige también Total.)
 * - Estado: "Confirmado" o "Eliminado" (los paneles ocultan los eliminados;
 *   así se quitan duplicados sin perder el registro).
 * - NO cambies la columna ID.
 *
 * La pestaña "Croquis" también se crea sola al primer guardado del croquis.
 *
 * =========================================================
 * PASO 2 — INSTALAR
 * =========================================================
 * 1. En la hoja, ve a Extensiones > Apps Script.
 * 2. Borra lo que haya y pega TODO este archivo.
 * 3. Implementar > Nueva implementación > Aplicación web:
 *      - Ejecutar como: "Yo"
 *      - Quién tiene acceso: "Cualquier usuario"   <-- IMPRESCINDIBLE
 * 4. Copia la URL que te da (termina en /exec) y pégala en
 *    CONFIG.urlConfirmaciones de TODOS los HTML: invitacion.html,
 *    invitacion-marco.html, invitacion-victoriana.html, index.html,
 *    croquis-mesas.html, confirmacion.html y mi-confirmacion.html.
 *
 * ⚠️ Cada vez que edites este script, ve a Implementar > Gestionar
 * implementaciones > lápiz > Versión: "Nueva versión" > Implementar.
 * Si solo guardas (Ctrl+S), la URL sigue usando el código viejo.
 *
 * =========================================================
 * PROBAR QUE FUNCIONA
 * =========================================================
 * Abre tu URL /exec en el navegador con "?prueba=1" al final. Debe decir
 * "✅ Fila de prueba agregada" y aparecer un invitado "PRUEBA" en la hoja
 * (bórralo o ponle Estado = Eliminado).
 *
 * =========================================================
 * LLAMADAS
 * =========================================================
 *   POST {accion:"confirmar", id, nombre, telefono, adultos, ninos, mensaje}
 *        → crea o actualiza la fila de ese ID
 *   POST {accion:"eliminarInvitado", id}   → Estado = Eliminado
 *   POST {accion:"guardarCroquis", croquis} → guarda mesas + acomodo
 *   GET  ?accion=invitados → lista de invitados (sin eliminados)
 *   GET  ?accion=invitado&id=ID → un invitado
 *   GET  ?accion=croquis   → acomodo de mesas
 *   GET  ?prueba=1         → agrega un invitado de prueba
 */

const HOJA_INVITADOS = "Invitados";
const HOJA_CROQUIS = "Croquis";
const ENCABEZADOS = ["ID", "Fecha", "Nombre", "Teléfono", "Adultos", "Niños", "Total", "Mensaje", "Estado", "Actualizado"];
const COL = { id: 0, fecha: 1, nombre: 2, telefono: 3, adultos: 4, ninos: 5, total: 6, mensaje: 7, estado: 8, actualizado: 9 };

/* ============================================================
   ESCRITURA (POST)
   ============================================================ */
function doPost(e) {
  const datos = JSON.parse(e.postData.contents);

  if (datos.accion === "guardarCroquis") return responderJSON(guardarCroquis(datos.croquis));
  if (datos.accion === "eliminarInvitado") return responderJSON(cambiarEstado(datos.id, "Eliminado"));

  // Por defecto (y accion:"confirmar"): confirmación de asistencia
  return responderJSON(confirmar(datos));
}

/* ============================================================
   LECTURA (GET)
   ============================================================ */
function doGet(e) {
  const p = e.parameter;

  if (p.prueba) {
    confirmar({ id: "PRUEBA-" + Date.now().toString(36), nombre: "PRUEBA", adultos: 1, ninos: 0,
                mensaje: "Fila de prueba generada desde el navegador" });
    return ContentService.createTextOutput("✅ Fila de prueba agregada. Revisa tu hoja de cálculo.")
      .setMimeType(ContentService.MimeType.TEXT);
  }
  if (p.accion === "invitados") return responderJSON({ ok: true, invitados: leerInvitados() });
  if (p.accion === "invitado") {
    const inv = leerInvitados().find(i => i.id === p.id);
    return responderJSON(inv ? { ok: true, invitado: inv } : { ok: false, error: "No existe ese invitado" });
  }
  if (p.accion === "croquis") return responderJSON({ ok: true, croquis: leerCroquis() });

  return ContentService
    .createTextOutput("Endpoint activo. Usa ?prueba=1, ?accion=invitados o ?accion=croquis.")
    .setMimeType(ContentService.MimeType.TEXT);
}

/* ============================================================
   INVITADOS
   ============================================================ */
function hojaInvitados() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA_INVITADOS);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA_INVITADOS, 0);
    hoja.getRange(1, 1, 1, ENCABEZADOS.length).setValues([ENCABEZADOS]).setFontWeight("bold");
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function filaAInvitado(f) {
  const adultos = Number(f[COL.adultos]) || 0;
  const ninos = Number(f[COL.ninos]) || 0;
  return {
    id: String(f[COL.id] || ""),
    fecha: f[COL.fecha] instanceof Date ? f[COL.fecha].toISOString() : String(f[COL.fecha] || ""),
    nombre: String(f[COL.nombre] || ""),
    telefono: String(f[COL.telefono] || ""),
    adultos: adultos,
    ninos: ninos,
    total: Number(f[COL.total]) || (adultos + ninos),
    mensaje: String(f[COL.mensaje] || ""),
    estado: String(f[COL.estado] || "Confirmado"),
    actualizado: f[COL.actualizado] instanceof Date ? f[COL.actualizado].toISOString() : String(f[COL.actualizado] || "")
  };
}

/** Lista de invitados (sin los eliminados), del más reciente al más viejo. */
function leerInvitados() {
  const hoja = hojaInvitados();
  const filas = hoja.getDataRange().getValues().slice(1);
  return filas
    .filter(f => f[COL.id])
    .map(filaAInvitado)
    .filter(i => i.estado !== "Eliminado")
    .reverse();
}

/** Crea o actualiza (por ID) la fila del invitado. */
function confirmar(datos) {
  const id = String(datos.id || "").trim();
  const nombre = String(datos.nombre || "").trim();
  if (!id || !nombre) return { ok: false, error: "Falta id o nombre" };

  const adultos = Math.max(0, parseInt(datos.adultos, 10) || 0);
  const ninos = Math.max(0, parseInt(datos.ninos, 10) || 0);
  // Confirmaciones viejas que solo traen "pases": todo cuenta como adultos
  const adultosFinal = (adultos || ninos) ? adultos : Math.max(1, parseInt(datos.pases, 10) || 1);

  const candado = LockService.getScriptLock();
  try { candado.waitLock(10000); } catch (err) { return { ok: false, error: "Sistema ocupado, intenta de nuevo." }; }
  try {
    const hoja = hojaInvitados();
    const ids = hoja.getRange(1, 1, Math.max(hoja.getLastRow(), 1), 1).getValues().map(f => String(f[0]));
    const fila = ids.indexOf(id) + 1; // 0 si no existe
    const ahora = new Date();
    if (fila > 1) {
      // Ya existía: se actualiza su misma fila (no se pierde la fecha original)
      hoja.getRange(fila, COL.nombre + 1, 1, 8).setValues([[
        nombre, String(datos.telefono || ""), adultosFinal, ninos, adultosFinal + ninos,
        String(datos.mensaje || ""), "Confirmado", ahora
      ]]);
      return { ok: true, id: id, actualizado: true };
    }
    hoja.appendRow([id, ahora, nombre, String(datos.telefono || ""), adultosFinal, ninos,
                    adultosFinal + ninos, String(datos.mensaje || ""), "Confirmado", ahora]);
    return { ok: true, id: id, nuevo: true };
  } finally {
    candado.releaseLock();
  }
}

function cambiarEstado(id, estado) {
  const hoja = hojaInvitados();
  const ids = hoja.getRange(1, 1, Math.max(hoja.getLastRow(), 1), 1).getValues().map(f => String(f[0]));
  const fila = ids.indexOf(String(id)) + 1;
  if (fila < 2) return { ok: false, error: "No existe ese invitado" };
  hoja.getRange(fila, COL.estado + 1, 1, 2).setValues([[estado, new Date()]]);
  return { ok: true };
}

/* ============================================================
   CROQUIS DE MESAS
   ============================================================
   Se guarda como texto JSON dentro de la pestaña "Croquis", repartido
   en trozos por la columna A (las celdas de Sheets admiten un máximo
   de caracteres). Guarda las mesas, el acomodo (asign: {idInvitado:
   {idMesa: cantidad}}) y los invitados agregados a mano en el croquis.
   La lista de invitados que confirmaron NO se guarda aquí: el croquis
   la lee siempre de la pestaña "Invitados".
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
function responderJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
