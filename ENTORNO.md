# Entorno de trabajo: opita-code en Windows

> Como retomar el trabajo sin perder tiempo. Todo lo que se necesita saber
> para abrir el proyecto, compilarlo, correr las verificaciones y publicarlo.
>
> Actualizado: 2026-11-06 · Autor: Juan Nicolas Urrutia Salcedo

---

## 1. La regla de oro: dos repos, dos maquinas

| Repo | Que es | Donde se trabaja | Por que |
|---|---|---|---|
| `opita-code` | Runtime `vibe-tools`, loops L0-L7, docs, sitio | **WSL2** (Debian) | La CI corre en Linux; el codigo usa shebangs y `node --test` |
| `catalogo-opita-code` | Catalogo comercial de auditorias (PDF al cliente) | **Windows** | El pipeline renderiza con Edge, que es nativo de Windows |

No es una preferencia: `opita-code` **no puede verificarse en Windows**. Ver seccion 3.

---

## 2. Entradas rapidas

### El runtime (desde WSL2)

```bash
wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-dev.sh test
wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-dev.sh check
wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-dev.sh mutate
wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-dev.sh state
wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-dev.sh shell
```

### El catalogo (desde Windows)

```cmd
cd C:\Users\nicou\workspace\catalogo-opita-code
catalogo.cmd review
catalogo.cmd status
```

### Diagnostico del entorno

```bash
wsl -d Debian -- bash -lc "bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-doctor.sh"
```

---

## 3. Por que `opita-code` vive en WSL2 y no en Windows

La suite tiene 563 pruebas. En Windows fallan 11 de una sola familia (L5) por una
razon que no es del codigo: `tools/juez-correr.test.mjs` escribe un envoltorio
`#!/bin/sh` y lo ejecuta como proceso hijo.

```
spawn EFTYPE
```

Windows no ejecuta ficheros con shebang: `CreateProcess` no honra la linea
`#!`. En Linux el mismo test da 21/21 en verde. El problema no es la prueba ni
el runtime, es el sistema operativo.

Como los guards de mutacion y de estado **miden sobre la linea base**, una
linea base roja los hace fallar a proposito:

```
LA LINEA BASE NO PASA. El harness mide sobre una suite que ya esta rota.
```

Es decir: en Windows no se puede ni medir la calidad. Por eso el repo vive en
ext4 de WSL2, que es ademas donde lo corre la CI.

> Nota: `node --test` tampoco acepta globs en Windows; hay que pasar los
> ficheros uno a uno. El script `.wsl-dev.sh` lo resuelve.

---

## 4. Como esta montado el entorno

### Windows

- **Node 22.20.0** en `C:\Users\nicou\.local\node22\node-v22.20.0-win-x64`
  (esta en el PATH de usuario). Es el mismo Node que usa la CI.
- **Bun 1.4.4** en `C:\Users\nicou\.bun\bin\bun.exe`. Se usa para el pipeline
  del catalogo, que no necesita Node.
- **Docker Desktop 29.9.2**, con la imagen `postgres:16-alpine` ya descargada.
- **Edge** en `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
  que es el navegador que renderiza el catalogo.

### WSL2 (Debian)

- **Node 22.20.0** en `/opt/node22/bin`, **npm 10.9.3**.
- **Docker CLI** enlazado al motor de Docker Desktop por
  `unix:///var/run/docker.sock`.
- **Repos en ext4** (`/root/...`), no en `/mnt/c`. Sobre `/mnt/c` todo pasa por
  el puente 9P y el I/O se multiplica: es la diferencia entre un `git status`
  lento y uno instantaneo.
- **DNS**: el distro no traia `/etc/resolv.conf`. Se creo con
  `nameserver 1.1.1.1` y `8.8.8.8`. Sin esto, `npm ci` falla con `EAI_AGAIN`.
- **Herramientas** de base: `git 2.47.3`, `curl 8.14.1`, `python3 3.13.5`,
  `build-essential`, `jq`, `vim`.

Todo esto se carga solo: `/etc/profile.d/wsl-env.sh` define el PATH y
`DOCKER_HOST` en cada shell nuevo.

---

## 5. Reconstruir el entorno desde cero

Si la maquina cambia, esto levanta todo:

```bash
# 1. Node 22 en Windows
#    Descargar node-v22.20.0-win-x64.zip de nodejs.org, descomprimir en
#    C:\Users\nicou\.local\node22 y anadir el binario al PATH de usuario.

# 2. WSL2: entorno, repo y dependencias
wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-setup.sh

# 3. WSL2: conectar Docker
wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-docker.sh

# 4. WSL2: catalogo
wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-catalogo.sh
```

---

## 6. Estado verificado del runtime

Medido en WSL2 el 2026-11-06, contra `557dc6c`:

```
tests        563/563, 0 fallos
mutantes     312/312 en 60 paquetes (100%, umbral 80%)
presupuesto  210 unidades, 0 exceden
loops        7 cerrados, cada uno con su documento
superficie   al dia
```

Los guards que pasan: `content`, `prosa`, `cifras`, `coherencia`, `budget`,
`test`, `mutate`, `verificar-estado`, `generar-estado --check`.

Los 4 tests de aislamiento RLS (L4-T4) **exigen Docker**. Sin Docker se
saltan con un mensaje explicito; con Docker, pasan.

---

## 7. Estado verificado del catalogo

```
0 errores, 0 advertencias, 0 info
17 tokens, 12 niveles, 11 paginas A4
APTO PARA CLIENTE
```

El pipeline se autocomprueba: inyectando un defecto deliberado
(`print-color-adjust: exact` -> `economy`) devuelve exit 1 y un error. Un
validador que nunca falla no sirve; este falla cuando debe.

---

## 8. Ficheros de control

| Fichero | Que hace |
|---|---|
| `.wsl-env.sh` | PATH y `DOCKER_HOST` de WSL. Se copia a `/etc/profile.d/`. |
| `.wsl-setup.sh` | Levanta WSL: DNS, herramientas, Node, repo, dependencias, build. |
| `.wsl-docker.sh` | Enlaza el CLI de Docker al motor de Docker Desktop. |
| `.wsl-dev.sh` | Entrada unica del runtime: `check`, `test`, `mutate`, `state`, `site`. |
| `.wsl-doctor.sh` | Diagnostico: que hay instalado y en que commit esta el repo. |
| `.wsl-catalogo.sh` | Clona y actualiza el repo del catalogo en ext4. |
| `catalogo.cmd` (en el repo del catalogo) | Entrada unica del catalogo en Windows. |

---

## 9. Como se retoma el trabajo

```bash
# 1. Traer lo nuevo del remote
wsl -d Debian -- bash -c "cd /root/opita-code && git pull --ff-only"

# 2. Si cambiaron dependencias
wsl -d Debian -- bash -c "cd /root/opita-code/vibe-tools && npm ci"

# 3. Verificar antes de tocar nada
wsl -d Debian -- bash /mnt/c/Users/nicou/workspace/opita-code/.wsl-dev.sh check
```

Todo lo anterior corre en WSL2. El catalogo se trabaja aparte, en Windows,
con `catalogo.cmd review`.
