const API_BASE = "https://ext-api-qa.acity.com.pe/api-promociones-sorteo-qa/";
const ENDPOINT_PROMOS = "api/promocion/PromocionesSorteo";
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const API_KEY = "7B8UQ1n6fKYX8muErNVM4mmcEvMktgkh65HZTvd6AIviLZWRqB50tpaMehp6oddo"

let ganadoresGenerados = [];
let idEjecucionSegmentoActual = null;

async function cargarPromociones() {
  const select = document.getElementById("promocion-select");
  try {
    const resp = await fetch(`${API_BASE}${ENDPOINT_PROMOS}`, {
      headers: { Accept: "application/json" ,
        "x-api-key": API_KEY,
        "X-Requested-With": "XMLHttpRequest"
      }
    });
    const json = await resp.json();
    promociones = json.data;

    if (!json.isSuccess) throw new Error("API responded with failure");
    cargarGanadores(promociones.idEjecucionSegmento);

    select.innerHTML = '<option value="">Seleccione…</option>';
    json.data.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.idPromocion;
      opt.textContent = p.nombrePromocion;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error("Error cargando promociones", e);
    select.innerHTML = '<option value="">⚠️ Error al cargar promociones</option>';
  }
}

//Obtener el id ejecucionsegmento de el combo box.

document.getElementById("promocion-select").addEventListener("change", async (e) => {
  const index = e.target.value;
  const indexIdEjecucionSegmento = e.target.selectedIndex - 1;
  const selected = promociones[indexIdEjecucionSegmento];

   if (selected && selected.idEjecucionSegmento) {
    idEjecucionSegmentoSeleccionado = selected.idEjecucionSegmento;
    console.log("ID Ejecución seleccionado:", idEjecucionSegmentoSeleccionado);
  }

  if (index === "") return; // nada seleccionado

  // const promocion = promociones.idPromocion[index];
  //const resultado = lista.find(item => item.idSegmentoPromocion === 31)?.idEjecucionSegmento;
  //promociones.data.idSegmentoPromocion === index}

  const idEjecucionSegmento = idEjecucionSegmentoSeleccionado;

  try {
    const resp = await fetch(`${API_BASE}api/proyeccion/${idEjecucionSegmento}/BuscarProyeccion`, {
      headers: {
        "Accept": "application/json",
        "x-api-key": API_KEY,
      }
    });

    const json = await resp.json();

    // Asignamos los datos devueltos a los inputs
    cargarGanadores(idEjecucionSegmento);
    document.getElementById("opcionminima").value = json.data.opcionMinima;
    document.getElementById("opcionmaxima").value = json.data.opcionMaxima;
    

  } catch (err) {
    console.error("Error al obtener proyección:", err);
  }
});

