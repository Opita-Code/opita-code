# Cómo contribuir

> Antes de nada: lee [README.md](README.md). Este proyecto es temprano y hay
> cosas que **todavía no funcionan**. Esta guía dice cuáles, para que nadie
> desperdicie un día en algo que no está listo.

## Qué se espera de un cambio

El proyecto se construye por **loops**: cada loop cierra una pregunta y deja
su razonamiento escrito. Un cambio entra en el loop al que pertenece, no por
encima de él.

Un cambio está **terminado** cuando:

1. Los cuatro guards pasan: `npm run check`.
2. El estado publicado cuadra con la realidad: `npm run verificar-estado`.
3. Si el cambio toca prosa, el documento se **juzga** contra el criterio con el
   que fue escrito, y el veredicto es `aligned`.
4. Si el veredicto dice `needs_human`, el cambio **no** está terminado. Se
   para y se pregunta, no se reintenta hasta que salga bien.
5. El documento que describe el cambio se lee después de escribirlo. El
   content-guard caza la intrusión de otro guión y los enlaces rotos; **no**
   caza el inglés mal puesto, y esa es la parte que toca la persona.

## Los guards, y qué no ven

Cada guard caza una cosa distinta, y **cada uno deja cosas sin ver**. Por eso
**el guard y la persona se necesitan**: un guard que se puede satisfacer
editando el contenido que debería proteger no es un guard, y una prosa con el
inglés mal puesto no la caza ninguna máquina.

La tabla completa, con qué mide cada control y qué no ve, está en
[docs/controles.md](docs/controles.md).

## El presupuesto de 4096 bytes

Todo artefacto que se pasa al juez tiene que caber en 4096 bytes, porque el
juez lo trocea ahí: con dos trozos, el criterio escrito sobre el todo se
aplica a un fragmento, y el veredicto es ruido.

Cuando un documento se pasa del tope, **se parte por concepto**, nunca se
amputa: cada mitad tiene que tener una sola preocupación. Si se amputa prosa
para que el número pase, el guard está contando el recorte y no la verdad.

## Reglas de estilo

- **Español neutro**, con mayúsculas y sin tildes cuando la palabra se escribe
  siempre así. Sin jerga de región en la prosa.
- **El código y los mensajes de error, en inglés**, porque son la API.
- **Ningún número sin medirlo antes.** Un número que no se ha medido se
  escribe como pendiente, no como afirmación.
- **Ninguna afirmación sobre el estado del juez.** El registro autoritativo
  está en `dark_memory_judgment_history`, no en un documento.

## Lo que todavía no está listo

Esto es lo que **no** hay que asumir al trabajar en este repositorio:

- **Los niveles de aislamiento del sandbox son política verificada, no
  ejecución real.** No hay Pyodide, ni WebContainers, ni Firecracker
  conectados. Por eso el repositorio no publica que el sistema ejecuta con
  red.
- **La herramienta de búsqueda declara una capacidad que no tiene.** El
  transporte falta, y el caso canónico existe para que ese hueco se vea en
  cada corrida.
- **El veredicto del juez no corre en la CI de este repositorio.** El gate
  vive en `dark-memory-mcp`, que no es parte de este repositorio.
- **La memoria boundary está especificada, no implementada.** Los bordes que
  hacen falta están escritos en `docs/arquitectura/loops/`.

## Cómo ejecutar

```bash
cd vibe-tools
npm install
npm run check              # los cuatro guards
npm run verificar-estado   # el estado publicado contra la realidad
```

Los otros comandos, y qué mira cada uno, están en
[docs/como-verificar.md](docs/como-verificar.md).

## Antes de commitear

```bash
git update-index --really-refresh   # fuerza la relectura de lo que git da por igual
git add -A
git diff --cached --stat             # esto es lo que se commitea, míralo
```

Un número que se puede cambiar sin cambiar el tamaño del archivo se le escapa
a git. El por qué, y el método, están en
[docs/como-verificar.md](docs/como-verificar.md).

## Reportar un problema

Un bug, por la vía normal: un issue. Un problema de seguridad, por la vía
silenciosa: [SECURITY.md](SECURITY.md). Ese canal existe para que el detalle
no quede público antes de tiempo.
