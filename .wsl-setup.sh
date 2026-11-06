#!/bin/bash
# Prepara el entorno de desarrollo dentro de WSL2 (Debian) para el repo opita-code.
set -euo pipefail

export PATH=/opt/node22/bin:$PATH

echo "== DNS =="
printf 'nameserver 1.1.1.1\nnameserver 8.8.8.8\noptions timeout:2 attempts:2\n' > /etc/resolv.conf
getent ahostsv4 registry.npmjs.org | head -1

echo "== Herramientas base =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq >/dev/null 2>&1
apt-get install -y -qq --no-install-recommends \
  ca-certificates curl git build-essential python3 jq less vim >/dev/null 2>&1
echo "coreutils/git/curl: $(curl --version | head -1)"

echo "== Node =="
node --version
npm --version

echo "== Repo en ext4 =="
REPO=/root/opita-code
if [ ! -d "$REPO/.git" ]; then
  rm -rf "$REPO"
  git clone -q https://github.com/Opita-Code/opita-code.git "$REPO"
fi
cd "$REPO"
git fetch -q origin
git checkout -q main
git reset -q --hard origin/main
git status --short
echo "HEAD: $(git rev-parse --short HEAD)"

echo "== Dependencias =="
cd "$REPO/vibe-tools"
npm ci

echo "== Build =="
npm run build

echo "== SETUP OK =="
