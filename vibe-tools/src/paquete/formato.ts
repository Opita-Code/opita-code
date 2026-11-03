/**
 * L4-T6 · EL FORMATO: que es un `.opitapack`.
 *
 * QUE ES. Un paquete es DATO: JSON puro, sin funciones, sin referencias, sin
 * estado. Es lo que lo hace publicable, versionable, hasheable y portable
 * entre runtimes sin reescribir nada, que es el mismo motivo por el que los
 * descriptores de L0 son datos.
 *
 * POR QUE EL PAQUETE NO LLEVA SU PROPIO NOMBRE, SU PROPIA VERSION NI SU
 * PROPIO AUTOR. El modulo ya los tiene. Duplicarlos seria una segunda fuente
 * de verdad para el mismo dato: el paquete y el modulo podrian discrepar, y
 * no habria quien lo notara. El paquete identifica su modulo, no al reves.
 *
 * POR QUE LA VERSION DEL FORMATO VA DENTRO Y NO FUERA. Un formato cambia sus
 * reglas, y el que lo lee necesita saber que reglas son las que aplica. Un
 * numero escrito en el nombre del archivo no lo dice: la version es un dato,
 * y va en el dato.
 *
 * POR QUE LA HUELLA ESTA, Y QUE ES LO QUE VERIFICA. La huella es el sha256 del
 * modulo canonico. Detecta que el contenido cambio por el camino, que es lo
 * que hace que un paquete sea un artefacto y no un fichero cualquiera. NO
 * verifica que el modulo sea el que su autor quiso: eso necesitaria una firma,
 * y aqui no hay ninguna. El autor viaja en el modulo, y el codigo se resuelve
 * por (id, version), como ya hace el registry desde L0.
 *
 * LO QUE EL PAQUETE NO LLEVA, Y POR QUE.
 *
 *   - LA MEMORIA DEL TITULAR. La exporta el companion (dark-memory), que es
 *     quien la tiene. Este runtime no la tiene, y un campo para ella seria una
 *     promesa que nadie puede cumplir aqui. El derecho de portabilidad del
 *     art. 8 lo cumple quien tiene los datos, con este mismo formato.
 *   - EL CODIGO DE LAS TOOLS. La magia se resuelve por (id, version) en el
 *     registry. El paquete lleva la promesa, no el cumplimiento: el contrato
 *     es la promesa y el codigo es su cumplimiento, y esa division ya es de L0.
 */

import type { ModuleDescriptor } from '../contract.js';
import type { CategoriaConcedida } from '../permisos/categorias.js';

/**
 * EL NOMBRE DEL FORMATO.
 *
 * Lo decidio el operador el 2026-10-26, con una razon corta: «es mejor para
 * nosotros los humanos». El nombre de un formato lo lee una persona antes que
 * un parser, y `.opitpack` no se leia como Opita + pack. Por eso la extension
 * va aqui, y no repartida por el codigo: el nombre es del formato.
 */
export const FORMATO_PAQUETE = 'opitapack';

/** La extension del fichero. */
export const EXTENSION_PAQUETE = '.opitapack';

/**
 * LA VERSION DEL FORMATO.
 *
 * Es la de las REGLAS del formato, no la del modulo que viaja dentro: el
 * modulo lleva la suya. Cambia cuando cambia la forma, y cambiar la forma sin
 * cambiarla aqui haria que un lector viejo aceptara algo que no entiende.
 */
export const VERSION_FORMATO = '1.0.0';

/**
 * EL PAQUETE.
 *
 * Cuatro campos, y ninguno sobra. `modulo` es el bundle: el grafo con sus
 * nodos, y en cada nodo el descriptor de la tool (que es donde viven sus
 * versiones y los permisos que declara como techo). `huella` es la del modulo.
 */
export interface Paquete {
  /** Siempre `opitapack`. Un paquete de otro formato no se lee aqui. */
  readonly formato: typeof FORMATO_PAQUETE;
  /** La version de las reglas del formato. */
  readonly formato_version: string;
  /** El bundle: el modulo y sus tools. */
  readonly modulo: ModuleDescriptor;
  /** El sha256 del modulo canonico. */
  readonly huella: string;
}

