// CLASES (Nuestros Planos UML)
/* =========================================
   H0: SISTEMA DE PERSISTENCIA (BASE DE DATOS)
   ========================================= */
class DatabaseTHOS {
    static TABLA_VISITAS = 'thos_visitas';
    static TABLA_PACIENTES = 'thos_pacientes';

    static guardar(tabla, datos) {
        let registros = this.obtenerTodo(tabla);
        registros.push(datos);
        localStorage.setItem(tabla, JSON.stringify(registros));
    }

    static obtenerTodo(tabla) {
        const datos = localStorage.getItem(tabla);
        return datos ? JSON.parse(datos) : [];
    }
}

// INVENTARIO INICIAL (Bodega de pacientes)
function inicializarBodegaPacientes() {
    let pacientes = DatabaseTHOS.obtenerTodo(DatabaseTHOS.TABLA_PACIENTES);
    if (pacientes.length === 0) {
        const inventario = [
            { id: "P-001", nombre: "Carlos Ramírez", area: "Cardiología - Hab 402", estado: "Activo" },
            { id: "P-002", nombre: "Lucía Gómez", area: "UCI - Cama 05", estado: "Restringido" },
            { id: "P-003", nombre: "Marta Valencia", area: "Maternidad - Hab 104", estado: "Activo" },
            { id: "P-004", nombre: "Roberto Gómez", area: "Traumatología - Hab 210", estado: "Activo" }
        ];
        localStorage.setItem(DatabaseTHOS.TABLA_PACIENTES, JSON.stringify(inventario));
    }
}
inicializarBodegaPacientes();

/* =========================================
   CLASES (Planos UML)
   ========================================= */
class Usuario {
    constructor(nombre, documento, telefono) {
        this.nombre = nombre; this.documento = documento; this.telefono = telefono;
    }
}

class Visitante extends Usuario {
    constructor(nombre, documento, telefono) {
        super(nombre, documento, telefono);
        this.idVisitante = 'V-' + Math.floor(Math.random() * 10000);
    }
}

class Visita {
    constructor(visitante, paciente, area) {
        this.idVisita = 'VIS-' + Math.floor(Math.random() * 10000);
        this.visitante = visitante;
        this.paciente = paciente;
        this.areaDestino = area;
        this.estadoActual = "Registrado";
        this.horaEntrada = null;
    }
}

class GestorQR {
    generarToken(visita) {
        // ID_Visitante | ID_Visita | Paciente | Expiración (+1 hora)
        return `IDV:${visita.visitante.idVisitante}|IDVIS:${visita.idVisita}|PAC:${visita.paciente}|EXP:${Date.now() + 3600000}`;
    }
}

class GuardiaSeguridad {
    validarCodigo(qrData) {
        const partes = qrData.split('|');
        if (partes.length < 4) return { valido: false, motivo: "Formato de llave inválido" };
        const expiracion = parseInt(partes[3].split(':')[1]);
        if (Date.now() > expiracion) return { valido: false, motivo: "QR Expirado - Llave caducada" };
        
        return { valido: true, visitanteID: partes[0].split(':')[1], visitaID: partes[1].split(':')[1], paciente: partes[2].split(':')[1] };
    }
}

/* =========================================
   CONTROLADORES DE INTERFAZ Y LÓGICA
   ========================================= */
function mostrarToast(mensaje, tipo) {
    const toast = document.getElementById("toast");
    toast.textContent = mensaje;
    toast.className = "show " + (tipo === "exito" ? "toast-success" : "toast-error");
    setTimeout(() => { toast.className = ""; }, 3000);
}

// Lógica H2: Buscador de Pacientes
function filtrarPacientes() {
    const query = document.getElementById('buscar-paciente').value.toLowerCase();
    const lista = document.getElementById('lista-sugerencias');
    lista.innerHTML = '';

    if (query.length < 3) return;

    const pacientes = DatabaseTHOS.obtenerTodo(DatabaseTHOS.TABLA_PACIENTES);
    const resultados = pacientes.filter(p => p.nombre.toLowerCase().includes(query));

    resultados.forEach(paciente => {
        const li = document.createElement('li');
        li.textContent = `${paciente.nombre} (${paciente.area})`;
        
        if (paciente.estado === "Restringido") {
            li.classList.add('restringido');
            li.textContent += " ⛔ RESTRINGIDO";
            li.onclick = () => mostrarToast("Paciente no habilitado para visitas", "error");
        } else {
            li.onclick = () => seleccionarPaciente(paciente.nombre, paciente.area);
        }
        lista.appendChild(li);
    });
}

