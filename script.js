/* =========================================================================
   H0: SISTEMA DE PERSISTENCIA (Tanque de Datos LocalStorage)
   ========================================================================= */
class DatabaseTHOS {
  static TABLA_VISITAS = "thos_visitas";
  static TABLA_PACIENTES = "thos_pacientes";

  static guardar(tabla, datos) {
    let registros = this.obtenerTodo(tabla);
    registros.push(datos);
    localStorage.setItem(tabla, JSON.stringify(registros));
  }

  static obtenerTodo(tabla) {
    const datos = localStorage.getItem(tabla);
    return datos ? JSON.parse(datos) : [];
  }

  static actualizarVisita(idVisita, horaEntrada, estado) {
    let visitas = this.obtenerTodo(this.TABLA_VISITAS);
    let indice = visitas.findIndex((v) => v.idVisita === idVisita);
    if (indice !== -1) {
      visitas[indice].horaEntrada = horaEntrada;
      visitas[indice].estadoActual = estado;
      localStorage.setItem(this.TABLA_VISITAS, JSON.stringify(visitas));
    }
  }
}

/** Catálogo demo por id: se fusiona con localStorage para no quedar con datos viejos (pocos pacientes). */
const CATALOGO_PACIENTES_PREDETERMINADO = [
  {
    id: "P-001",
    nombre: "Carlos Ramírez",
    area: "Cardiología - Hab 402",
    estado: "Activo",
  },
  {
    id: "P-002",
    nombre: "Lucía Gómez",
    area: "UCI - Cama 05",
    estado: "Restringido",
  },
  {
    id: "P-003",
    nombre: "Marta Valencia",
    area: "Maternidad - Hab 104",
    estado: "Activo",
  },
  {
    id: "P-004",
    nombre: "Juan Perez",
    area: "Traumatología - Hab 201",
    estado: "Activo",
  },
  {
    id: "P-005",
    nombre: "Ana Torres",
    area: "Pediatría - Hab 305",
    estado: "Activo",
  },
];

function inicializarBodegaPacientes() {
  const existentes = DatabaseTHOS.obtenerTodo(DatabaseTHOS.TABLA_PACIENTES);
  const porId = new Map();

  existentes.forEach((p) => {
    if (p && p.id) porId.set(p.id, p);
  });

  let huboCambios = existentes.length === 0;

  CATALOGO_PACIENTES_PREDETERMINADO.forEach((def) => {
    if (!porId.has(def.id)) {
      porId.set(def.id, { ...def });
      huboCambios = true;
    }
  });

  if (!huboCambios) return;

  const sinId = existentes.filter((p) => p && !p.id);
  const fusionados = [...porId.values(), ...sinId];
  localStorage.setItem(
    DatabaseTHOS.TABLA_PACIENTES,
    JSON.stringify(fusionados),
  );
}
inicializarBodegaPacientes();

/* =========================================================================
   CLASES POO (Planos Técnicos del Sistema)
   ========================================================================= */
class Usuario {
  constructor(nombre, documento, telefono) {
    this.nombre = nombre;
    this.documento = documento;
    this.telefono = telefono;
  }
}

class Visitante extends Usuario {
  constructor(nombre, documento, telefono) {
    super(nombre, documento, telefono);
    this.idVisitante = "V-" + Math.floor(Math.random() * 10000);
  }
}