/** Los campos que el formato define. Los demas son un error, no una extension. */
export const CAMPOS_PAQUETE = ['formato', 'formato_version', 'modulo', 'huella'] as const;

/**
 * POR QUE UN CAMPO QUE NO SE CONOCE ES UN ERROR Y NO SE IGNORA.
 *
 * Un lector que descarta lo que no entiende deja pasar lo que no debia: un
 * paquete con un campo `concede_permisos: true` seria ignorado, y el paquete
 * se instalaria creyendose mas de lo que es. Fallar fuerte es la
 * unica forma de que "no lo entiendo" signifique "no lo instalo".
 */
export type MotivoPaquete =
  /** El paquete no se puede leer como texto JSON. */
  | 'E_LECTURA'
  /** Falta un campo que el formato exige. */
  | 'E_CAMPO_AUSENTE'
  /** Hay un campo que el formato no define. */
  | 'E_CAMPO_DESCONOCIDO'
  /** El campo `formato` no es `opitapack`. */
  | 'E_FORMATO_AJENO'
  /** La version del formato no es la que este runtime conoce. */
  | 'E_VERSION_FORMATO'
  /** El modulo no da la huella declarada. */
  | 'E_HUELPA'
  /** El modulo no pasa las reglas de composicion. */
  | 'E_MODULO_INVALIDO';

/** El resultado de mirar un paquete: o es un paquete, o no lo es y se dice por que. */
export type ValidacionPaquete =
  | { readonly ok: true; readonly paquete: Paquete }
  | { readonly ok: false; readonly motivo: MotivoPaquete; readonly detalle: string };

/**
 * LO QUE EL PAQUETE PIDE AL OPERADOR.
 *
 * Una peticion NO es una concesion: es lo que el paquete necesitaria para
 * funcionar con contexto. El que concede es el operador, por la puerta de
 * L4-T5, y conceder es un acto aparte de instalar.
 *
 * `contexto` es la categoria que pide, o `null` si no pide contexto: el techo
 * declarado de la tool es lo que dice, y una tool con techo `none` no pide
 * nada. `psicometria` es un SI O NO, y no una lista de finalidades: la
 * finalidad la elige quien concede, porque es el acto del consentimiento.
 *
 * Y POR QUE NO HAY UN CAMPO DE ESCRITURA. Escribir en la memoria es una
 * capacidad que concede el operador a un (id, version, autor), y ninguna tool
 * la declara: el `effect` del contrato es el efecto de la tool sobre su
 * entorno (un fichero, la red), y no es lo mismo que escribir en la memoria.
 * Confundir los dos haria que una tool que escribe en un fichero pareciera
 * pedir permiso para reescribir la memoria de quien la instala. Lo que el
 * paquete da es la LISTA de sus tools, que esta en el modulo, y de ahi sale
 * a quien se le puede conceder escritura.
 */
export interface Peticion {
  /** El id de la tool que pide. */
  readonly herramienta: string;
  /** La version exacta de la tool que pide. */
  readonly version: string;
  /** El autor de la tool que pide. */
  readonly autor: string;
  /** La categoria de contexto que pide, o `null` si no pide contexto. */
  readonly contexto: CategoriaConcedida | null;
  /** Si pide poder leer el psicometrico. */
  readonly psicometria: boolean;
}

/**
 * QUE ES UN MODULO, EN EL SENTIDO ESTRUCTURAL.
 *
 * El repositorio no confia en el llamador, y un paquete es lo mas parecido a
 * una entrada no confiable que hay: viene de otro sitio. El union discriminado
 * protege en tiempo de compilacion, y esa proteccion se pierde en cuanto el
 * objeto se arma a mano: un paquete llega de un fichero, y ahi el compilador
 * ya no mira.
 */
function esModulo(valor: unknown): valor is ModuleDescriptor {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return false;
  const m = valor as Record<string, unknown>;
  return (
    typeof m.id === 'string' &&
    m.id !== '' &&
    typeof m.version === 'string' &&
    m.version !== '' &&
    typeof m.author === 'string' &&
    typeof m.title === 'string' &&
    Array.isArray(m.nodes) &&
    Array.isArray(m.edges) &&
    Array.isArray(m.sinks)
  );
}

