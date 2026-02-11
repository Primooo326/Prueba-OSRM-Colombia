#!/bin/bash

# ==========================================
# CONFIGURACIÓN
# ==========================================
WORK_DIR="$(cd "$(dirname "$0")" && pwd)" # Auto-detecta la ruta del proyecto
DATA_DIR="$WORK_DIR/data"
MAP_FILE="colombia-latest.osm.pbf"
MAP_URL="http://download.geofabrik.de/south-america/colombia-latest.osm.pbf"
LOG_FILE="$WORK_DIR/map_updates.log"
PROCESS_SCRIPT="$WORK_DIR/process_maps.sh"

# Cambiar al directorio de trabajo
cd "$WORK_DIR" || exit 1

# Función para loguear
log_message() {
    local MESSAGE=$1
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $MESSAGE" >> "$LOG_FILE"
    echo "$MESSAGE" # También mostrar en consola
}

log_message "🔍 Buscando actualizaciones de mapa..."

# 1. Obtener fecha del archivo actual (si existe)
if [ -f "$DATA_DIR/$MAP_FILE" ]; then
    OLD_TIMESTAMP=$(stat -c %Y "$DATA_DIR/$MAP_FILE")
else
    OLD_TIMESTAMP=0
fi

# 2. Intentar descargar solo si es más nuevo (wget -N)
# La opción -N descarga solo si el remoto es más nuevo que el local
# La opción -P indica el directorio de descarga
wget -N -P "$DATA_DIR" "$MAP_URL" > /dev/null 2>&1

# 3. Obtener fecha del archivo después de intentar descarga
if [ -f "$DATA_DIR/$MAP_FILE" ]; then
    NEW_TIMESTAMP=$(stat -c %Y "$DATA_DIR/$MAP_FILE")
    # Obtener fecha legible para el log
    MAP_DATE_HUMAN=$(date -d @$NEW_TIMESTAMP "+%Y-%m-%d %H:%M")
else
    log_message "❌ Error: No se pudo verificar el archivo del mapa."
    exit 1
fi

# 4. Comparar timestamps
if [ "$NEW_TIMESTAMP" -gt "$OLD_TIMESTAMP" ] || [ "$OLD_TIMESTAMP" -eq 0 ]; then
    log_message "⬇️  Nueva versión detectada. Fecha del mapa: $MAP_DATE_HUMAN. Iniciando actualización..."
    
    # Ejecutar el script de procesamiento existente
    if [ -f "$PROCESS_SCRIPT" ]; then
        bash "$PROCESS_SCRIPT" >> "$LOG_FILE" 2>&1
        
        if [ $? -eq 0 ]; then
            log_message "✅ Procesamiento de grafos OSRM completado."
            
            # Reiniciar contenedores para tomar los cambios
            log_message "🔄 Reiniciando contenedores Docker..."
            docker compose down && docker compose up -d
            
            log_message "🎉 ACTUALIZACIÓN EXITOSA. El sistema ahora usa el mapa del: $MAP_DATE_HUMAN"
        else
            log_message "❌ Error durante la ejecución de process_maps.sh. Revisa el log."
        fi
    else
        log_message "❌ Error: No se encontró el script $PROCESS_SCRIPT"
    fi

else
    log_message "zzz No hay actualizaciones. Tu mapa ($MAP_DATE_HUMAN) ya es el más reciente."
fi
