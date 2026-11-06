#!/bin/bash
# Entry point unico para trabajar el repo opita-code dentro de WSL2 (Debian).
# Uso:  wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-dev.sh <comando>
#       wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-dev.sh check
#       wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-dev.sh test

set -uo pipefail

# El PATH y el socket de Docker los deja .wsl-env.sh.
# source (y no export inline) porque PowerShell colapsa el $PATH de WSL.
source /mnt/c/Users/nicou/workspace/opita-code/.wsl-env.sh

REPO=/root/opita-code
cd "$REPO/vibe-tools" || exit 1

case "${1:-check}" in
  check)
    # Lo que corre la CI: guards de texto, cifras, coherencia, presupuesto, tests y mutacion.
    npm run content && npm run prosa && npm run cifras && npm run coherencia \
      && npm run budget && npm run test
    ;;
  test)
    node --test dist/test/*.test.js dist/integration/*.test.js scripts/*.test.mjs tools/*.test.mjs
    ;;
  mutate)
    npm run mutate
    ;;
  state)
    npm run verificar-estado
    ;;
  site)
    npm run generar-estado -- --check
    ;;
  shell)
    cd "$REPO" && exec /bin/bash
    ;;
  *)
    exec "$@"
    ;;
esac
