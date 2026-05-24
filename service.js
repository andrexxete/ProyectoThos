/* =========================================================================
   SERVICES.JS - CAPA DE LÓGICA DE NEGOCIO E INFRAESTRUCTURA
   ========================================================================= */

// H0: Abstracción del almacenamiento (Principio Abierto/Cerrado - OCP)
class LocalStorageAdapter {
    constructor() {
        this.TABLA_VISITAS = 'thos_visitas';
        this.TABLA_PACIENTES = 'thos_pacientes';
        this._inicializarBodega();
    }

    _inicializarBodega() {
        if (this.obtenerTodo(this.TABLA_PACIENTES).length === 0) {
            const inventario = [
                { id: "P-001", nombre: "Carlos Ramírez", area: "Cardiología - Hab 402", estado: "Activo" },
                { id: "P-002", nombre: "Lucía Gómez", area: "UCI - Cama 05", estado: "Restringido" },
                { id: "P-003", nombre: "Marta Valencia", area: "Maternidad - Hab 104", estado: "Activo" }
            ];
            localStorage.setItem(this.TABLA_PACIENTES, JSON.stringify(inventario));
        }
    }

    guardar(tabla, datos) {
        let registros = this.obtenerTodo(tabla);
        registros.push(datos);
        localStorage.setItem(tabla, JSON.stringify(registros));
    }

    obtenerTodo(tabla) {
        const datos = localStorage.getItem(tabla);
        return datos ? JSON.parse(datos) : [];
    }

    actualizarVisita(idVisita, horaEntrada, estado) {
        let visitas = this.obtenerTodo(this.TABLA_VISITAS);
        let indice = visitas.findIndex(v => v.idVisita === idVisita);
        if (indice !== -1) {
            visitas[indice].horaEntrada = horaEntrada;
            visitas[indice].estadoActual = estado;
            localStorage.setItem(this.TABLA_VISITAS, JSON.stringify(visitas));
        }
    }
}

// H3: Servicio especializado en cifrado y tokens QR (SRP)
class TokenService {
    generarQR(visita) {
        return `IDV:${visita.visitante.idVisitante}|IDVIS:${visita.idVisita}|PAC:${visita.paciente}|EXP:${Date.now() + 3600000}`;
    }
}

// H4 y H5: Servicio especializado en reglas de seguridad (SRP)
class SeguridadService {
    validarAcceso(qrData) {
        const partes = qrData.split('|');
        if (partes.length < 4) return { valido: false, motivo: "Formato QR inválido" };
        
        const expiracion = parseInt(partes[3].split(':')[1]);
        if (Date.now() > expiracion) return { valido: false, motivo: "QR Expirado (Caducado)" };
        
        return { valido: true, visitanteID: partes[0].split(':')[1], visitaID: partes[1].split(':')[1], paciente: partes[2].split(':')[1] };
    }
}

// H1: Motor central de Registro (Principio de Inversión de Dependencias - DIP)
class RegistroService {
    constructor(storageAdapter, tokenService) {
        this.db = storageAdapter;        // Se inyecta la base de datos
        this.tokenizador = tokenService; // Se inyecta el generador QR
    }

    registrarNuevaVisita(nombre, doc, tel, paciente, area) {
        if (!/^[0-9]{10}$/.test(tel)) throw new Error("Teléfono inválido (deben ser 10 dígitos)");
        
        const visitante = new Visitante(nombre, doc, tel);
        const visita = new Visita(visitante, paciente, area);
        
        this.db.guardar(this.db.TABLA_VISITAS, visita);
        return this.tokenizador.generarQR(visita); 
    }
}