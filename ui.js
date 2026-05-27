/* =========================================================================
   UI.JS - CONTROLADOR DE INTERFAZ
   Responsabilidad: Manipular el DOM y reaccionar a las interacciones.
   ========================================================================= */

const UIController = {
    // Estas variables se "inyectan" desde app.js para aplicar Inversión de Dependencias
    db: null,
    seguridadApp: null,
    
    // Variables de estado de la interfaz
    html5QrCode: null,
    visitaActualEscaneada: null,
    intervaloTelemetria: null,

    // Función de inicialización
    init: function(databaseInstance, seguridadInstance) {
        this.db = databaseInstance;
        this.seguridadApp = seguridadInstance;
        setTimeout(() => this.cargarPacientes(), 100); // Cargar pacientes con delay
    },

    mostrarToast: (mensaje, tipo) => {
        const toast = document.getElementById("toast");
        toast.textContent = mensaje;
        toast.className = "show " + (tipo === "exito" ? "toast-success" : "toast-error");
        setTimeout(() => { toast.className = ""; }, 3000);
    },

    volverAlMenu: (moduloActual) => {
        if(UIController.html5QrCode) {
            UIController.html5QrCode.stop().catch(() => {});
        }
        clearInterval(UIController.intervaloTelemetria);
        document.getElementById(moduloActual).style.display = "none";
        document.getElementById('modulo-registro').style.display = "block";
        document.getElementById('formulario-registro').reset();
        UIController.cargarPacientes(); // Recargar pacientes
    },

    // H2: Buscador - Cargar pacientes en el select
    cargarPacientes: function() {
        if (!this.db) {
            console.error("Base de datos no inicializada");
            return;
        }
        
        const select = document.getElementById('buscar-paciente');
        if (!select) {
            console.error("Select 'buscar-paciente' no encontrado");
            return;
        }
        
        select.innerHTML = '<option value="">-- Seleccione un paciente --</option>';

        const pacientes = this.db.obtenerTodo(this.db.TABLA_PACIENTES);
        console.log("Pacientes cargados:", pacientes); // Debug

        pacientes.forEach(paciente => {
            const option = document.createElement('option');
            option.value = paciente.nombre + '|' + paciente.area;
            option.textContent = `${paciente.nombre} (${paciente.area})`;
            if (paciente.estado === "Restringido") {
                option.textContent += " ⛔ RESTRINGIDO";
                option.disabled = true;
            }
            select.appendChild(option);
        });
    },

    // H2: Seleccionar paciente del dropdown
    seleccionarPaciente: () => {
        const select = document.getElementById('buscar-paciente');
        const valor = select.value;
        
        if (!valor) {
            document.getElementById('paciente').value = '';
            document.getElementById('area').value = '';
            return;
        }

        const [nombre, area] = valor.split('|');
        document.getElementById('paciente').value = nombre;
        document.getElementById('area').value = area;
    },

    // H4: Escáner Frontal
    abrirEscaner: () => {
        document.getElementById('modulo-registro').style.display = "none";
        document.getElementById('estacion-guardia').style.display = "block";
        document.getElementById('resultado-escaneo').style.display = "none";
        
        document.getElementById('btn-confirmar-ingreso').disabled = false;
        document.getElementById('btn-confirmar-ingreso').innerText = "Confirmar Ingreso";
        document.getElementById('btn-confirmar-ingreso').style.display = "inline-block";

        UIController.html5QrCode = new Html5Qrcode("lector-qr");
        UIController.html5QrCode.start(
            { facingMode: "user" }, { fps: 15, qrbox: { width: 250, height: 250 } },
            (data) => {
                // Llama al servicio de seguridad sin mezclar lógica aquí
                const resultado = UIController.seguridadApp.validarAcceso(data); 
                const panel = document.getElementById('resultado-escaneo');
                const info = document.getElementById('info-visitante');

                panel.style.display = "block";
                if (resultado.valido) {
                    panel.className = "resultado-panel acceso-autorizado";
                    info.innerHTML = `<strong>ACCESO AUTORIZADO</strong><br>Visita: ${resultado.visitaID}<br>Paciente: ${resultado.paciente}`;
                    UIController.visitaActualEscaneada = resultado.visitaID;
                    UIController.mostrarToast("QR Válido", "exito");
                } else {
                    panel.className = "resultado-panel acceso-denegado";
                    info.innerHTML = `<strong>ACCESO DENEGADO</strong><br>Motivo: ${resultado.motivo}`;
                    document.getElementById('btn-confirmar-ingreso').style.display = "none";
                    UIController.mostrarToast("Falla de seguridad", "error");
                }
                UIController.html5QrCode.stop();
            },
            (error) => {}
        ).catch(() => UIController.mostrarToast("Error de cámara", "error"));
    },

    // H8: Dashboard
    abrirDashboard: () => {
        document.getElementById('modulo-registro').style.display = "none";
        document.getElementById('modulo-dashboard').style.display = "block";
        UIController.renderizarTablaActivos();
        UIController.intervaloTelemetria = setInterval(UIController.renderizarTablaActivos, 60000);
    },

    renderizarTablaActivos: () => {
        const filtro = document.getElementById('filtro-area').value.toLowerCase();
        const tbody = document.getElementById('cuerpo-tabla-activos');
        tbody.innerHTML = ''; 

        let activos = UIController.db.obtenerTodo(UIController.db.TABLA_VISITAS).filter(v => v.estadoActual === "Dentro del Hospital");
        if (filtro) activos = activos.filter(v => v.areaDestino.toLowerCase().includes(filtro));

        activos.forEach(v => {
            const diffMinutos = Math.floor((new Date() - new Date(v.horaEntrada)) / 60000);
            const claseTiempo = diffMinutos > 60 ? 'alerta-tiempo' : ''; // H9 Testigo Rojo
            tbody.innerHTML += `<tr><td>${v.idVisita}</td><td>${v.visitante.nombre}</td><td>${v.areaDestino}</td>
                                <td>${new Date(v.horaEntrada).toLocaleTimeString()}</td><td class="${claseTiempo}">${diffMinutos} min</td></tr>`;
        });
        if (activos.length === 0) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay visitantes activos</td></tr>';
    },

    // H10: Reportes CSV
    abrirModuloReportes: () => {
        document.getElementById('modulo-registro').style.display = "none";
        document.getElementById('modulo-reportes').style.display = "block";
    },

    generarReporteCSV: () => {
        const filtroEstado = document.getElementById('filtro-estado-reporte').value;
        let datos = UIController.db.obtenerTodo(UIController.db.TABLA_VISITAS);
        
        if (filtroEstado !== "TODOS") datos = datos.filter(v => v.estadoActual === filtroEstado);
        if (datos.length === 0) return UIController.mostrarToast("No hay datos para exportar", "error");

        let csvContent = "data:text/csv;charset=utf-8,ID Visita,Nombre Visitante,Documento,Paciente,Area Destino,Estado,Hora Ingreso\n";
        datos.forEach(v => {
            const ingreso = v.horaEntrada ? new Date(v.horaEntrada).toLocaleString() : "Sin ingreso";
            csvContent += `${v.idVisita},${v.visitante.nombre.replace(/,/g,"")},${v.visitante.documento},${v.paciente.replace(/,/g,"")},${v.areaDestino.replace(/,/g,"")},${v.estadoActual},${ingreso}\n`;
        });

        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `THOS_Reporte_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        UIController.mostrarToast("Reporte descargado", "exito");
    }
};