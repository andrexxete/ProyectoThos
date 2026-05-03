# THOS - Total Hospital Security

### Visión General del Proyecto

**THOS (Total Hospital Security)** es una aplicación web diseñada para digitalizar, optimizar y automatizar la gestión y el control de acceso de visitantes dentro de un entorno hospitalario. El objetivo principal es pasar de los registros manuales en papel a un sistema digital seguro que rastrea las visitas, genera permisos temporales mediante códigos QR y proporciona herramientas de monitoreo y análisis en tiempo real para mejorar la seguridad operativa.

### Glosario de Términos del Proyecto

Para asegurar que hablamos el mismo idioma, utilizaremos la siguiente terminología:

* **THOS:** El sistema completo.
* **Backlog / Product Backlog:** El inventario priorizado de todas las funcionalidades requeridas para el proyecto, organizadas en Historias de Usuario.
* **H[Número]:** Referencia a una Historia de Usuario específica (ej: H1, H4).
* **MVP (Producto Mínimo Viable):** La versión inicial funcional del producto que incluye el núcleo esencial de características (Historias H1, H3, H4, H5) listo para pruebas piloto.
* **Sprint:** Ciclos cortos de desarrollo (ej: 2 semanas) donde se completan historias específicas.
* **Daily Scrum / Daily:** La reunión diaria de sincronización de 15 minutos para el equipo de desarrollo.
* **Definition of Done (DoD):** El conjunto de criterios que cada historia debe cumplir para considerarse finalizada al 100%.
* **POO (Programación Orientada a Objetos):** El paradigma de programación que utilizaremos en JavaScript para estructurar el software.

### Objetivos Principales (Historias de Usuario Priorizadas)

El desarrollo se guiará por las siguientes historias de usuario, priorizadas según su valor operativo para el MVP:

#### 🟢 MVP: Núcleo de Registro y Validación

1.  **H1 - Registro detallado de visitantes (Prioridad: High, 5 pts):** Como sistema, quiero registrar los datos de un visitante para programar su visita.
2.  **H3 - Generación de código QR seguro (Prioridad: High, 3 pts):** Como sistema, quiero generar un código QR cifrado asociado a la visita autorizada.
3.  **H4 - Escaneo y validación de acceso (Prioridad: High, 5 pts):** Como guardia, quiero escanear el QR del visitante para validar su ingreso.
4.  **H5 - Registro automático de tiempos de entrada/salida (Prioridad: High, 2 pts):** Como visitante, quiero que mi entrada y salida se registren automáticamente.

#### 🟡 Post-MVP: Monitoreo y Administración

5.  **H2 - Búsqueda avanzada de pacientes (Prioridad: Medium, 3 pts):** Como visitante, quiero buscar un paciente para agendar una visita.
6.  **H8 - Visualización de visitantes activos (Prioridad: Medium, 5 pts):** Como administrador, quiero ver en tiempo real quién se encuentra dentro del hospital.
7.  **H10 - Generación paramétrica de reportes (Prioridad: Medium, 8 pts):** Como administrador, quiero descargar reportes de auditoría y análisis de flujo.

#### 🔴 Funcionalidades Avanzadas de Navegación y Seguridad

8.  **H6 - Visualización del mapa dinámico del hospital (Prioridad: Low, 13 pts):** Como visitante, quiero ver un mapa interactivo para orientarme.
9.  **H7 - Trazado de rutas dinámicas / Navegación paso a paso (Prioridad: Low, 8 pts):** Como visitante, quiero recibir indicaciones de ruta desde mi ubicación actual hasta el pabellón de destino.
10. **H9 - Alertas por permanencia excedida (Prioridad: Low, 5 pts):** Como guardia, quiero recibir alertas si un visitante supera el tiempo de visita permitido.

### Arquitectura Lógica (Diagrama de Clases)

El desarrollo del software se basa en las siguientes clases y relaciones clave:

* **Usuario (Padre):** Estructura base para Visitante, GuardiaSeguridad y Administrador.
* **Visita:** Almacena los registros de cada ingreso y salida, calcula tiempos y valida estado.
* **GestorQR:** Clase especializada en la generación y decodificación de tokens de seguridad para el acceso.

### Stack Tecnológico

El proyecto se desarrollará utilizando el stack de tecnologías web estándar:
* **JavaScript:** Lógica de negocio (frontend y backend, si aplica).
* **CSS:** Diseño y estilos.
* **HTML:** Estructura de las interfaces.

### Documento de Historias de Usuario

Este documento amplía cada historia priorizada con criterios de aceptación y notas de implementación.

#### H1 - Registro detallado de visitantes
- **Como:** Sistema.
- **Quiero:** registrar los datos de un visitante para programar su visita.
- **Criterios de aceptación:**
  * El sistema debe permitir crear una solicitud de visita con nombre completo del visitante, documento de identidad, paciente a visitar, área de destino, fecha/hora programada y duración estimada.
  * Debe validar campos obligatorios y formatos básicos (correo, teléfono, documento).
  * Al confirmar, debe guardar el registro en almacenamiento local o persistente.
  * Debe generar un identificador único de visita.
- **Notas:** Este flujo es la base del MVP; se recomienda comenzar con un formulario simple y validaciones front-end.

#### H2 - Búsqueda avanzada de pacientes
- **Como:** Visitante.
- **Quiero:** buscar un paciente para agendar una visita.
- **Criterios de aceptación:**
  * Debe existir una búsqueda por nombre, número de habitación y especialidad.
  * El resultado debe mostrar datos básicos del paciente y permitir seleccionar el destino para la visita.
  * Si no hay coincidencias, debe mostrar un mensaje claro.
- **Notas:** Puede implementarse con un filtro local para prototipos, y una API o mock de datos hospitalarios para producción.

