#!/bin/bash
# Verifica que el entorno de WSL queda listo al abrir un shell nuevo.
set -uo pipefail

echo "== PATH =="
echo "$PATH"

echo "== herramientas =="
command -v node && node --version
command -v npm && npm --version
command -v git && git --version
command -v docker && docker --version
command -v curl && curl --version | head -1
command -v python3 && python3 --version

echo "== docker =="
echo "DOCKER_HOST=${DOCKER_HOST:-(unset)}"
if command -v docker >/dev/null 2>&1; then
  docker info --format 'engine {{.ServerVersion}}' 2>&1 | head -1
fi

echo "== repo =="
REPO=/root/opita-code
if [ -d "$REPO/.git" ]; then
  cd "$REPO"
  echo "HEAD: $(git rev-parse --short HEAD) $(git log -1 --pretty=%s)"
  echo "rama: $(git branch --show-current)"
  echo "estado: $(git status --porcelain | wc -l) archivos modificados"
else
  echo "repo ausente en $REPO"
fi
