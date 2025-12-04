#!/bin/bash
set -e # Detener si hay errores

# ==========================================
# CONFIGURACIÓN
# ==========================================
MAP_FILE="colombia-latest.osm.pbf"
MAP_URL="http://download.geofabrik.de/south-america/colombia-latest.osm.pbf"
BASE_NAME="colombia-latest"
PROFILES=("car" "moto" "van" "truck_medium" "truck_heavy")

echo "🛠️  Verificando entorno..."
mkdir -p data

# Descarga mapa
if [ ! -f "./data/$MAP_FILE" ]; then
    echo "⬇️  Descargando mapa..."
    wget -O "./data/$MAP_FILE" "$MAP_URL"
fi

# ==========================================
# PROCESAMIENTO
# ==========================================
for profile in "${PROFILES[@]}"
do
   echo ""
   echo "=================================================="
   echo "🚜 PROCESANDO PERFIL: $profile"
   echo "=================================================="

   # 1. LIMPIEZA AGRESIVA (Evita el error 'Permission denied' en el cp)
   # Usamos docker para borrar porque docker es dueño de los archivos viejos
   echo "🧹 Limpiando zona de trabajo..."
   docker run --rm -v "${PWD}:/work" alpine rm -rf "/work/osrm-data/$profile"
   
   # Crear carpeta limpia con TU usuario
   mkdir -p "./osrm-data/$profile"

   # 2. COPIAR MAPA
   cp "./data/$MAP_FILE" "./osrm-data/$profile/$MAP_FILE"

   # 3. EXTRACT
   echo "⚙️  [1/3] Extracting..."
   docker run --rm -t \
     -v "${PWD}/osrm-data/$profile:/data" \
     -v "${PWD}/profiles:/opt/profiles" \
     osrm/osrm-backend osrm-extract -p "/opt/profiles/$profile.lua" "/data/$MAP_FILE"

   # --- FIX CRÍTICO: Crear datasource_names como ROOT ---
   echo "🔧 Asegurando archivo datasource_names..."
   docker run --rm -v "${PWD}/osrm-data/$profile:/data" alpine touch "/data/$BASE_NAME.osrm.datasource_names"
   # -----------------------------------------------------

   # Borrar el PBF para ahorrar espacio
   rm "./osrm-data/$profile/$MAP_FILE"

   # 4. PARTITION
   echo "🧩 [2/3] Partitioning..."
   docker run --rm -t \
     -v "${PWD}/osrm-data/$profile:/data" \
     osrm/osrm-backend osrm-partition "/data/$BASE_NAME.osrm"

   # 5. CUSTOMIZE
   echo "✨ [3/3] Customizing..."
   docker run --rm -t \
     -v "${PWD}/osrm-data/$profile:/data" \
     osrm/osrm-backend osrm-customize "/data/$BASE_NAME.osrm"

   echo "✅ Perfil $profile LISTO."
done

# ==========================================
# FIX FINAL DE PERMISOS
# ==========================================
echo ""
echo "🔐 Liberando permisos (chmod 777)..."
# Usamos docker para cambiar permisos, así no te pide sudo password
docker run --rm -v "${PWD}:/work" alpine chmod -R 777 /work/osrm-data

echo ""
echo "🎉 PROCESAMIENTO FINALIZADO EXITOSAMENTE."
echo "🚀 Ejecuta: docker compose up -d"
