/* =========================================================================
   APP.JS - EL SWITCH DE IGNICIÓN (Entry Point)
   Responsabilidad: Ensamblar las piezas, instanciar servicios y escuchar eventos.
   ========================================================================= */

// 1. Instanciamos la Infraestructura y Servicios (El Motor)
const baseDeDatos = new LocalStorageAdapter();
const generadorToken = new TokenService();

const registroApp = new RegistroService(baseDeDatos, generadorToken);
const seguridadApp = new SeguridadService();

// 2. Conectamos los servicios a la Interfaz Gráfica (El Tablero)
UIController.init(baseDeDatos, seguridadApp);

// 3. LISTENERS DE EVENTOS (El cableado eléctrico principal)

// H1 y H3: Escuchamos el evento de Registrar Visitante
document.getElementById('formulario-registro').addEventListener('submit', (evento) => {
    evento.preventDefault();
    try {
        // Le pasamos los datos puros al Servicio (Lógica aislada)
        const tokenQR = registroApp.registrarNuevaVisita(
            document.getElementById('nombre').value,
            document.getElementById('documento').value,
            document.getElementById('telefono').value,
            document.getElementById('paciente').value,
            document.getElementById('area').value
        );

        // La UI solo se encarga de pintar el QR generado
        document.getElementById('codigo-qr').innerHTML = ""; 
        new QRCode(document.getElementById("codigo-qr"), {
            text: tokenQR, width: 160, height: 160, colorDark : "#005088", colorLight : "#ffffff"
        });

        document.getElementById('formulario-registro').reset();
        document.getElementById('modulo-registro').style.display = "none";
        document.getElementById('contenedor-qr').style.display = "flex";
        UIController.mostrarToast("Registro exitoso", "exito");
    } catch (error) {
        UIController.mostrarToast(error.message, "error");
    }
});

// H5: Escuchamos el evento de Confirmar Ingreso (El Timestamp)
document.getElementById('btn-confirmar-ingreso').addEventListener('click', () => {
    const ahora = new Date();
    
    // Inyectamos el Timestamp en la BD a través del adaptador (H0)
    baseDeDatos.actualizarVisita(UIController.visitaActualEscaneada, ahora.toISOString(), "Dentro del Hospital");

    document.getElementById('timestamp-confirmacion').innerText = `Ingreso registrado: ${ahora.toLocaleTimeString()}`;
    UIController.mostrarToast("Entrada confirmada", "exito");
    
    const btn = document.getElementById('btn-confirmar-ingreso');
    btn.disabled = true; 
    btn.innerText = "Ingreso Procesado";
});