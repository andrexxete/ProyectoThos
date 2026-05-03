// CLASES (Nuestros Planos UML)
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
    }
}

// CONTROLADORES DE INTERFAZ (Sensores y Testigos)
function mostrarToast(mensaje, tipo) {
    const toast = document.getElementById("toast");
    toast.textContent = mensaje;
    toast.className = "show " + (tipo === "exito" ? "toast-success" : "toast-error");
    
    setTimeout(() => { toast.className = ""; }, 3000);
}

// EL SWITCH DE ENCENDIDO - Evento principal del formulario
let formularioRegistro = document.getElementById('formulario-registro');
if (formularioRegistro) {
    formularioRegistro.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const documento = document.getElementById('documento').value;
        const telefono = document.getElementById('telefono').value;
        const paciente = document.getElementById('paciente').value;
        const area = document.getElementById('area').value;

        // Validación técnica (GWT Criterio 2)
        const telefonoRegex = /^[0-9]{10}$/;
        if (!telefonoRegex.test(telefono)) {
            mostrarToast("Error: Teléfono inválido (deben ser 10 dígitos).", "error");
            return;
        }

        // 1. Armamos el motor (H1)
        const nuevoVisitante = new Visitante(nombre, documento, telefono);
        const nuevaVisita = new Visita(nuevoVisitante, paciente, area);

        // 2. Generamos la llave inteligente (H3)
        const gestor = new GestorQR();
        const token = gestor.generarToken(nuevaVisita);

        // 3. Renderizamos el QR en el chasis
        document.getElementById('codigo-qr').innerHTML = ""; // Limpiamos si había uno antes
        new QRCode(document.getElementById("codigo-qr"), {
            text: token,
            width: 160,
            height: 160,
            colorDark : "#005088",
            colorLight : "#ffffff"
        });

        // Mostramos el área del QR y ocultamos el formulario
        document.getElementById('formulario-registro').style.display = "none";
        document.getElementById('contenedor-qr').style.display = "block";

        console.log("Sistema THOS - Registro exitoso:", nuevaVisita);
        mostrarToast("QR Generado Exitosamente", "exito");
    });
}

// NUEVA CLASE: Módulo de Encendido (H3)
class GestorQR {
    constructor() {
        this.algoritmo = "THOS-AES-256"; // Simulamos un estándar de cifrado
    }

    generarToken(visita) {
        // Criterio 2: Vinculación obligatoria de datos
        // Creamos una cadena de texto con los IDs (en un proyecto real esto se cifra)
        const datosCifrados = `IDV:${visita.visitante.idVisitante}|IDVIS:${visita.idVisita}|PAC:${visita.paciente}|EXP:${Date.now() + 3600000}`;
        return datosCifrados;
    }
}



function limpiarPantalla() {
    document.getElementById('formulario-registro').reset();
    document.getElementById('formulario-registro').style.display = "block";
    document.getElementById('contenedor-qr').style.display = "none";
}

function volverAlMenu() {
    // Detener el escáner si está activo
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
        }).catch(err => console.error("Error al detener escáner:", err));
    }
    
    // Ocultar estación de guardia y mostrar menú principal
    document.getElementById('contenedor-principal').style.display = "block";
    document.getElementById('estacion-guardia').style.display = "none";
    document.getElementById('resultado-escaneo').style.display = "none";
    mostrarToast("Escáner cerrado", "exito");
}

// NUEVA CLASE: El Sensor de Validación (H4)
class GuardiaSeguridad extends Usuario {
    constructor(nombre, documento, telefono, idEstacion) {
        super(nombre, documento, telefono);
        this.idEstacion = idEstacion;
    }

    validarCodigo(qrData) {
        // Criterio 2: El sistema contrasta el token
        const partes = qrData.split('|');
        if (partes.length < 4) return { valido: false, motivo: "Formato de llave inválido" };

        const expiracion = parseInt(partes[3].split(':')[1]);
        const ahora = Date.now();

        // Criterio 3: Semáforo de acceso (Lógica de tiempo)
        if (ahora > expiracion) {
            return { valido: false, motivo: "QR Expirado - Llave caducada" };
        }

        return {
            valido: true,
            visitanteID: partes[0].split(':')[1],
            paciente: partes[2].split(':')[1]
        };
    }
}

// Lógica para encender la cámara y procesar
let html5QrCode;

function abrirEscaner() {
    document.getElementById('contenedor-principal').style.display = "none";
    document.getElementById('estacion-guardia').style.display = "block";

    html5QrCode = new Html5Qrcode("lector-qr");
    
    // Manejo de errores con try-catch
    try {
        html5QrCode.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                procesarLectura(decodedText);
                html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                }).catch(err => console.error("Error al detener:", err));
            },
            (errorMessage) => {
                // Manejo de errores de escaneo (opcional)
                console.warn("Error de escaneo:", errorMessage);
            }
        );
    } catch (error) {
        console.error("Error al iniciar escáner:", error);
        mostrarToast("Error: No se pudo acceder a la cámara. Verifica los permisos.", "error");
        volverAlMenu();
    }
}

function procesarLectura(data) {
    const guardia = new GuardiaSeguridad("Andrés", "123", "300", "Puerta-Norte");
    const resultado = guardia.validarCodigo(data);
    const panel = document.getElementById('resultado-escaneo');
    const info = document.getElementById('info-visitante');

    panel.style.display = "block";
    
    if (resultado.valido) {
        panel.className = "resultado-panel acceso-autorizado";
        info.innerHTML = `<strong>ACCESO AUTORIZADO</strong><br>Visitante: ${resultado.visitanteID}<br>Paciente: ${resultado.paciente}`;
        mostrarToast("Validación exitosa", "exito");
    } else {
        panel.className = "resultado-panel acceso-denegado";
        info.innerHTML = `<strong>ACCESO DENEGADO</strong><br>Motivo: ${resultado.motivo}`;
        mostrarToast("Falla de seguridad", "error");
    }
}