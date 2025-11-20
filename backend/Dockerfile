FROM osrm/osrm-backend:latest

# --- CORRECCIÓN DE ERROR 404 ---
# Debian Stretch es antiguo. Cambiamos los repositorios a 'archive.debian.org' 
# y desactivamos la validación de fecha para que apt-get funcione.
RUN echo "deb http://archive.debian.org/debian stretch main" > /etc/apt/sources.list && \
    echo "deb http://archive.debian.org/debian-security stretch/updates main" >> /etc/apt/sources.list && \
    apt-get -o Acquire::Check-Valid-Until=false update && \
    apt-get install -y --force-yes wget && \
    rm -rf /var/lib/apt/lists/*

# Copiar y dar permisos al script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /data
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]