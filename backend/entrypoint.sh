#!/bin/bash
set -e

MAP_FILE="colombia-latest"
PBF_URL="http://download.geofabrik.de/south-america/colombia-latest.osm.pbf"

echo "--- Iniciando OSRM Entrypoint (Velocidad Real) ---"

# 1. Verificar si ya existen los datos procesados en el volumen
if [ -f "/data/$MAP_FILE.osrm" ]; then
    echo "✅ Datos OSRM detectados. Saltando procesamiento."
else
    echo "⚠️ No se encontraron datos. Iniciando instalación desde cero..."
    
    # 2. Descargar Mapa de Colombia
    echo "⬇️ Descargando mapa de Colombia..."
    wget -N $PBF_URL -O /data/$MAP_FILE.osm.pbf

    # 3. Extraer perfiles originales (Sin modificar)
    echo "⚙️ Copiando perfiles estándar..."
    cp -r /opt/car.lua /data/
    cp -r /opt/lib /data/

    # NOTA: Aquí eliminamos el bloque que limitaba a 40km/h.
    # El perfil car.lua se usará tal cual viene de fábrica.

    # 4. Procesamiento OSRM
    echo "🔨 Ejecutando osrm-extract..."
    osrm-extract -p /data/car.lua /data/$MAP_FILE.osm.pbf

    echo "🔨 Ejecutando osrm-partition..."
    osrm-partition /data/$MAP_FILE.osrm

    echo "🔨 Ejecutando osrm-customize..."
    osrm-customize /data/$MAP_FILE.osrm
    
    echo "✅ Procesamiento completado."
fi

# 5. Lanzar el servidor
echo "🚀 Levantando servidor OSRM..."
exec osrm-routed --algorithm mld /data/$MAP_FILE.osrm