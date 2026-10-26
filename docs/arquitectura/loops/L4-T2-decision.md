# L4-T2 · La decisión: el stack es viable, y una de las cinco señales no es libre

> Parte 6 de L4. [La matriz](L4-T2-matriz.md) · [Las piezas](L4-T2-piezas.md) ·
> [Las tres identidades](L4-identidades.md) · [El alcance](L4-alcance.md) ·
> [El índice de L4](INDICE-L4.md)

## Lo que se decidió

L4-T2 cierra su KPI: **el stack es viable**, con una costura declarada. El plan
decía que, si el stack fuera insuficiente, había que replantear la identidad.
No hace falta replantearla: cuatro de las cinco señales tienen dueño libre, y
la quinta, el registro oficial, no lo tiene y no lo va a tener.

Lo que se decide es, entonces, **qué se puede decir de una identidad legal**:

- Se puede decir que su documento se leyó, que hubo liveness, que se cotejó el
  rostro y que se corrió el screening. Eso es medible y es libre.
- **No se puede decir** que el documento es auténtico frente al Estado. Eso es
  un contrato, no una pieza de código.

Y el runtime no cambia de opinión por esto: la fábrica legal sigue sin aceptar
un KYC y el validador sigue rechazando `verificada` con `E_KYC_SIN_STACK`. Lo
que cambia es la razón: ya no es «todavía no se investigó», es «se investigó, y
esta señal cuesta dinero».

## Lo que haría falta para abrir esa puerta

El runtime solo debería aceptar `verificada` cuando alguien pueda NOMBRAR lo que
la respalda. Ese nombre es un stack, y un stack tiene que poder declarar cuatro
cosas: que leyó el documento, que hubo liveness, que se cotejó el rostro y que
se corrió el screening, con la fecha y el nombre del stack. Si falta una de
las cuatro, no hay identidad verificada: hay una afirmación.

Eso no se implementa todavía, porque el stack no existe en ninguna parte: es
código del harness, con cámara y con un modelo, y el runtime es una caja de
herramientas sin cámara. Implementar la mitad sin la otra sería prometer KYC
que nadie puede entregar.

## Qué NO ve esta decisión

- El runtime no comprueba que el stack haya hecho lo que dice: comprueba la
  forma, no la verdad. La honestidad del stack es del harness.
- El stack libre no comprueba al Estado: por eso la señal registral no existe
  todavía, y por eso `verificada` sigue cerrada.
- Las eficacias que declara cada proyecto (el TPR 97.8% del liveness, por
  ejemplo) son del proyecto: no las medimos.
- El screening solo es tan bueno como la actualización de sus listas, y eso se
  mide fuera del repositorio.
- El QR de la cédula digital de 2024 no se midió: la ruta que se comparó es la
  del código PDF417.

## La pregunta que queda para el operador

**A9: ¿qué puede publicar el producto sobre la identidad legal si el registro
oficial no es libre?**

- **A1 (recomendada).** Se publica **verificación documental**: documento,
  liveness, cotejo y screening, con el nombre que no miente. La señal
  registral queda como una costura declarada y opcional, que el usuario puede
  contratar. Es lo único que se puede sostener sin pagar a nadie.
- **A2.** `verificada` solo con el registro oficial. Entonces el stack libre
  sirve para el antifraude y no para el estado, y la identidad legal del
  producto sigue siendo simulada en la práctica.
- **A3.** La identidad legal no sale hasta que haya contrato con la
  Registraduría, y el producto arranca con las otras dos.

## Y el dato sensible

El rostro y el liveness son datos sensibles (art. 5, Ley 1581): consentimiento
explícito, separado y por escrito, en pantalla propia, y evaluar la
inscripción en el RNBD. Está en [el inventario de datos](../../legal/cumplimiento-aislamiento-datos-v1.md).

## Y lo que queda para L8-T1

Profundizar: modelos de liveness 3D, cotejo con el rostro del documento que
tiene la cédula, y la actualización de las listas de screening. Eso es lo que
el plan dejó para L8-T1, ya con esta matriz como punto de partida.
