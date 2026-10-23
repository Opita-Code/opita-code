# L3 · Criterio: qué borde se escribe y hasta dónde llega esto

> Parte 2 de 10. [mindsets](L3-mindsets.md) · [criterio](L3-criterio.md) · [mindset-espejo](L3-mindset-espejo.md) · [mindset-empresa](L3-mindset-empresa.md) · [mindset-archivo](L3-mindset-archivo.md) · [mindset-veredicto](L3-mindset-veredicto.md) · [mindset-precio](L3-mindset-precio.md) · [mindset-no-pedi](L3-mindset-no-pedi.md) · [reconciliacion](L3-reconciliacion.md) · [cambios](L3-cambios.md)
> Spec 538. Tarea L3-T1.

Va aparte de [mindsets](L3-mindsets.md) a propósito. Ahí está el diagnóstico y la
conclusión; aquí está **el método y sus límites**. Un lector que acepta las
conclusiones tiene derecho a rechazar el método sin que ambas cosas se vayan juntas.

Y hay una razón más fuerte: si el criterio viviera en el mismo documento que
las conclusiones, el juez no podría distinguirlas, y un artifact que dice «esto es lo
que sé» junto a «esto es lo que no sé» se lee como un artifact más grande de lo que
es.

## El criterio para no inventar

El operador pidió razonar la psicometría y no inventar bordes. «No inventes edge
cases», escrito literal, es insatisfacible: todo edge case es un hipotético
construido, y no hay otra forma de que uno exista. La versión operable es **«no
inventes personas»** — no inventes a quién le ocurre. Eso es lo que hace falta para
anclar, y es lo que este criterio aplica.

Un borde se escribe solo si pasa las cuatro:

1. **Se sigue de una psicometría declarada.** Se puede decir por qué esta persona
   cae aquí y no una máquina. Si la respuesta es «porque es un caso raro», no es un
   borde: es una excusa.
2. **No está ya cubierto** por E1-E12 ni por T1-T8. Si ya estaba, sobra.
3. **Fuerza una decisión distinta.** Cambia la arquitectura, la base legal o la
   promesa del producto. Si no cambia nada, es decoración.
4. **Se puede nombrar lo que no sé.** Un documento que no dice dónde se acaba su
   razonamiento no está razonando: está suponiendo.

La cuarta es la que más cuesta, y la que más falta antes de este turno. Un borde
sin su cadena escrita —**conducta → en qué momento concreto → qué exige**— es una
afirmación con forma de razonamiento. Y citar un id de memoria al lado no la
convierte en fundamento: es decoración con apariencia de fundamento, que es peor
que la invención visible porque deja de verse como invención.

## Lo que este razonamiento no cubre

Con criterio, y dicho antes de que se lea lo demás:

- **No hay evidencia de clientes fuera de Colombia.** No escribo bordes de
  psicometría transfronteriza ni de nivel de protección art. 19. Es un abierto
  legal abierto, no un borde.
- **No hay evidencia sobre accesibilidad ni sobre edad.** No escribo bordes de
  memoria como barrera para alguien que no puede leerla, y ese es un hueco real:
  es el caso donde la memoria es lo único que la persona tiene.
- **No hay datos de uso.** El split novice/expert viene de una decisión guardada,
  no de entrevistas. Los dos subcohortes son hipótesis, y por eso ninguna conclusión
  de estos documentos depende de ellos.
- **La psicometría es lo que menos se sabe.** El scope H lo declara y nadie ha
  medido qué señales psicométricas predicen qué. Los bordes del veredicto y del
  precio descansan sobre la **política declarada**, no sobre la eficacia medida.
  Si el scope H cambia la política, estos dos documentos cambian.
- **La anchura demográfica no aplica.** No hay datos demográficos, así que ningún corte es
  por edad, género o zona.

## Lo que sigue sin responder

El operador no respondió si el **corte por creencia** es el correcto, o si prefiere
otro eje. El corte elegido es defendible y está razonado, pero es una elección
mía entre varias posibles, y por eso queda marcada como abierta en lugar de
darse por buena. Cambiar el eje cambia los seis documentos; por eso la decisión
es suya y no la tomo yo.