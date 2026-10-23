# L3 · Mindset NO PEDÍ — esto se recogió y yo no lo autoricé

> Parte 8 de 10. [mindsets](L3-mindsets.md) · [criterio](L3-criterio.md) · [mindset-espejo](L3-mindset-espejo.md) · [mindset-empresa](L3-mindset-empresa.md) · [mindset-archivo](L3-mindset-archivo.md) · [mindset-veredicto](L3-mindset-veredicto.md) · [mindset-precio](L3-mindset-precio.md) · [mindset-no-pedi](L3-mindset-no-pedi.md) · [reconciliacion](L3-reconciliacion.md) · [cambios](L3-cambios.md)
> Spec 538. Tarea L3-T7.

## La psicometría

- **Quiere** saber por qué está en el sistema, o no estar en él.
- **Teme** que lo rastreen por algo que no recuerda haber hecho.
- **Responde ante** nadie, ni siquiera ante sí mismo.
- **Trueque** nada. Nadie le preguntó.

Lo que lo distingue: **es el default real y el plan no lo contempla**. Todo lo
diseñado asume que la persona llega, consiente y elige. En la práctica se instala,
escribe, y ya existe un perfil antes de que se le haya mostrado una sola pantalla.

## Los bordes

| # | Borde | Por qué esta persona | Qué exige |
|---|---|---|---|
| E-NOP-1 | La primera pantalla que ve es el KYC | El KYC es obligatorio para todas las personas y es la puerta de entrada. Quien no ha visto ninguna pantalla previa no podía ser informado de nada. | **El KYC no puede ser la puerta**, porque no informa. O hay una divulgación previa que diga qué se va a construir. Si no, C1 está cargando con el peso del consentimiento informado de D1, D2 y de los espacios de identidad. |
| E-NOP-2 | El perfil se construye de lo que hizo, no de lo que declaró | Scroll, tiempos, reintentos, lo que abandonó. C3 dice «perfil psicométrico» y no dice de dónde sale. | **Separar dato declarado de dato observado**, cada uno con su base. Hoy D3 no dice cuál de los dos es. |
| E-NOP-3 | Ya hay memoria y no hay `mod` que borrar | Grabó algo antes de que existiera consentimiento. Puede que el `mod` exista y no lo sepa, o que la memoria esté en otro sitio. | **Definir dónde vive la memoria anterior al `mod`.** La spec asume que hay un `mod`; no define el caso en que no lo hay. |
| E-NOP-4 | Dice «nunca autoricé eso» y le piden que rectifique | «No lo autoricé» no es rectificación: es supresión. Y no son la misma vía, ni la misma velocidad, ni la misma consecuencia sobre lo derivado. El sistema tiene que poder **distinguir las dos**, lo que significa que necesita saber cómo entró cada campo. | **Procedencia con base legal, campo por campo, no por `mod`.** Esta es la pieza que hace respondibles a la vez el espejo y este mindset. |

## Qué le exige a la spec

Toda la §3 habla de que cada tool declara un perfil de contexto y el harness lo
concede. Eso presupone una persona que autorizó. Este mindset es el que no autorizó,
y para él el modelo entero no tiene punto de entrada: no hay un instante en que se
puede decir «consentí» porque no hubo decisión.

Lo que sí se puede es **registrar de dónde salió cada campo** y tratar cada origen
con su base. Sin eso, ni el derecho de acceso ni el de rectificación tienen un
sujeto al que aplicarse.

## Lo que no sé

No sé qué se hace con la memoria anterior al consentimiento: se borra, se marca,
o se declara como tratamiento de una naturaleza distinta de la psicometría — con lo que
el nombre «perfil» no alcanza. Y no sé si el KYC obligatorio puede tener
preguntas previas sin romper la simplicidad del onboarding, porque ese es un
compromiso de producto y no una decisión técnica.
