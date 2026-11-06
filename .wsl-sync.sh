#!/bin/bash
# Sincroniza el repo de trabajo con el remote: trae lo nuevo y publica lo local.
set -uo pipefail

source /mnt/c/Users/nicou/workspace/opita-code/.wsl-env.sh

REPO=/root/opita-code
cd "$REPO" || exit 1

echo "== antes =="
git log --oneline -1
git status -sb | head -3

echo "== traer =="
git fetch origin
git pull --ff-only

echo "== estado =="
git log --oneline -1
git status --porcelain | wc -l
