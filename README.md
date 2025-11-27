# Prueba OSRM + VROOM Colombia

Solución integral de logística y ruteo para Colombia. Este proyecto integra 5 instancias de OSRM (con perfiles de vehículos personalizados) y el motor de optimización VROOM para resolver problemas complejos de logística (VRP, TSP).

## 🚀 Características Principales

### Multi-Perfil: Ruteo específico para:

- 🚗 Carro: Tráfico estándar.
- 🛵 Moto: Alta agilidad, ignora algunas restricciones de giro.
- 🚐 Van: Vehículo de reparto ligero (3.5T).
- 🚚 Camión Medio: Restricciones de carga (10T) y velocidad.
- 🚛 Camión Pesado: Restricciones de altura (4.5m) y peso (40T).

### Optimización VRP (VROOM):

- Asignación inteligente de pedidos a flotas heterogéneas.
- Ventanas de tiempo (Horarios de entrega).
- Capacidades de carga (Peso/Volumen).

### Frontend Interactivo:

Consola de pruebas con mapa de Google para visualizar rutas y clusters.

## 📋 Requisitos Previos

- Docker y Docker Compose.
- Clave de API de Google Maps (para visualizar el frontend).
- Recursos Mínimos: 4GB RAM (Recomendado 8GB+ para procesar el mapa completo).

## 🛠️ Instalación y Despliegue

Para una guía detallada de instalación, configuración de permisos Docker y procesamiento de mapas, por favor consulta: 👉 [GUÍA DE IMPLEMENTACIÓN PASO A PASO](IMPLEMENTATION_GUIDE.md)

### Resumen Rápido

- Configura Docker sin sudo.
- Ejecuta `./process_maps.sh` para descargar y compilar los mapas.
- Ejecuta `docker compose up -d` para iniciar los servicios.
- Accede a http://localhost:5500.

## 🏗️ Arquitectura

El sistema se compone de múltiples microservicios orquestados con Docker:

```mermaid
graph TD
    User[Usuario / Frontend] -->|Puerto 5500| Web[Nginx Frontend]
    User -->|Puerto 5200| Vroom[VROOM API (Optimizador)]

    Vroom -->|Profile: car| OSRM1[OSRM Car :5000]
    Vroom -->|Profile: moto| OSRM2[OSRM Moto :5001]
    Vroom -->|Profile: van| OSRM3[OSRM Van :5002]
    Vroom -->|Profile: truck_medium| OSRM4[OSRM Medium :5003]
    Vroom -->|Profile: truck_heavy| OSRM5[OSRM Heavy :5004]

    OSRM1 --> Data1[(Data Car)]
    OSRM2 --> Data2[(Data Moto)]
    OSRM3 --> Data3[(Data Van)]
    OSRM4 --> Data4[(Data Med)]
    OSRM5 --> Data5[(Data Heavy)]
```

## 🔌 Endpoints y Puertos

| Servicio | Puerto Local | Descripción |
|----------|--------------|-------------|
| Frontend | :5500 | Interfaz Gráfica de Usuario. |
| VROOM API | :5200 | Motor de Optimización (POST JSON). |
| OSRM Car | :5000 | API Ruteo Estándar. |
| OSRM Moto | :5001 | API Ruteo Motocicletas. |
| OSRM Van | :5002 | API Ruteo Furgonetas. |
| OSRM Medium | :5003 | API Ruteo Camión 10T. |
| OSRM Heavy | :5004 | API Ruteo Camión 40T. |

## 🤝 Contribución

Revisa la carpeta `profiles/` para ajustar las velocidades o restricciones físicas (vehicle_height, vehicle_weight) en los scripts Lua.

Si modificas un perfil, debes volver a ejecutar `./process_maps.sh` y reiniciar los contenedores.

## 📄 Licencia

MIT License. Basado en proyectos Open Source: [Project-OSRM](https://project-osrm.org/) y [VROOM Project](https://github.com/VROOM-Project/vroom).