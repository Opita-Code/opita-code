# L3 · Reconciliación: qué sobrevive, qué se rompe, qué hay que añadir

> Parte 9 de 10. [mindsets](L3-mindsets.md) · [criterio](L3-criterio.md) · [mindset-espejo](L3-mindset-espejo.md) · [mindset-empresa](L3-mindset-empresa.md) · [mindset-archivo](L3-mindset-archivo.md) · [mindset-veredicto](L3-mindset-veredicto.md) · [mindset-precio](L3-mindset-precio.md) · [mindset-no-pedi](L3-mindset-no-pedi.md) · [reconciliacion](L3-reconciliacion.md) · [cambios](L3-cambios.md)
> Spec 538. Tarea L3-T8.

La spec [boundary-memory-v1.md](../boundary-memory-v1.md) tiene 8 reglas, 12
bordes y 8 tests. Esto no la sustituye: la contrasta con seis personas y dice qué
parte aguanta. Regla por regla.

## Las ocho reglas

| # | Regla | Veredicto | Por qué |
|---|---|---|---|
| §1 | La tool nunca lee la memoria | **sigue** | Ningún mindset la toca. Es la mejor regla del documento. |
| §2 | Solo el harness decide; la tool no declara qué contexto quiere | **se rompe a medias** | El experto **es el autor** de sus tools. No es un atacante: es alguien que escribe. La prohibición necesita una excepción para el autor, con su propia revisión. Autor no es atacante. |
| §3 | Minimización por `context_profile` | **insuficiente** | El perfil lo declara la tool, pero el campo que ningún perfil cubre es la **procedencia**, y es el que hace respondibles el espejo y el no-pedí. |
| §4 | Las identidades nunca se cruzan | **falsa como absoluto** | El nombre público del dueño es un cruce deliberado y ya decidido. Y el rol del fundador necesita llegar sin convertirse en contexto. |
| §5 | La tool no escribe, emite solicitud | **sigue, incompleta** | No cubre que el escritor sea una tool **autorizada** de la propia organización. Ahí la amenaza no es externa. |
| §6 | El psicométrico es sensible y se rastrea para qué | **se rompe** | Hay dos casos donde la finalidad la fija el sistema y no la persona: las misiones que benefician a Opita, y el antifraude que no beneficia a nadie. «Rastrear para qué» presupone un «para qué» que la persona no ha declarado. |
| §7 | Auditar cada inyección, siete campos | **es media fila** | Registra entradas. Faltan las dos mitades: qué salió, y qué se le dijo a la persona de sí misma. |
| §8 | El contexto no sale del sandbox | **cubre la técnica** | Corta la exfiltración por red. No cubre la exfiltración por el canal previsto: la respuesta de una tool legítima que devuelve el perfil a un tercero. |

## Los doce bordes y los ocho tests

Los doce **sobreviven**: son correctos y hacen falta como pruebas de runtime. Lo que
cambia es que dejan de ser la fuente del diseño. Los ocho tests también. Ninguno se
toca.

Lo que hay que **añadir** son siete, y cada uno viene de un mindset:

| Test | Criterio | De dónde sale |
|---|---|---|
| T9 | Rectificar un hecho deja de circular lo inferido con él | espejo |
| T10 | El flag antifraude es visible y rectificable por su titular | veredicto |
| T11 | El rol llega a la tool como aserción, no como contexto | empresa |
| T12 | El nombre público es el único campo que cruza identidades | archivo |
| T13 | La salida de una tool legítima queda auditada, no solo la entrada | veredicto |
| T14 | Borrar es comprobable: nada derivado sobrevive fuera del `mod` | espejo |
| T15 | Revocar dice en palabras qué se pierde antes de hacerlo | precio |
