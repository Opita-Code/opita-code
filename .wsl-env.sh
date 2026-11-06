# Entorno de desarrollo del proyecto opita-code en WSL2 (Debian).
#
# Se carga en cada shell nueva del distro. Define:
#   - PATH con Node 22 y las herramientas estandar
#   - DOCKER_HOST apuntando al motor de Docker Desktop
#
# Instalar con:  wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-env.sh

# El PATH se escribe completo a proposito: no usar $PATH en la linea de
# instalacion, porque PowerShell lo colapsa al separador ';' de Windows.
export PATH="/opt/node22/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# Docker Desktop expone su motor como socket unix dentro de WSL.
DOCKER_SOCK=/mnt/wsl/docker-desktop/shared-sockets/host-services/docker.proxy.sock
if [ -S "$DOCKER_SOCK" ]; then
  mkdir -p /var/run
  ln -sf "$DOCKER_SOCK" /var/run/docker.sock
  export DOCKER_HOST=unix:///var/run/docker.sock
fi

export DOCKER_BUILDKIT=1