/**
 * LA FORMA, MIRADA.
 *
 * Comprueba lo que el formato exige y nada mas: que esten los cuatro campos,
 * que no haya un quinto, que el formato sea el de este runtime y que su
 * version sea la que este runtime conoce. NO comprueba la huella ni las reglas
 * del modulo: eso es de la instalacion, que es donde se mira un paquete antes
 * de usarlo.
 */
export function validarPaquete(candidato: unknown): ValidacionPaquete {
  if (typeof candidato !== 'object' || candidato === null || Array.isArray(candidato)) {
    return { ok: false, motivo: 'E_CAMPO_AUSENTE', detalle: 'el paquete no es un objeto' };
  }
  const obj = candidato as Record<string, unknown>;

  for (const campo of CAMPOS_PAQUETE) {
    if (!Object.prototype.hasOwnProperty.call(obj, campo)) {
      return { ok: false, motivo: 'E_CAMPO_AUSENTE', detalle: `falta el campo ${campo}` };
    }
  }
  for (const clave of Object.keys(obj)) {
    if (!(CAMPOS_PAQUETE as readonly string[]).includes(clave)) {
      return {
        ok: false,
        motivo: 'E_CAMPO_DESCONOCIDO',
        detalle: `campo que el formato no define: ${clave}`,
      };
    }
  }
  if (obj.formato !== FORMATO_PAQUETE) {
    return {
      ok: false,
      motivo: 'E_FORMATO_AJENO',
      detalle: `formato ${String(obj.formato)}: este runtime solo lee ${FORMATO_PAQUETE}`,
    };
  }
  if (obj.formato_version !== VERSION_FORMATO) {
    return {
      ok: false,
      motivo: 'E_VERSION_FORMATO',
      detalle: `version del formato ${String(obj.formato_version)}: este runtime conoce la ${VERSION_FORMATO}`,
    };
  }
  if (typeof obj.huella !== 'string' || obj.huella === '') {
    return { ok: false, motivo: 'E_CAMPO_AUSENTE', detalle: 'la huella no es una cadena' };
  }
  if (!esModulo(obj.modulo)) {
    return {
      ok: false,
      motivo: 'E_CAMPO_AUSENTE',
      detalle: 'el modulo no tiene la forma de un descriptor de modulo',
    };
  }
  return {
    ok: true,
    paquete: {
      formato: FORMATO_PAQUETE,
      formato_version: VERSION_FORMATO,
      modulo: obj.modulo,
      huella: obj.huella,
    },
  };
}

/**
 * LEER UN PAQUETE DE SU TEXTO.
 *
 * El paquete viaja como texto, y el texto es lo que se puede alterar por el
 * camino. Por eso leer no es `JSON.parse` y ya: es parsear y ADEMAS mirar la
 * forma, para que un texto que no es un paquete no llegue ni al instalador.
 */
export function leerPaquete(texto: string): ValidacionPaquete {
  let dato: unknown;
  try {
    dato = JSON.parse(texto);
  } catch (e) {
    return {
      ok: false,
      motivo: 'E_LECTURA',
      detalle: `el paquete no es JSON: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  return validarPaquete(dato);
}

/**
 * LAS PETICIONES DEL PAQUETE, DERIVADAS.
 *
 * DERIVADAS Y NO DENTRO DEL FORMATO, y esa es la decision que importa: si el
 * paquete llevara sus peticiones y ademas cada tool llevara su techo, habria
 * DOS fuentes de verdad para lo mismo, y la segunda podria divergir de la
 * primera sin que nadie lo notara. La peticion se calcula del descriptor, que
 * es la unica copia.
 *
 * Y una tool que no pide nada no aparece: una peticion de nada no es una
 * peticion, y una lista con huecos esconde los huecos.
 */
export function peticionesDe(paquete: Paquete): readonly Peticion[] {
  const peticiones: Peticion[] = [];
  for (const nodo of paquete.modulo.nodes) {
    const tool = nodo.tool;
    const contexto = tool.context_profile === 'none' ? null : tool.context_profile;
    if (contexto === null && !tool.psychometrics) continue;
    peticiones.push({
      herramienta: tool.id,
      version: tool.version,
      autor: tool.author,
      contexto,
      psicometria: tool.psychometrics,
    });
  }
  return peticiones;
}
