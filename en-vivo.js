/* ================================================================
   REFRESCO AUTOMÁTICO DE LOS PANELES ("En vivo")
   ================================================================
   Lo usan index.html, confirmacion.html, fotos.html y croquis-mesas.html.
   Cada `cada` segundos llama a `actualizar()` (que debe volver a leer los
   datos SIN borrar la pantalla y solo repintar si algo cambió). Se pausa
   mientras la pestaña está oculta (no gasta consultas al Apps Script) o
   mientras `pausar()` diga que sí (ej. el visor de fotos abierto o un
   arrastre en el croquis), y se pone al día en cuanto vuelves a la pestaña.

   Uso:
     const vivo = EnVivo.iniciar({
       contenedor: document.getElementById("..."),   // donde va el indicador
       actualizar: async () => { ... },               // lanza error si falló
       pausar: () => false,
       cada: 20
     });
     vivo.marcar();   // avisar que se acaban de cargar datos (carga manual)
   ================================================================ */
(function () {
  const CSS = `
  .en-vivo{ display:inline-flex; align-items:center; gap:7px; font-family:"Jost",sans-serif; font-size:.72rem;
            letter-spacing:.04em; color:#8F6B17; padding:4px 10px 4px 8px; border-radius:999px;
            background:#FFFFFF; border:1px solid #F5E1E7; white-space:nowrap; }
  .en-vivo .punto{ width:8px; height:8px; border-radius:50%; background:#3E9B5C; box-shadow:0 0 0 0 rgba(62,155,92,.6);
                   animation:en-vivo-pulso 2s ease-out infinite; flex:0 0 auto; }
  .en-vivo.actualizando .punto{ background:#C9A227; animation:none; }
  .en-vivo.error{ color:#A3352F; border-color:#F3C6C2; background:#FDECEA; }
  .en-vivo.error .punto{ background:#A3352F; animation:none; }
  .en-vivo.pausa .punto{ background:#B9A9AD; animation:none; }
  @keyframes en-vivo-pulso{ 0%{ box-shadow:0 0 0 0 rgba(62,155,92,.55); } 80%,100%{ box-shadow:0 0 0 7px rgba(62,155,92,0); } }
  @media (prefers-reduced-motion: reduce){ .en-vivo .punto{ animation:none; } }`;

  function hace(seg) {
    if (seg < 5) return "justo ahora";
    if (seg < 60) return `hace ${seg} s`;
    const min = Math.floor(seg / 60);
    return `hace ${min} min`;
  }

  window.EnVivo = {
    iniciar({ contenedor, actualizar, pausar = () => false, cada = 20 }) {
      if (!document.getElementById("css-en-vivo")) {
        const st = document.createElement("style");
        st.id = "css-en-vivo"; st.textContent = CSS;
        document.head.appendChild(st);
      }
      const ind = document.createElement("span");
      ind.className = "en-vivo";
      ind.setAttribute("role", "status");
      ind.innerHTML = '<span class="punto" aria-hidden="true"></span><span class="txt">En vivo</span>';
      if (contenedor) contenedor.appendChild(ind);
      const txt = ind.querySelector(".txt");

      // la página hace su propia carga inicial: el primer refresco automático
      // llega después de `cada` segundos, no al segundo 1
      let ultima = Date.now(), ocupado = false, fallo = false;

      function pintar() {
        ind.classList.toggle("error", fallo);
        if (fallo) { txt.textContent = "Sin conexión · reintentando"; return; }
        if (!ultima) { txt.textContent = "En vivo"; return; }
        const pausado = document.hidden || pausar();
        ind.classList.toggle("pausa", !!pausado && !ocupado);
        txt.textContent = `En vivo · actualizado ${hace(Math.round((Date.now() - ultima) / 1000))}`;
      }

      async function tic(forzar) {
        if (ocupado) return;
        if (!forzar && (document.hidden || pausar())) { pintar(); return; }
        if (!forzar && Date.now() - ultima < cada * 1000) { pintar(); return; }
        ocupado = true; ind.classList.add("actualizando");
        try { await actualizar(); ultima = Date.now(); fallo = false; }
        catch (e) { fallo = true; ultima = Date.now(); console.warn("Refresco automático:", e); }
        finally { ocupado = false; ind.classList.remove("actualizando"); pintar(); }
      }

      setInterval(() => tic(false), 1000);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) tic(false); });
      return {
        marcar() { ultima = Date.now(); fallo = false; pintar(); },
        ahora() { return tic(true); }
      };
    }
  };
})();