#### H3 - Generación de código QR seguro
- **Como:** Sistema.
- **Quiero:** generar un código QR cifrado asociado a la visita autorizada.
- **Criterios de aceptación:**
  * El sistema debe producir un QR único tras registrar la visita.
  * El QR debe contener un token cifrado o un identificador seguro que no sea legible directamente.
  * Debe ser posible llevar el QR en pantalla o imprimirlo.
- **Notas:** Usar librerías JavaScript de generación de QR y un esquema simple de tokenización o hash para el MVP.

#### H4 - Escaneo y validación de acceso
- **Como:** Guardia.
- **Quiero:** escanear el QR del visitante para validar su ingreso.
- **Criterios de aceptación:**
  * El sistema debe aceptar un QR escaneado y decodificar la información.
  * Debe verificar que la visita exista y esté activa en la fecha/hora actual.
  * Si es válido, debe marcar la entrada y permitir el acceso.
  * Si es inválido, debe mostrar un mensaje de rechazo claro.
- **Notas:** Para prototipos se puede simular el escaneo con un campo de texto, y más adelante integrar la cámara.

#### H5 - Registro automático de tiempos de entrada/salida
- **Como:** Visitante.
- **Quiero:** que mi entrada y salida se registren automáticamente.
- **Criterios de aceptación:**
  * Al validar el QR de entrada, el sistema debe guardar el tiempo de acceso.
  * Al finalizar la visita, el sistema debe permitir registrar la salida y guardar la hora de salida.
  * Debe calcular la duración real de la visita.
- **Notas:** Incluir un estado de visita (`pendiente`, `activo`, `finalizado`) para seguimiento.

#### H6 - Visualización del mapa dinámico del hospital
- **Como:** Visitante.
- **Quiero:** ver un mapa interactivo para orientarme.
- **Criterios de aceptación:**
  * El sistema debe mostrar un plano del hospital con áreas y secciones identificadas.
  * Debe permitir acercar/alejar y seleccionar destinos.
  * Debe resaltar el destino de la visita.
- **Notas:** Puede comenzar con una imagen interactiva y más adelante reemplazarse por un mapa SVG o canvas.

#### H7 - Trazado de rutas dinámicas / Navegación paso a paso
- **Como:** Visitante.
- **Quiero:** recibir indicaciones de ruta desde mi ubicación actual hasta el pabellón de destino.
- **Criterios de aceptación:**
  * El sistema debe mostrar un recorrido dentro del hospital desde un punto inicial fijo o móvil.
  * Debe dividir la ruta en pasos claros y secuenciales.
  * Si el destino cambia, la ruta debe actualizarse.
- **Notas:** Esta historia se aborda mejor con un modelo de mapa estructurado o grafo de nodos.

#### H8 - Visualización de visitantes activos
- **Como:** Administrador.
- **Quiero:** ver en tiempo real quién se encuentra dentro del hospital.
- **Criterios de aceptación:**
  * Debe mostrar la lista de visitantes con estado `activo`.
  * Debe incluir nombre, paciente visitado, área y hora de entrada.
  * Debe permitir filtrar por área o guardia.
- **Notas:** Idealmente se actualiza mediante polling o websockets si hay backend.

#### H9 - Alertas por permanencia excedida
- **Como:** Guardia.
- **Quiero:** recibir alertas si un visitante supera el tiempo de visita permitido.
- **Criterios de aceptación:**
  * El sistema debe comparar el tiempo de visita planificado con la duración real.
  * Debe generar una alerta visual cuando se exceda el tiempo definido.
  * Debe listar los visitantes con visitas vencidas.
- **Notas:** Definir un margen de tolerancia y la posibilidad de renovar la visita.

#### H10 - Generación paramétrica de reportes
- **Como:** Administrador.
- **Quiero:** descargar reportes de auditoría y análisis de flujo.
- **Criterios de aceptación:**
  * Debe permitir seleccionar rango de fechas, áreas y tipo de visita.
  * Debe producir un reporte en formato descargable (por ejemplo, CSV o PDF).
  * Debe incluir métricas como número de visitantes, tiempo promedio y alertas generadas.
- **Notas:** Para MVP, un exportador CSV es suficiente; PDF queda como evolución.

classDiagram
    class Usuario {
        <<Clase Padre>>
        +String idUsuario
        +String nombreCompleto
        +String documentoIdentidad
        +String telefono
        +String correo
        +String password
        +iniciarSesion()
        +cerrarSesion()
    }

    class Visitante {
        +String fotoPerfil
        +buscarPaciente(nombrePaciente)
        +solicitarQR()
        +verMapaHospital()
    }

    class GuardiaSeguridad {
        +String idEstacion
        +escanearQR(codigoQR)
        +validarAcceso(Visita)
        +recibirAlertaPermanencia(Visita)
    }

    class Administrador {
        +String nivelAcceso
        +verVisitantesActivos()
        +generarReporte(fechaInicio, fechaFin)
    }

    class Visita {
        +String idVisita
        +Date horaEntrada
        +Date horaSalida
        +String estadoActual
        +String pacienteDestino
        +String areaDestino
        +registrarEntrada()
        +registrarSalida()
        +calcularTiempoPermanencia()
    }

    class GestorQR {
        +String algoritmoCifrado
        +Date fechaExpiracion
        +generarCodigo(Visitante, Visita)
        +decodificarCodigo(String qrData)
    }

    Usuario <|-- Visitante
    Usuario <|-- GuardiaSeguridad
    Usuario <|-- Administrador

    Visitante "1" -- "*" Visita : realiza
    GuardiaSeguridad "1" -- "*" Visita : autoriza
    Visita "*" -- "1" GestorQR : requiere



***



