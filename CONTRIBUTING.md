# Como contribuir

> Antes de nada: lee [README.md](README.md). Este proyecto es temprano y hay
> cosas que **todavia no funcionan**. Esta guia dice cuales, para que nadie
> desperdicie un dia en algo que no esta listo.

## Que se espera de un cambio

El proyecto se construye por **loops**: cada loop cierra una pregunta y deja
su razonamiento escrito. Un cambio entra en el loop al que pertenece, no por
encima de el.

Un cambio esta **terminado** cuando:

1. Los cuatro guards pasan: `npm run check`.
2. El estado publicado cuadra con la realidad: `npm run verificar-estado`.
3. Si el cambio toca prosa, el documento se **juzga** contra el criterio con el
   que fue escrito, y el veredicto es `aligned`.
4. Si el veredicto dice `needs_human`, el cambio **no** esta terminado. Se
   para y se pregunta, no se reintenta hasta que salga bien.
5. El documento que describe el cambio se lee despues de escribirlo. El
   content-guard caza la intrusion de otro guion y los enlaces rotos; **no**
   caza el ingles mal puesto, y esa es la parte que toca la persona.

## Los cuatro guards, y que no ven

`content`, `budget`, `test` y `mutate`. Cada uno caza una cosa distinta, y
**cada uno deja cosas sin ver**: el de contenido no juzga si el texto dice la
verdad, el de presupuesto no juzga si la particion es por donde tiene sentido,
y el de mutacion no dice que el diseño sea el mejor.

La tabla completa, con que mide cada uno y que no ve, esta en
[docs/como-verificar.md](docs/como-verificar.md).

Por eso **el guard y la persona se necesitan**. Un guard que se puede
satisfacer editando el contenido que deberia proteger no es un guard, y una
prosa con el ingles mal puesto no la caza ninguna maquina.

## El presupuesto de 4096 bytes

Todo artefacto que se pasa al juez tiene que caber en 4096 bytes, porque el
juez lo trocea ahi: con dos trozos, el criterio escrito sobre el todo se
aplica a un fragmento, y el veredicto es ruido.

Cuando un documento se pasa del tope, **se parte por concepto**, nunca se
amputa: cada mitad tiene que tener una sola preocupacion. Si se amputa prosa
para que el numero pase, el guard esta contando el recorte y no la verdad.

## Reglas de estilo

- **Espanol neutro**, con mayusculas y sin tildes cuando la palabra se escribe
  siempre asi. Sin jerga de_region en la prosa.
- **El codigo y los mensajes de error, en ingles**, porque son la API.
- **Ningun numero sin medirlo antes.** Un numero que no se ha medido se
  escribe como pendiente, no como afirmación.
- **Ninguna afirmacion sobre el estado del juez.** El registro autoritativo
  esta en `dark_memory_judgment_history`, no en un documento.

## Lo que todavia no esta listo

Esto es lo que **no** hay que asumir al trabajar en este repositorio:

- **Los niveles de aislamiento del sandbox son politica verificada, no
  ejecucion real.** No hay Pyodide, ni WebContainers, ni Firecracker
  conectados. Por eso el repositorio no publica que el sistema ejecuta con
  red.
- **La herramienta de busqueda declara una capacidad que no tiene.** El
  transporte falta, y el caso canonico existe para que ese hueco se vea en
  cada corrida.
- **El veredicto del juez no corre en la CI de este repositorio.** El gate
  vive en `dark-memory-mcp`, que no es parte de este repositorio.
- **La memoria boundary esta especificada, no implementada.** Los bordes que
  hacen falta estan escritos en `docs/arquitectura/loops/`.

## Como ejecutar

```bash
cd vibe-tools
npm install
npm run check              # los cuatro guards
npm run verificar-estado   # el estado publicado contra la realidad
npm run generar-estado     # rehace la superficie publica
npm run generar-sitio      # rehace el sitio
```

## Reportar un problema

Un bug, por la via normal: un issue. Un problema de seguridad, por la via
silenciosa: [SECURITY.md](SECURITY.md). Ese canal existe para que el detalle
no quede publico antes de tiempo.
