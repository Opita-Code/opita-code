# L3 · Decisión A7, primera mitad: el sexto consentimiento

> La pregunta que quedó abierta en L3, con la evidencia, las opciones y lo que
> costaría cada una. Es tuya: [lo que L3 dejó abierto](L3-cambios.md). La
> otra mitad —el techo de falsos positivos— está en
> [A7-techo](decision-A7-techo.md), porque es una medición y no una
> decisión.

## La pregunta, tal como está declarada

| | |
|---|---|
| Id | A7 |
| Quién decide | el operador |
| Qué bloquea | la capa psicométrica |
| La pregunta | el sexto consentimiento, en contexto de organización, y el techo de falsos positivos |

Y aviso desde el principio: **esta pregunta son dos cosas de naturalezas
distintas**, y solo una de las dos es una decisión. Esta es la que sí lo es.

## Lo que YA está decidido

Los consentimientos C1 a C5, con su base (documento legal, §2):

| | Consentimiento | Cómo |
|---|---|---|
| C1 | Identificación / KYC | consentimiento + obligación legal |
| C2 | Biometría (liveness / face-match) | explícita y separada (art. 9) |
| C3 | Perfil psicométrico para personalizar | explícita y separada (art. 9) |
| C4 | Misiones personalizadas (engagement) | fin distinto → requiere el suyo |
| C5 | Aceptación de términos generales | consentimiento |

Y el principio que las gobierna: **C3 y C4 son finalidades distintas con
bases legales distintas**. Aceptar la personalización no autoriza el
engagement, ni al revés.

## El hueco, en una línea

> El empleado nunca autorizó que su conducta se guardara en la organización.
> Los consentimientos C1-C5 cubren a *la persona* y su propio uso. Ninguno
> cubre «mi forma de trabajar es un activo de mi empleador».
> — E-EMP-2, `L3-mindset-empresa.md`

Y el repo lo dice sin rodeos: **es un hueco legal, no de ingeniería, y no lo
cierro yo** (`L3-cambios.md`). Es una pregunta de abogado, y es el hueco más
grande que salió de los seis documentos.

## Las opciones

**Opción A1 — un C6, propio y separado.** La pantalla del empleado, no la de
la organización: el empleado consiente que su forma de trabajar se guarde en
la organización, con la finalidad declarada. Es el mismo patrón que C2, C3 y
C4: consentimientos separados porque las finalidades son distintas.

**Opción A2 — otra base legal.** La que determine un abogado: contrato
laboral, interés legítimo, o lo que corresponda. **No la invento aquí**, y
tampoco la puede inventar el repo.

**Opción A3 — la organización no recibe el contexto del empleado.** El trabajo
del empleado no entra en el `mod` de la organización. Es la opción dura, y
tiene un efecto colateral que resuelve otro borde: E-EMP-3 («el empleado se
va») deja de ser un conflicto, porque nunca hubo nada que sacarse.

## Mi recomendación, y su límite

**A1 como diseño por defecto, con la base legal que diga el abogado, y el
producto funcionando igual si el empleado dice que no.**

La segunda mitad es la que no se negocia, y no la invento: el documento legal
ya tiene el principio y el test —«rechazar psicometría no impide usar la
plataforma»—. Ese principio se aplica tal cual: **si el empleado no
consiente, la organización sigue funcionando con lo que hay**, y el
consentimiento nunca es la puerta de entrada al producto.

La razón de fondo es que A1 y A3 se parecen en el efecto y se diferencian en
el papel: A1 reconoce que la organización va a usar el dato y le pide
permiso; A3 lo prohíbe. Si el abogado dice que la base legal es la del
contrato y no la del consentimiento, entonces A1 sigue siendo el diseño
correcto, porque el producto ya está preparado para que el dato no llegue.

## Qué necesito de ti

**A7-A: ¿A1, A2 o A3?** Y si la base legal necesita un abogado, ¿lo encargas?
Eso es una decisión de coste y de tiempo, no de diseño.
