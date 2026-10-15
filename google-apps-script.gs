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
 *   POST {accion:"subirFoto", destino:"drive"|"repo", clave, tipo, datos(base64), nombreArchivo, autor, idInvitado}
 *        → guarda la foto (ver sección FOTOS: requiere GITHUB_TOKEN)
 *   GET  ?accion=fotos     → fotos subidas + link de la carpeta de Drive
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

  if (datos.accion === "subirFoto") return responderJSON(subirFoto(datos));
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
  if (p.accion === "fotos") return responderJSON({ ok: true, fotos: leerFotos(), carpeta: urlCarpeta(),
                                                    repo: prop("GITHUB_REPO", REPO_DEFAULT), rama: prop("GITHUB_RAMA", "fotos") });

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
   FOTOS DE LOS INVITADOS (subir-fotos.html → aquí → Drive + repo)
   ============================================================
   Cada foto llega DOS veces desde subir-fotos.html, con la misma "clave":
     destino "drive" → el ORIGINAL (o el video) a una carpeta de Google Drive
     destino "repo"  → versión COMPRIMIDA (~1600 px, JPG) a la rama "fotos"
                       del repositorio de GitHub (los videos NO van al repo)
   y se anota en la pestaña "Fotos" (una fila por archivo). El panel
   fotos.html lee esa pestaña.

   CONFIGURACIÓN (una sola vez): en el editor de Apps Script ve a
   Configuración del proyecto (engrane) > Propiedades del script y agrega:
     GITHUB_TOKEN  → token "fine-grained" de GitHub con acceso SOLO al repo
                     xv-amellali y permiso "Contents: Read and write".
                     (github.com > Settings > Developer settings >
                      Personal access tokens > Fine-grained tokens)
     GITHUB_REPO   → Lafalh/xv-amellali   (opcional, es el valor por defecto)
     GITHUB_RAMA   → fotos                (opcional; la rama se crea sola)
     DRIVE_CARPETA → (opcional) id de una carpeta de Drive; si no lo pones,
                     se crea sola "XV Amellali · Fotos de invitados".
   El token vive SOLO aquí: nunca va en los HTML.
   Al implementar la nueva versión, Google pedirá permiso para usar Drive y
   para conectarse a servicios externos (GitHub): hay que aceptarlo.
   ============================================================ */
const HOJA_FOTOS = "Fotos";
const ENC_FOTOS = ["Fecha", "Clave", "Autor", "ID invitado", "Tipo", "Archivo", "Drive", "Repo"];
const MAX_BASE64 = 45 * 1024 * 1024;   // ~33 MB reales (el límite de Apps Script ronda 50 MB)
const REPO_DEFAULT = "Lafalh/xv-amellali";

function prop(clave, porDefecto) {
  return PropertiesService.getScriptProperties().getProperty(clave) || porDefecto;
}

function carpetaFotos() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("DRIVE_CARPETA");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const carpeta = DriveApp.createFolder("XV Amellali · Fotos de invitados");
  props.setProperty("DRIVE_CARPETA", carpeta.getId());
  return carpeta;
}

function urlCarpeta() {
  try { return carpetaFotos().getUrl(); } catch (e) { return ""; }
}