function seleccionarPaciente(nombre, area) {
    document.getElementById('paciente').value = nombre;
    document.getElementById('area').value = area;
    document.getElementById('buscar-paciente').value = '';
    document.getElementById('lista-sugerencias').innerHTML = ''; 
}

// Lógica H1 y H3: Registro y Generación de QR
document.getElementById('formulario-registro').addEventListener('submit', (evento) => {
    evento.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const documento = document.getElementById('documento').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const paciente = document.getElementById('paciente').value.trim();
    const area = document.getElementById('area').value.trim();

    if (!nombre || !documento || !paciente || !area) {
        mostrarToast("Complete todos los datos y seleccione un paciente antes de generar la llave.", "error");
        return;
    }

    if (!/^[0-9]{10}$/.test(telefono)) {
        mostrarToast("Error: Teléfono inválido (deben ser 10 dígitos).", "error");
        return;
    }

    const nuevoVisitante = new Visitante(nombre, documento, telefono);
    const nuevaVisita = new Visita(nuevoVisitante, paciente, area);

    // Guardar en BD (H0)
    DatabaseTHOS.guardar(DatabaseTHOS.TABLA_VISITAS, nuevaVisita);

    // Generar QR (H3)
    const gestor = new GestorQR();
    const token = gestor.generarToken(nuevaVisita);

    if (typeof QRCode === "undefined") {
        mostrarToast("Error: no se pudo cargar la librería de QR. Compruebe la conexión a internet.", "error");
        return;
    }

    document.getElementById('codigo-qr').innerHTML = ""; 
    new QRCode(document.getElementById("codigo-qr"), {
        text: token, width: 160, height: 160, colorDark : "#005088", colorLight : "#ffffff"
    });

    document.getElementById('modulo-registro').style.display = "none";
    document.getElementById('contenedor-qr').style.display = "flex";
    mostrarToast("Registro guardado en BD Local", "exito");
});

function limpiarPantalla() {
    document.getElementById('formulario-registro').reset();
    document.getElementById('paciente').value = "";
    document.getElementById('area').value = "";
    document.getElementById('contenedor-qr').style.display = "none";
    document.getElementById('menu-principal').style.display = "block";
}

// Lógica H4 y H5: Escáner Frontal y Timestamp
let html5QrCode;
let visitaActualEscaneada = null; // Guardará el ID de la visita leída

function abrirEscaner() {
    document.getElementById('modulo-registro').style.display = "none";
    document.getElementById('contenedor-qr').style.display = "none";
    document.getElementById('estacion-guardia').style.display = "block";
    document.getElementById('resultado-escaneo').style.display = "none";
    
    // Reseteamos botón
    document.getElementById('btn-confirmar-ingreso').disabled = false;
    document.getElementById('btn-confirmar-ingreso').innerText = "Confirmar Ingreso";
    document.getElementById('timestamp-confirmacion').innerText = "";

    html5QrCode = new Html5Qrcode("lector-qr");
    html5QrCode.start(
        { facingMode: "user" }, // Cámara frontal
        { fps: 15, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            procesarLectura(decodedText);
            html5QrCode.stop();
        },
        (errorMessage) => { }
    ).catch(err => {
        mostrarToast("Aviso: No se pudo encender la cámara.", "error");
    });
}

function volverAlMenu() {
    if(html5QrCode) html5QrCode.stop().catch(err => console.log(err));
    document.getElementById('estacion-guardia').style.display = "none";
    document.getElementById('modulo-registro').style.display = "none";
    document.getElementById('contenedor-qr').style.display = "none";
    document.getElementById('menu-principal').style.display = "block";
}

function procesarLectura(data) {
    const guardia = new GuardiaSeguridad();
    const resultado = guardia.validarCodigo(data);
    const panel = document.getElementById('resultado-escaneo');
    const info = document.getElementById('info-visitante');

    panel.style.display = "block";
    
    if (resultado.valido) {
        panel.className = "resultado-panel acceso-autorizado";
        info.innerHTML = `<strong>ACCESO AUTORIZADO</strong><br>Visitante ID: ${resultado.visitanteID}<br>Paciente: ${resultado.paciente}`;
        visitaActualEscaneada = resultado.visitaID; // Guardamos para el timestamp
        mostrarToast("QR Válido", "exito");
    } else {
        panel.className = "resultado-panel acceso-denegado";
        info.innerHTML = `<strong>ACCESO DENEGADO</strong><br>Motivo: ${resultado.motivo}`;
        document.getElementById('btn-confirmar-ingreso').style.display = "none";
        mostrarToast("Falla de seguridad", "error");
    }
}

