#!/bin/bash
# Conecta Docker (Docker Desktop) dentro de WSL2 para que los tests RLS de L4-T4 corran.
set -uo pipefail

export PATH=/opt/node22/bin:$PATH

CLI=/mnt/wsl/docker-desktop/cli-tools/usr/bin/docker
SOCK=/mnt/wsl/docker-desktop/shared-sockets/host-services/docker.proxy.sock

if [ ! -x "$CLI" ]; then
  echo "No se encuentra el CLI de Docker en $CLI" >&2
  exit 1
fi

install -m 0755 "$CLI" /usr/local/bin/docker

# El motor de Docker Desktop se expone como socket unix dentro de WSL.
if [ -S "$SOCK" ]; then
  mkdir -p /var/run
  ln -sf "$SOCK" /var/run/docker.sock
fi

# Configuracion persistente para cualquier sesion de este distro.
mkdir -p /root/.docker
cat > /root/.docker/config.json <<'JSON'
{
  "currentContext": "desktop-linux"
}
JSON

cat > /etc/profile.d/docker-wsl.sh <<'SH'
export PATH=/opt/node22/bin:$PATH
export DOCKER_HOST=unix:///var/run/docker.sock
SH

export DOCKER_HOST=unix:///var/run/docker.sock

echo "== docker en WSL =="
docker version --format 'client {{.Client.Version}} / server {{.Server.Version}}' 2>&1
docker ps >/dev/null 2>&1 && echo "engine accesible" || echo "engine NO accesible"
