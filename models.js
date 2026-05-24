/* =========================================================================
   MODELS.JS - CAPA DE DOMINIO (Estructura de Datos)
   ========================================================================= */

class Usuario {
    constructor(nombre, documento, telefono) {
        this.nombre = nombre; 
        this.documento = documento; 
        this.telefono = telefono;
    }
}

// El Visitante hereda de Usuario sin alterar su comportamiento base (LSP)
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