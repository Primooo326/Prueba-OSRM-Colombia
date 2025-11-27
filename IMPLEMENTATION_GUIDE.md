# Guía de Implementación Paso a Paso: OSRM + VROOM (Colombia)

Esta guía detalla el proceso completo para desplegar la infraestructura de ruteo y optimización logística en un entorno local utilizando Docker.

## 1. Prerrequisitos del Sistema

### Configuración de Docker (Sin sudo)

Para evitar problemas de permisos y facilitar la ejecución de scripts, configura tu usuario para usar Docker sin sudo.

Crear el grupo docker (si no existe):

```bash
sudo groupadd docker
```

Agregar tu usuario al grupo:

```bash
sudo usermod -aG docker $USER
```

Aplicar cambios: Cierra sesión y vuelve a entrar, o ejecuta:

```bash
newgrp docker
```

Verificar:

```bash
docker run hello-world
```

(Debería funcionar sin pedir contraseña).

## 2. Preparación del Entorno

### Estructura de Carpetas

Asegúrate de que tu proyecto tenga la siguiente estructura base antes de comenzar:

```
/Prueba-OSRM-Colombia
├── docker-compose.yml
├── process_maps.sh
├── frontend/
│   ├── Dockerfile
│   └── index.html
├── profiles/
│   ├── car.lua
│   ├── moto.lua
│   ├── van.lua
│   ├── truck_medium.lua
│   └── truck_heavy.lua
├── vroom-conf/
│   └── config.yml
└── data/                  <-- Se creará automáticamente
└── osrm-data/             <-- Se creará automáticamente
```

### Descarga de Mapa Base

El script de procesamiento intentará descargar el mapa automáticamente. Sin embargo, si prefieres hacerlo manualmente:

Crea la carpeta data:

```bash
mkdir data
```

Descarga el mapa de Colombia: [Geofabrik Colombia](https://download.geofabrik.de/south-america/colombia-latest.osm.pbf)

Guárdalo como `data/colombia-latest.osm.pbf`.

## 3. Procesamiento de Mapas (OSRM)

Este paso es crucial. Debemos "pre-cocinar" los grafos de ruteo para cada tipo de vehículo (perfil) antes de levantar los servidores.

Dar permisos al script:

```bash
chmod +x process_maps.sh
```

Ejecutar el procesamiento:

```bash
./process_maps.sh
```

### ¿Qué hace este script?

- Verifica si existe el mapa base (lo descarga si no).
- Crea subcarpetas en osrm-data/ para cada perfil (car, moto, van, truck_medium, truck_heavy).
- Ejecuta los binarios de OSRM (extract, partition, customize) usando los archivos .lua de la carpeta profiles/.
- Este proceso puede tardar entre 5 y 15 minutos dependiendo de tu hardware.

## 4. Despliegue de Servicios

Una vez finalizado el procesamiento, levanta la infraestructura con Docker Compose.

Iniciar contenedores:

```bash
docker compose up -d --build
```

Verificar estado:

```bash
docker compose ps
```

Deberías ver 7 contenedores activos:

- osrm-car, osrm-moto, osrm-van, osrm-medium, osrm-heavy (Puertos 5000-5004)
- vroom-api (Puerto 5200)
- osrm-web (Puerto 5500)

## 5. Verificación y Uso

### Acceso Frontend

Abre tu navegador en: http://localhost:5500

### Pruebas de API

#### Prueba de Ruteo (OSRM Moto)

```bash
curl "http://localhost:5001/route/v1/driving/-75.56,6.24;-75.58,6.26?overview=false"
```

#### Prueba de Optimización (VROOM)

Envía un POST a http://localhost:5200/ con el siguiente cuerpo JSON:

```json
{
  "vehicles": [
    {
      "id": 1,
      "profile": "truck_heavy",
      "start": [-75.56, 6.24],
      "end": [-75.56, 6.24]
    }
  ],
  "jobs": [
    {
      "id": 1,
      "location": [-75.57, 6.25]
    }
  ]
}
```

## Solución de Problemas Comunes

### Error "manifest unknown" en VROOM:

Asegúrate de usar la imagen `ghcr.io/vroom-project/vroom-docker:v1.14.0` en docker-compose.yml.

### Error "Connection refused" en VROOM:

Verifica que vroom-conf/config.yml tenga los nombres de host correctos (osrm-car, osrm-moto, etc.) coincidiendo con los nombres de servicio en Docker Compose.

### Error "Lua error" durante procesamiento:

Asegúrate de haber actualizado los archivos .lua en profiles/ con el bloque de constantes y la corrección de package.path descrita en la documentación técnica.