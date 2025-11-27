#!/bin/bash

# ==========================================
# CONFIGURACIÓN
# ==========================================
MAP_FILE="colombia-latest.osm.pbf"
MAP_URL="http://download.geofabrik.de/south-america/colombia-latest.osm.pbf"
BASE_NAME="colombia-latest"

# Lista de perfiles a procesar
PROFILES=("car" "moto" "van" "truck_medium" "truck_heavy")

# ==========================================
# 1. PREPARACIÓN DEL ENTORNO
# ==========================================
echo "🛠️  Verificando entorno..."

# Crear carpetas base
mkdir -p data
mkdir -p osrm-data

# Descarga automática del mapa si no existe
if [ ! -f "./data/$MAP_FILE" ]; then
    echo "⚠️  Mapa no encontrado en ./data/"
    echo "⬇️  Descargando mapa de Colombia desde Geofabrik..."
    
    if command -v wget &> /dev/null; then
        wget -O "./data/$MAP_FILE" "$MAP_URL"
    elif command -v curl &> /dev/null; then
        curl -L -o "./data/$MAP_FILE" "$MAP_URL"
    else
        echo "❌ Error: No tienes 'wget' ni 'curl' instalados. Descarga el mapa manualmente."
        exit 1
    fi
else
    echo "✅ Mapa base encontrado: ./data/$MAP_FILE"
fi

# ==========================================
# 2. PROCESAMIENTO DE PERFILES
# ==========================================
for profile in "${PROFILES[@]}"
do
   echo ""
   echo "=================================================="
   echo "🚜 PROCESANDO PERFIL: $profile"
   echo "=================================================="

   # Verificar si existe el archivo .lua
   if [ ! -f "./profiles/$profile.lua" ]; then
       echo "❌ Error: No existe el archivo ./profiles/$profile.lua. Saltando..."
       continue
   fi

   # Crear subcarpeta
   mkdir -p "./osrm-data/$profile"

   # --- VERIFICACIÓN DE PROCESAMIENTO PREVIO ---
   # OSRM genera varios archivos. Si existe el .osrm.cells (generado por customize), asumimos éxito.
   if [ -f "./osrm-data/$profile/$BASE_NAME.osrm.cells" ]; then
       echo "✅ Datos para '$profile' ya existen. Saltando procesamiento."
       continue
   fi
   # ---------------------------------------------

   # 1. Copiar el mapa base a la subcarpeta del perfil
   # Solo si no existe el archivo .osrm base (para ahorrar copia si falló a mitad)
   if [ ! -f "./osrm-data/$profile/$BASE_NAME.osrm" ]; then
       echo "📋 Copiando mapa base a ./osrm-data/$profile/..."
       cp "./data/$MAP_FILE" "./osrm-data/$profile/$MAP_FILE"
   fi

   # 2. OSRM EXTRACT
   if [ ! -f "./osrm-data/$profile/$BASE_NAME.osrm" ]; then
       echo "⚙️  [1/3] Extracting..."
       docker run --rm -t \
         -v "${PWD}/osrm-data/$profile:/data" \
         -v "${PWD}/profiles:/opt/profiles" \
         osrm/osrm-backend osrm-extract -p "/opt/profiles/$profile.lua" "/data/$MAP_FILE" || { echo "❌ Falló Extract en $profile"; continue; }
   else
       echo "⏭️  Extract ya realizado, continuando..."
   fi

   # 3. OSRM PARTITION
   if [ ! -f "./osrm-data/$profile/$BASE_NAME.osrm.partition" ]; then
       echo "🧩 [2/3] Partitioning..."
       docker run --rm -t \
         -v "${PWD}/osrm-data/$profile:/data" \
         osrm/osrm-backend osrm-partition "/data/$BASE_NAME.osrm" || { echo "❌ Falló Partition en $profile"; continue; }
   else
       echo "⏭️  Partition ya realizado, continuando..."
   fi

   # 4. OSRM CUSTOMIZE
   if [ ! -f "./osrm-data/$profile/$BASE_NAME.osrm.cells" ]; then
       echo "✨ [3/3] Customizing..."
       docker run --rm -t \
         -v "${PWD}/osrm-data/$profile:/data" \
         osrm/osrm-backend osrm-customize "/data/$BASE_NAME.osrm" || { echo "❌ Falló Customize en $profile"; continue; }
   else
       echo "⏭️  Customize ya realizado, continuando..."
   fi

   # 5. LIMPIEZA
   # Borramos el archivo .pbf de la subcarpeta para ahorrar espacio
   if [ -f "./osrm-data/$profile/$MAP_FILE" ]; then
       echo "🧹 Limpiando archivo base temporal..."
       rm "./osrm-data/$profile/$MAP_FILE"
   fi
   
   echo "✅ Perfil $profile terminado correctamente."
done

echo ""
echo "🎉 TODO EL PROCESAMIENTO FINALIZADO."
echo "🚀 Ahora puedes ejecutar: docker compose up -d"