class Visita {
  constructor(visitante, paciente, area) {
    this.idVisita = "VIS-" + Math.floor(Math.random() * 10000);
    this.visitante = visitante;
    this.paciente = paciente;
    this.areaDestino = area;
    this.estadoActual = "Registrado";
    this.horaEntrada = null;
  }
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToUtf8(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

class GestorQR {
  generarToken(visita) {
    // Payload solo ASCII (Base64): qrcodejs falla con Unicode directo en el texto del QR
    const payload = {
      idv: visita.visitante.idVisitante,
      idvis: visita.idVisita,
      pac: visita.paciente,
      exp: Date.now() + 3600000,
    };
    return `THOS1:${utf8ToBase64(JSON.stringify(payload))}`;
  }
}

class GuardiaSeguridad {
  validarCodigo(qrData) {
    const texto = String(qrData).trim();

    if (texto.startsWith("THOS1:")) {
      try {
        const o = JSON.parse(base64ToUtf8(texto.slice(6)));
        if (!o.exp || Number.isNaN(Number(o.exp)))
          return { valido: false, motivo: "Formato QR inválido" };
        if (Date.now() > Number(o.exp))
          return { valido: false, motivo: "QR Expirado (Caducado)" };
        return {
          valido: true,
          visitanteID: String(o.idv),
          visitaID: String(o.idvis),
          paciente: String(o.pac),
        };
      } catch {
        return { valido: false, motivo: "Formato QR inválido" };
      }
    }

    const partes = texto.split("|");
    if (partes.length < 4)
      return { valido: false, motivo: "Formato QR inválido" };

    const expPart = partes[3].split(":");
    const expiracion = parseInt(expPart[expPart.length - 1], 10);
    if (Number.isNaN(expiracion) || Date.now() > expiracion)
      return { valido: false, motivo: "QR Expirado (Caducado)" };

    const pacienteLegacy = partes[2].includes(":")
      ? partes[2].split(":").slice(1).join(":")
      : partes[2];

    return {
      valido: true,
      visitanteID: partes[0].split(":")[1],
      visitaID: partes[1].split(":")[1],
      paciente: pacienteLegacy,
    };
  }
}

/* =========================================================================
   FUNCIONES GLOBALES DE INTERFAZ
   ========================================================================= */
function mostrarToast(mensaje, tipo) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.className =
    "show " + (tipo === "exito" ? "toast-success" : "toast-error");
  setTimeout(() => {
    toast.className = "";
  }, 3000);
}

function volverAlMenu(moduloActual) {
  if (html5QrCode)
    html5QrCode.stop().catch((e) => console.log("Cámara apagada"));
  document.getElementById(moduloActual).style.display = "none";
  document.getElementById("modulo-registro").style.display = "block";
  if (location.hash === "#guardia") {
    const sinHash = window.location.href.split("#")[0];
    history.replaceState(null, "", sinHash);
  }
}

function abrirGuardiaEnNuevaPestaña() {
  const url = `${window.location.href.split("#")[0]}#guardia`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/* =========================================================================
   H2: BUSCADOR AVANZADO DE PACIENTES
   ========================================================================= */
function renderListaPacientes(textoFiltro) {
  const lista = document.getElementById("lista-sugerencias");
  lista.innerHTML = "";

  const q = String(textoFiltro ?? "")
    .trim()
    .toLowerCase();
  const todos = DatabaseTHOS.obtenerTodo(DatabaseTHOS.TABLA_PACIENTES);
  const resultados =
    q.length === 0
      ? todos
      : todos.filter((p) => p.nombre.toLowerCase().includes(q));

  if (resultados.length === 0) {
    const li = document.createElement("li");
    li.className = "sin-resultados";
    li.textContent = "No hay coincidencias en el catálogo";
    lista.appendChild(li);
    return;
  }

  resultados.forEach((paciente) => {
    const li = document.createElement("li");
    li.textContent = `${paciente.nombre} (${paciente.area})`;

    if (paciente.estado === "Restringido") {
      li.classList.add("restringido");
      li.textContent += " ⛔ RESTRINGIDO";
      li.onclick = () =>
        mostrarToast("Paciente no habilitado para visitas", "error");
    } else {
      li.onclick = () => seleccionarPaciente(paciente.nombre, paciente.area);
    }
    lista.appendChild(li);
  });
}

function mostrarCatalogoPacientes() {
  renderListaPacientes(document.getElementById("buscar-paciente").value);
}

function filtrarPacientes() {
  renderListaPacientes(document.getElementById("buscar-paciente").value);
}

function seleccionarPaciente(nombre, area) {
  document.getElementById("paciente").value = nombre;
  document.getElementById("area").value = area;
  document.getElementById("buscar-paciente").value = "";
  document.getElementById("lista-sugerencias").innerHTML = "";
}

document.addEventListener("click", (e) => {
  const wrap = document.getElementById("buscador-pacientes");
  const lista = document.getElementById("lista-sugerencias");
  if (!wrap || !lista || wrap.contains(e.target)) return;
  lista.innerHTML = "";
});

/* =========================================================================
   H1 y H3: REGISTRO DE VISITAS Y GENERACIÓN DE QR
   ========================================================================= */
document
  .getElementById("formulario-registro")
  .addEventListener("submit", (evento) => {
    evento.preventDefault();

    const telefono = document.getElementById("telefono").value;
    // Criterio de validación: 10 dígitos obligatorios
    if (!/^[0-9]{10}$/.test(telefono)) {
      mostrarToast("Error: Teléfono inválido (deben ser 10 dígitos).", "error");
      return;
    }

    const visitante = new Visitante(
      document.getElementById("nombre").value,
      document.getElementById("documento").value,
      telefono,
    );
    const visita = new Visita(
      visitante,
      document.getElementById("paciente").value,
      document.getElementById("area").value,
    );

    DatabaseTHOS.guardar(DatabaseTHOS.TABLA_VISITAS, visita);

    const token = new GestorQR().generarToken(visita);
    document.getElementById("codigo-qr").innerHTML = "";
    try {
      new QRCode(document.getElementById("codigo-qr"), {
        text: token,
        width: 160,
        height: 160,
        colorDark: "#005088",
        colorLight: "#ffffff",
      });
    } catch (err) {
      console.error(err);
      mostrarToast(
        "No se pudo generar el código QR. Intente de nuevo.",
        "error",
      );
      return;
    }

    document.getElementById("modulo-registro").style.display = "none";
    document.getElementById("contenedor-qr").style.display = "flex";
    mostrarToast("Registro exitoso", "exito");
  });

function limpiarPantalla() {
  document.getElementById("formulario-registro").reset();
  document.getElementById("paciente").value = "";
  document.getElementById("area").value = "";
  volverAlMenu("contenedor-qr");
}

/* =========================================================================
   H4 y H5: ESCÁNER FRONTAL Y REGISTRO DE TIEMPOS (TIMESTAMP)
   ========================================================================= */
let html5QrCode;
let visitaActualEscaneada = null;

function prepararPanelEscaneoInicial() {
  document.getElementById("resultado-escaneo").style.display = "none";
  document.getElementById("acciones-post-qr").style.display = "none";
  document.getElementById("timestamp-confirmacion").innerText = "";
  document.getElementById("btn-confirmar-ingreso").disabled = false;
  document.getElementById("btn-confirmar-ingreso").innerText =
    "Confirmar Ingreso";
  document.getElementById("btn-confirmar-ingreso").style.display =
    "inline-block";
  visitaActualEscaneada = null;
}

function iniciarCamaraEscaneo() {
  const contenedor = document.getElementById("lector-qr");
  contenedor.innerHTML = "";

  html5QrCode = new Html5Qrcode("lector-qr");
  html5QrCode
    .start(
      { facingMode: "user" }, // Ergonomía: Cámara Frontal
      { fps: 15, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        procesarLectura(decodedText);
        html5QrCode.stop();
      },
      (error) => {},
    )
    .catch((err) => mostrarToast("Error al encender cámara", "error"));
}

function abrirEscaner() {
  document.getElementById("modulo-registro").style.display = "none";
  document.getElementById("estacion-guardia").style.display = "block";
  prepararPanelEscaneoInicial();
  iniciarCamaraEscaneo();
}

function procesarLectura(data) {
  const resultado = new GuardiaSeguridad().validarCodigo(data);
  const panel = document.getElementById("resultado-escaneo");
  const info = document.getElementById("info-visitante");

  panel.style.display = "block";
  if (resultado.valido) {
    panel.className = "resultado-panel acceso-autorizado";
    info.innerHTML = `<strong>ACCESO AUTORIZADO</strong><br>Visita: ${resultado.visitaID}<br>Paciente: ${resultado.paciente}`;
    visitaActualEscaneada = resultado.visitaID;
    mostrarToast("QR Válido", "exito");
  } else {
    panel.className = "resultado-panel acceso-denegado";
    info.innerHTML = `<strong>ACCESO DENEGADO</strong><br>Motivo: ${resultado.motivo}`;
    document.getElementById("btn-confirmar-ingreso").style.display = "none";
    mostrarToast("Falla de seguridad", "error");
  }

  document.getElementById("acciones-post-qr").style.display = "block";
}

function escanearOtroQR() {
  document.getElementById("acciones-post-qr").style.display = "none";
  prepararPanelEscaneoInicial();
  iniciarCamaraEscaneo();
}

function cerrarEscanerDesdePost() {
  document.getElementById("acciones-post-qr").style.display = "none";
  volverAlMenu("estacion-guardia");
}

document.getElementById("btn-escanear-otro").addEventListener("click", () => {
  escanearOtroQR();
});

document
  .getElementById("btn-cerrar-desde-post")
  .addEventListener("click", () => {
    cerrarEscanerDesdePost();
  });

document
  .getElementById("btn-confirmar-ingreso")
  .addEventListener("click", () => {
    const ahora = new Date();
    // H5: Inyectamos el Timestamp en la base de datos
    DatabaseTHOS.actualizarVisita(
      visitaActualEscaneada,
      ahora.toISOString(),
      "Dentro del Hospital",
    );

    document.getElementById("timestamp-confirmacion").innerText =
      `Ingreso registrado: ${ahora.toLocaleTimeString()}`;
    mostrarToast("Entrada confirmada", "exito");

    const btn = document.getElementById("btn-confirmar-ingreso");
    btn.disabled = true;
    btn.innerText = "Ingreso Procesado";
  });

/* =========================================================================
   H8: DASHBOARD DE TELEMETRÍA (Monitor de Tiempos)
   ========================================================================= */
let intervaloTelemetria;

function abrirDashboard() {
  document.getElementById("modulo-registro").style.display = "none";
  document.getElementById("modulo-dashboard").style.display = "block";
  renderizarTablaActivos();
  intervaloTelemetria = setInterval(renderizarTablaActivos, 60000); // Actualiza cada minuto
}

function renderizarTablaActivos() {
  const filtro = document.getElementById("filtro-area").value.toLowerCase();
  const tbody = document.getElementById("cuerpo-tabla-activos");
  tbody.innerHTML = "";

  let activos = DatabaseTHOS.obtenerTodo(DatabaseTHOS.TABLA_VISITAS).filter(
    (v) => v.estadoActual === "Dentro del Hospital",
  );

  if (filtro)
    activos = activos.filter((v) =>
      v.areaDestino.toLowerCase().includes(filtro),
    );

  activos.forEach((v) => {
    const horaEntrada = new Date(v.horaEntrada);
    const diffMinutos = Math.floor((new Date() - horaEntrada) / 60000);
    const claseTiempo = diffMinutos > 60 ? "alerta-tiempo" : ""; // H9 Seed (Testigo Rojo)

    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${v.idVisita}</td><td>${v.visitante.nombre}</td><td>${v.areaDestino}</td>
                        <td>${horaEntrada.toLocaleTimeString()}</td><td class="${claseTiempo}">${diffMinutos} min</td>`;
    tbody.appendChild(tr);
  });

  if (activos.length === 0)
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;">No hay visitantes activos</td></tr>';
}

/* =========================================================================
   H10: DESCARGA DE REPORTES (Telemetría OBD2 a CSV)
   ========================================================================= */
function abrirModuloReportes() {
  document.getElementById("modulo-registro").style.display = "none";
  document.getElementById("modulo-reportes").style.display = "block";
}

function generarReporteCSV() {
  const filtroEstado = document.getElementById("filtro-estado-reporte").value;
  let datos = DatabaseTHOS.obtenerTodo(DatabaseTHOS.TABLA_VISITAS);

  if (filtroEstado !== "TODOS")
    datos = datos.filter((v) => v.estadoActual === filtroEstado);
  if (datos.length === 0) {
    mostrarToast("No hay datos para exportar", "error");
    return;
  }

  let csvContent =
    "data:text/csv;charset=utf-8,ID Visita,Nombre Visitante,Documento,Paciente,Area Destino,Estado,Hora Ingreso\n";

  datos.forEach((v) => {
    const nombre = v.visitante.nombre.replace(/,/g, "");
    const paciente = v.paciente.replace(/,/g, "");
    const area = v.areaDestino.replace(/,/g, "");
    const ingreso = v.horaEntrada
      ? new Date(v.horaEntrada).toLocaleString()
      : "Sin ingreso";
    csvContent += `${v.idVisita},${nombre},${v.visitante.documento},${paciente},${area},${v.estadoActual},${ingreso}\n`;
  });

  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = `THOS_Reporte_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  mostrarToast("Reporte descargado", "exito");
}

if (location.hash === "#guardia") {
  abrirEscaner();
}