document.getElementById('btn-confirmar-ingreso').addEventListener('click', () => {
    // Lógica H5: Registro de Tiempos
    const ahora = new Date();
    const horaFormateada = ahora.toLocaleTimeString();
    
    // Aquí actualizaríamos la BD local para buscar la visitaActualEscaneada y ponerle la horaEntrada
    let visitasDB = DatabaseTHOS.obtenerTodo(DatabaseTHOS.TABLA_VISITAS);
    let indice = visitasDB.findIndex(v => v.idVisita === visitaActualEscaneada);
    
    if (indice !== -1) {
        visitasDB[indice].horaEntrada = ahora.toISOString();
        visitasDB[indice].estadoActual = "Dentro del Hospital";
        localStorage.setItem(DatabaseTHOS.TABLA_VISITAS, JSON.stringify(visitasDB));
    }

    document.getElementById('timestamp-confirmacion').innerText = `Ingreso en sistema BD: ${ahora.toLocaleDateString()} - ${horaFormateada}`;
    mostrarToast(`Entrada confirmada`, "exito");
    
    const btn = document.getElementById('btn-confirmar-ingreso');
    btn.disabled = true;
    btn.innerText = "Ingreso Procesado";
});

/* =========================================
   LÓGICA H8: DASHBOARD DE MONITOREO
   ========================================= */
let intervaloTelemetria; // Cable para el cronómetro automático

function abrirRegistro() {
    document.getElementById('menu-principal').style.display = "none";
    document.getElementById('modulo-registro').style.display = "block";
}

function abrirDashboard() {
    // Apagamos los otros paneles
    document.getElementById('menu-principal').style.display = "none";
    document.getElementById('modulo-registro').style.display = "none";
    document.getElementById('estacion-guardia').style.display = "none";
    
    // Encendemos el tablero
    document.getElementById('modulo-dashboard').style.display = "block";
    
    // CRITERIO 2: Sincronización automática
    renderizarTablaActivos();
    // Actualizamos el reloj cada 60 segundos para ver el tiempo en vivo
    intervaloTelemetria = setInterval(renderizarTablaActivos, 60000);
}

function cerrarDashboard() {
    document.getElementById('modulo-dashboard').style.display = "none";
    document.getElementById('menu-principal').style.display = "block";
    clearInterval(intervaloTelemetria); // Apagamos el cronómetro para ahorrar batería
}

function renderizarTablaActivos() {
    const visitas = DatabaseTHOS.obtenerTodo(DatabaseTHOS.TABLA_VISITAS);
    const filtro = document.getElementById('filtro-area').value.toLowerCase();
    const tbody = document.getElementById('cuerpo-tabla-activos');
    
    tbody.innerHTML = ''; // Limpiamos la pantalla antes de inyectar datos frescos

    // Filtramos solo los motores en marcha (visitantes dentro)
    let activos = visitas.filter(v => v.estadoActual === "Dentro del Hospital");

    // Aplicamos el filtro de texto si el usuario escribió algo
    if (filtro) {
        activos = activos.filter(v => v.areaDestino.toLowerCase().includes(filtro));
    }

    // CRITERIO 4: Testigo de Aforo Máximo (Sensor de temperatura)
    // Supongamos que la UCI solo soporta 2 visitantes simultáneos
    let conteoUCI = activos.filter(v => v.areaDestino.includes("UCI")).length;
    if (conteoUCI >= 2) {
        mostrarToast("⚠️ ALERTA: Aforo máximo alcanzado en sector UCI", "error");
    }

    // Renderizamos las filas
    activos.forEach(v => {
        const tr = document.createElement('tr');
        
        // Calculamos el tiempo transcurrido desde el ingreso
        const horaEntrada = new Date(v.horaEntrada);
        const ahora = new Date();
        const diffMs = ahora - horaEntrada;
        const diffMinutos = Math.floor(diffMs / 60000); // Convertimos milisegundos a minutos

        // Si lleva más de 60 minutos, encendemos el testigo rojo (Semilla para la H9)
        const claseTiempo = diffMinutos > 60 ? 'alerta-tiempo' : '';

        tr.innerHTML = `
            <td><strong>${v.idVisita}</strong></td>
            <td>${v.visitante.nombre}</td>
            <td>${v.areaDestino}</td>
            <td>${horaEntrada.toLocaleTimeString()}</td>
            <td class="${claseTiempo}">${diffMinutos} min</td>
        `;
        tbody.appendChild(tr);
    });

    // Si no hay nadie, mostramos un mensaje vacío
    if (activos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #64748b;">No hay visitantes activos en este momento</td></tr>';
    }
}