async function cargarGanadores(idEjecucionSegmento) {
  try {
    const resp = await fetch(`${API_BASE}api/sorteo/${idEjecucionSegmento}/GanadoresSorteo`, {
      headers: {
        "Accept": "application/json",
        "x-api-key": API_KEY,
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    const json = await resp.json();

    // Mostrar cantidad de ganadores
    document.getElementById("cantidad-ganadores").value = json.data.cantidadGanadores;

    // Limpiar tabla actual
    const tablaBody = document.querySelector(".xl\\:grid-cols-2").children[1].querySelector("tbody");
    tablaBody.innerHTML = "";

    // Agregar cada fila de invitadosGanadores
    json.data.invitadosGanadores.forEach((g, i) => {
      const fila = document.createElement("tr");
      fila.className = "border-t";
      fila.innerHTML = `
        <td class="p-2 text-center">${g.numeroOrden}</td>
        <td class="p-2 text-center">${g.aliasInvitado}</td>
        <td class="p-2">${g.nombreInvitado}</td>
        <td class="p-2 text-center">${g.documento}</td>
        <td class="p-2 text-center">${g.numeroCupon}</td>
        
      `;
      tablaBody.appendChild(fila);
    });
  } catch (err) {
    console.error("Error cargando ganadores:", err);
  }
}

function cerrarAdvertencia() {
  document.getElementById("popup-advertencia").classList.add("hidden");
}

function mostrarAdvertencia(mensaje = "Ocurrió una advertencia.") {
  const popup = document.getElementById("popup-advertencia");
  const texto = document.getElementById("mensaje-advertencia");
  texto.textContent = mensaje;
  popup.classList.remove("hidden");
}



async function generarCuponesGanadores() {

  
  const tablaBody = document.getElementById("tabla-resultado");
  const filas = tablaBody.querySelectorAll("tr");
  const index = document.getElementById("promocion-select").value;
  if (index === "") return alert("Selecciona una promoción");
  


  if (filas.length !== 0) {
  // La tabla está vacía
      document.getElementById("advertencia-guardar").classList.remove("hidden");
      document.getElementById("eliminar-si").classList.add("hidden");
      mostrarAdvertencia("Ganadores no han sido guardados, ¿desea registrarlos?");
  return;
  }

   

  const promo = promociones[0]; // asumimos que tienes promociones[] ya llenado antes
  const loader = document.getElementById("cargando");

  const btn = document.getElementById("btn-sorteo");
  btn.disabled = true;
  tablaBody.innerHTML = "";
  const numeroCup = document.getElementById("numero-cupon");

  loader.classList.remove("hidden");

let intentos = 20;
let i = 0;

await new Promise(resolve => {
  const intervalo = setInterval(() => {
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, "0");
    numeroCup.textContent = random;
    i++;
    if (i >= intentos) {
      clearInterval(intervalo);
      resolve();
    }
  }, 100);
});


  const payload = {
    idEjecucionSegmento: promo.idEjecucionSegmento,
    hasGanadoresRepetidos: document.getElementById("ganRepetido").checked,
    rangoInicial: parseInt(document.getElementById("opcionminima").value),
    rangoFinal: parseInt(document.getElementById("opcionmaxima").value),
    cantidadVueltas: parseInt(document.getElementById("vueltas").value),
    cantidadGanadores: parseInt(document.getElementById("ganadores").value),
    premioPromocion: parseFloat(document.getElementById("premio").value)
  };

  try {
    const resp = await fetch(`${API_BASE}api/sorteo/GenerarCuponesGanadores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify(payload)
    });

    const json = await resp.json();

    ganadoresGenerados = json.data.invitadosSorteo;
    loader.classList.add("hidden");

    // Mostrar resultados en la tabla izquierda
    const tabla = document.getElementById("tabla-resultado");
    tabla.innerHTML = ""; // limpia la tabla primero

    ganadoresGenerados.forEach((g, i) => {
      const fila = document.createElement("tr");
      fila.className = "border-t";
      fila.innerHTML = `
        <td class="p-2 text-xs">${i + 1}</td>
        <td class="p-2 text-xs">${g.nombreInvitado}</td>
        <td class="p-2 text-xs text-center">${g.documento}</td>
        <td class="p-2 text-xs text-center">${g.numeroCupon}</td>
        <td class="p-2 text-xs text-center">${payload.premioPromocion}</td>
        <td class="p-2 text-xs text-center">${g.observacion}</td>
      `;
      tabla.appendChild(fila);
    });

    btn.disabled = false;
    loader.classList.add("hidden");
    numeroCup.textContent = "------";
    // Mostrar botón guardar
    //document.getElementById("btn-guardar").classList.remove("hidden");

  } catch (err) {
    console.error("Error generando cupones:", err);
    alert("Hubo un error al generar los cupones.");
  }
   

  }

  function eliminarGanadoresAdvertencia(){
    // Limpiar tabla actual
    cerrarAdvertencia();
    const tabla = document.getElementById("tabla-resultado");
    tabla.innerHTML = ""; // limpia la tabla primero
  }

 async function  eliminarResultados(){
  const tablaBody = document.getElementById("tabla-resultado");
  const filas = tablaBody.querySelectorAll("tr");
 
  if (filas.length === 0) {
  // La tabla está vacía
       document.getElementById("advertencia-guardar").classList.add("hidden");
       document.getElementById("eliminar-si").classList.add("hidden");
      mostrarAdvertencia("No existen ganadores para eliminar");
  return;
  }
      document.getElementById("advertencia-guardar").classList.add("hidden");
      document.getElementById("eliminar-si").classList.remove("hidden");
      mostrarAdvertencia("¿Desea borrar los ganadores sin antes registrarlos?");
 }

async function guardarResultados() {

  const btn = document.getElementById("btn-guardar");
  const tablaBody = document.getElementById("tabla-resultado");
  const filas = tablaBody.querySelectorAll("tr");
 
  btn.disabled = true;

  if (filas.length === 0) {
  // La tabla está vacía
       document.getElementById("advertencia-guardar").classList.add("hidden");
       document.getElementById("eliminar-si").classList.add("hidden");
      mostrarAdvertencia("No existen ganadores para registrar");
  return;
  }

  if (!ganadoresGenerados || ganadoresGenerados.length === 0) {
    alert("No hay datos para registrar. Ejecuta primero el sorteo.");
    return;
  }

  const index = document.getElementById("promocion-select").value;
  if (index === "") return alert("Selecciona una promoción válida");

  //const idEjecucionSegmento = promociones[0].idEjecucionSegmento;
  const idEjecucionSegmento = idEjecucionSegmentoSeleccionado;
  const body = {
    idEjecucionSegmento: idEjecucionSegmento,
    invitadosSorteoRequests: ganadoresGenerados.map(g => ({
      idJugadorUnificado: g.idJugadorUnificado,
      premio: parseFloat(document.getElementById("premio").value),
      numeroCupon: g.numeroCupon,
      documentoInvitado: g.documento,
      idCanje: g.idCanje
    }))
  };

  try {
    const resp = await fetch(`${API_BASE}api/sorteo/RegistrarGanadoresSorteo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) throw new Error("Error en la respuesta");

    const result = await resp.json();
    cerrarAdvertencia();
    mostrarPopup();
    //cargarGanadores(idEjecucionSegmento)
    cargarGanadores(idEjecucionSegmentoSeleccionado)
    btn.disabled = false;
    console.log("Respuesta:", result);

  } catch (err) {
    console.error("Error al registrar ganadores:", err);
    alert("Error al registrar los ganadores.");
  }
}

function mostrarPopup() {
  document.getElementById("popup-guardado").classList.remove("hidden");
}

function cerrarPopup() {
  document.getElementById("popup-guardado").classList.add("hidden");
  const tablaBody = document.getElementById("tabla-resultado");
  tablaBody.innerHTML = ""; // limpia la tabla primero
}

async function exportarReporteGanadores() {
  const index = document.getElementById("promocion-select").value;
  if (index === "") {
    alert("Selecciona una promoción para exportar su reporte");
    return;
  }

  //const idEjecucionSegmento = promociones[0].idEjecucionSegmento;
  const idEjecucionSegmento = idEjecucionSegmentoSeleccionado;
  try {
    const resp = await fetch(`${API_BASE}api/sorteo/${idEjecucionSegmento}/ReporteGanadoresSorteo`, {
      headers: {
        "Accept": "application/json",
        "x-api-key": API_KEY,
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    const json = await resp.json();
    const data = json.data;

    if (!data || !data.invitadoGanadoresReporte || data.invitadoGanadoresReporte.length === 0) {
      alert("No hay datos disponibles para exportar.");
      return;
    }

    // 1. Crear resumen como array de arrays (filas)
    const resumen = [
      [data.nombreReporte || "REPORTE DE GANADORES DE SORTEO"],
      [`Fecha de inicio del sorteo: ${new Date(data.fechaIniSorteo).toLocaleString()}`],
      [`Fecha de fin del sorteo: ${new Date(data.fechaFinSorteo).toLocaleString()}`],
      [""]
    ];

    // 2. Tabla de datos
    const encabezados = [
      "#", "Promoción", "Fecha Sorteo","Id Online", "Alias", "Documento", "Cuenta",
      "Nombre", "Apellido", "Cupón", "Monto Ganado"
    ];

    const filas = data.invitadoGanadoresReporte.map((g, i) => ([
      i + 1,
      g.nombrePromocion,
      new Date(g.fechaSorteo).toLocaleString(),
      g.idJugadorOrigen,
      g.aliasInvitado,
      g.documentoInvitado,
      g.cuenta,
      g.nombreInvitado,
      g.apellidoInvitado,
      g.nombreCupon,
      g.monedaPromocion + " " + g.montoGanado,
      
    ]));

    // 3. Unimos resumen + tabla
    const hojaCompleta = [...resumen, encabezados, ...filas];

    // 4. Generar Excel
    const ws = XLSX.utils.aoa_to_sheet(hojaCompleta);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ganadores");

    const nombreArchivo = `${data.nombreReporte.replace(/\\s+/g, "_")}_${idEjecucionSegmento}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);

  } catch (err) {
    console.error("Error exportando el reporte:", err);
    alert("Error al exportar el reporte.");
  }
}
  const tooltip = document.getElementById("tooltip-ganador");
  const container = document.getElementById("tooltip-container");
  const btn = document.getElementById("btn-tooltip");

  btn.addEventListener("click", () => {
    tooltip.classList.remove("hidden");
  });

  container.addEventListener("mouseleave", () => {
    tooltip.classList.add("hidden");
  });
window.addEventListener("DOMContentLoaded", () => {
  cargarPromociones();
});
