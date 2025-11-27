cd profiles/lib

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

# Volver a la raíz
cd ../..
