FROM osrm/osrm-backend:latest

# Instalar wget para descargar el mapa
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Copiar y dar permisos al script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /data
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]