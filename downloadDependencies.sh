#!/bin/bash
set -e

# Auto-detectar directorio del script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LIB_DIR="$SCRIPT_DIR/profiles/lib"

mkdir -p "$LIB_DIR"
cd "$LIB_DIR"

base_url="https://raw.githubusercontent.com/Project-OSRM/osrm-backend/master/profiles/lib"

wget -N "${base_url}/access.lua"
wget -N "${base_url}/destination.lua"
wget -N "${base_url}/guidance.lua"
wget -N "${base_url}/maxspeed.lua"
wget -N "${base_url}/measure.lua"
wget -N "${base_url}/obstacles.lua"
wget -N "${base_url}/relations.lua"
wget -N "${base_url}/sequence.lua"
wget -N "${base_url}/set.lua"
wget -N "${base_url}/tags.lua"
wget -N "${base_url}/utils.lua"
wget -N "${base_url}/way_handlers.lua"

echo "✅ Dependencias descargadas en: $LIB_DIR"
