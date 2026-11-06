#!/bin/bash
# Publica el commit local (hecho en el clon de Windows) al remote de GitHub.
set -uo pipefail

source /mnt/c/Users/nicou/workspace/opita-code/.wsl-env.sh

REPO=/root/opita-code
WIN=/mnt/c/Users/nicou/workspace/opita-code

cd "$REPO" || exit 1

echo "== traer el commit del clon de Windows =="
git fetch "$WIN" main:refs/remotes/win/main 2>&1 | tail -3

echo "== commits por publicar =="
git log --oneline origin/main..refs/remotes/win/main

if [ -z "$(git log --oneline origin/main..refs/remotes/win/main)" ]; then
  echo "no hay nada que publicar"
  exit 0
fi

echo "== publicar =="
git push origin refs/remotes/win/main:main 2>&1 | tail -5

echo "== resultado =="
git fetch origin
git log --oneline -1 origin/main
git status -sb | head -2
