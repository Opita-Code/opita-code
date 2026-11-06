#!/bin/bash
# Prepara el entorno del repo catalogo-opita-code dentro de WSL2.
# El catalogo se construye con Bun (no necesita Node) y Edge en Windows.
set -uo pipefail

export PATH="/opt/node22/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# Bun en Windows: se invoca desde WSL con el ejecutable de Windows.
BUN_EXE=/mnt/c/Users/nicou/.bun/bin/bun.exe

if [ ! -f "$BUN_EXE" ]; then
  echo "Bun no esta en $BUN_EXE" >&2
  exit 1
fi

REPO=/root/catalogo-opita-code
SRC=/mnt/c/Users/nicou/workspace/catalogo-opita-code

if [ ! -d "$REPO/.git" ]; then
  rm -rf "$REPO"
  git clone -q "$SRC" "$REPO"
fi

cd "$REPO" || exit 1
git fetch -q origin
git checkout -q main
git reset -q --hard origin/main

echo "== catalogo-opita-code =="
echo "HEAD: $(git rev-parse --short HEAD) $(git log -1 --pretty=%s)"
echo "estado: $(git status --porcelain | wc -l) archivos modificados"
echo
echo "Bun disponible en: $BUN_EXE"
echo "Para revisar el catalogo:"
echo "  cd $REPO && $BUN_EXE pipeline/review-pipeline.mjs --html catalogo.html --out .review"