function hojaFotos() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA_FOTOS);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA_FOTOS);
    hoja.getRange(1, 1, 1, ENC_FOTOS.length).setValues([ENC_FOTOS]).setFontWeight("bold");
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function subirFoto(d) {
  try {
    const clave = String(d.clave || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
    const tipo = String(d.tipo || "");
    if (!clave || !d.datos) return { ok: false, error: "Faltan datos" };
    if (!/^(image|video)\//.test(tipo)) return { ok: false, error: "Solo se aceptan fotos o videos" };
    if (String(d.datos).length > MAX_BASE64) return { ok: false, error: "El archivo es demasiado pesado" };
    const nombre = String(d.nombreArchivo || "foto").replace(/[^\w.\- ]/g, "_").slice(-60);
    const autor = String(d.autor || "").trim().slice(0, 80);

    let drive = "", repo = "";
    if (d.destino === "repo") {
      if (!/^image\//.test(tipo)) return { ok: false, error: "Al repositorio solo van fotos" };
      repo = subirAGitHub(clave, String(d.datos));
    } else {
      const blob = Utilities.newBlob(Utilities.base64Decode(String(d.datos)), tipo, clave + "-" + nombre);
      const archivo = carpetaFotos().createFile(blob);
      archivo.setDescription("Subida por: " + (autor || "invitado sin nombre"));
      drive = archivo.getUrl();
    }
    anotarFoto({ clave: clave, autor: autor, idInvitado: String(d.idInvitado || ""), tipo: tipo, archivo: nombre, drive: drive, repo: repo });
    return { ok: true, drive: drive, repo: repo };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

/** Una fila por archivo: la primera llamada la crea, la segunda completa Drive o Repo. */
function anotarFoto(f) {
  const candado = LockService.getScriptLock();
  candado.waitLock(20000);
  try {
    const hoja = hojaFotos();
    const claves = hoja.getRange(1, 2, Math.max(hoja.getLastRow(), 1), 1).getValues().map(r => String(r[0]));
    const fila = claves.indexOf(f.clave) + 1;
    if (fila > 1) {
      if (f.drive) hoja.getRange(fila, 7).setValue(f.drive);
      if (f.repo) hoja.getRange(fila, 8).setValue(f.repo);
    } else {
      hoja.appendRow([new Date(), f.clave, f.autor, f.idInvitado, f.tipo, f.archivo, f.drive, f.repo]);
    }
  } finally {
    candado.releaseLock();
  }
}

function leerFotos() {
  const hoja = hojaFotos();
  return hoja.getDataRange().getValues().slice(1).filter(r => r[1]).map(r => ({
    fecha: r[0] instanceof Date ? r[0].toISOString() : String(r[0] || ""),
    clave: String(r[1]), autor: String(r[2] || ""), idInvitado: String(r[3] || ""),
    tipo: String(r[4] || ""), archivo: String(r[5] || ""), drive: String(r[6] || ""), repo: String(r[7] || "")
  })).reverse();
}

/* ---------- GitHub ---------- */
function gh(metodo, ruta, token, cuerpo) {
  const opciones = {
    method: metodo,
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    muteHttpExceptions: true
  };
  if (cuerpo) { opciones.contentType = "application/json"; opciones.payload = JSON.stringify(cuerpo); }
  const r = UrlFetchApp.fetch("https://api.github.com" + ruta, opciones);
  let json = null;
  try { json = JSON.parse(r.getContentText()); } catch (e) {}
  return { codigo: r.getResponseCode(), json: json };
}

/** La rama de fotos se crea sola (a partir de main) la primera vez. */
function asegurarRama(repo, rama, token) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty("RAMA_LISTA") === repo + "#" + rama) return;
  const existe = gh("GET", "/repos/" + repo + "/git/ref/heads/" + rama, token);
  if (existe.codigo === 404) {
    const main = gh("GET", "/repos/" + repo + "/git/ref/heads/main", token);
    if (main.codigo !== 200) throw new Error("No se pudo leer la rama main (" + main.codigo + "). Revisa GITHUB_TOKEN y GITHUB_REPO.");
    const nueva = gh("POST", "/repos/" + repo + "/git/refs", token, { ref: "refs/heads/" + rama, sha: main.json.object.sha });
    if (nueva.codigo !== 201) throw new Error("No se pudo crear la rama " + rama + " (" + nueva.codigo + ")");
  } else if (existe.codigo !== 200) {
    throw new Error("GitHub respondió " + existe.codigo + ". Revisa que GITHUB_TOKEN tenga acceso al repo.");
  }
  props.setProperty("RAMA_LISTA", repo + "#" + rama);
}

function subirAGitHub(clave, base64) {
  const token = prop("GITHUB_TOKEN", "");
  if (!token) throw new Error("Falta GITHUB_TOKEN en las Propiedades del script");
  const repo = prop("GITHUB_REPO", REPO_DEFAULT);
  const rama = prop("GITHUB_RAMA", "fotos");
  asegurarRama(repo, rama, token);
  const dia = Utilities.formatDate(new Date(), "America/Mexico_City", "yyyy-MM-dd");
  const ruta = "fotos/" + dia + "/" + clave + ".jpg";

  // Los commits a la misma rama se hacen de uno en uno (si llegan dos fotos
  // a la vez, GitHub rechaza una con 409); se reintenta por si acaso.
  const candado = LockService.getScriptLock();
  candado.waitLock(30000);
  try {
    for (let intento = 0; intento < 3; intento++) {
      const r = gh("PUT", "/repos/" + repo + "/contents/" + ruta, token,
                   { message: "Foto de invitado " + clave, content: base64, branch: rama });
      if (r.codigo === 201 || r.codigo === 200) return ruta;
      if (r.codigo === 422) return ruta;   // ya existía (reintento del celular): cuenta como subida
      if (r.codigo !== 409) throw new Error("GitHub respondió " + r.codigo + ((r.json && r.json.message) ? ": " + r.json.message : ""));
      Utilities.sleep(800 * (intento + 1));
    }
    throw new Error("GitHub estuvo ocupado, intenta de nuevo");
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
