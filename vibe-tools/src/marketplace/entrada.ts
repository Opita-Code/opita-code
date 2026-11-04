/**
 * L6-T1 · LA ENTRADA: lo que hay en el catalogo.
 *
 * QUE ES. El registro de UNA cosa publicada: una tool atomica o un modulo. Y
 * es un dato, sin metodos: la entrada se lee, se compara y se copia. Todo lo
 * que hace (validar, licenciar, publicar) vive en otros archivos, porque una
 * entrada que sabe hacer cosas es un objeto con estado y el catalogo necesita
 * poder compararlas.
 *
 * POR QUE LOS CAMPOS DE LA ENTRADA NO SE DECLARAN.
 *
 *   El id, la version, el autor y el titulo YA ESTAN en el descriptor, y el
 *   descriptor es lo que tiene huella. Copiarlos a la entrada abre una puerta
 *   que no hace falta abrir: dos campos que pueden discrepar. Un modulo
 *   publicado con un autor en la entrada y otro en el descriptor es un modulo
 *   del que no se sabe quien es, y "el usuario es dueño de su codigo" no se
 *   puede sostener con dos verdades. Por eso la entrada los DERIVA.
 *
 *   Lo mismo con la clase y con el nivel: la clase sale del eje 2 y el nivel
 *   de la forma del descriptor. Un autor que declara "esto es una mutacion" y
 *   publica una tool estocastica esta mintiendo en su propio registro, y el
 *   registro no es el sitio donde se comprueba.
 *
 * POR QUE LA AFIRMACION VIAJA CON LA ENTRADA.
 *
 *   Una parte se juzga contra SU propia afirmacion, y las partes de un modulo
 *   son sus nodos. Quien publica escribe una afirmacion por nodo, y por eso
 *   la afirmacion es parte de la entrada: es la pregunta que el juez va a
 *   responder. Si la afirmacion viviera fuera, el juez juzgaria una pregunta
 *   que nadiefirmo.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No valida, no licencia, no publica y no
 * ordena: eso son `validar.ts`, `licencia.ts`, `publicar.ts` y `catalogo.ts`.
 */

import { integrityOf, type ModuleDescriptor, type ToolDescriptor } from '../contract.js';
import { claseDeModulo, claseDeTool, type Clase } from './clase.js';

/** Los dos niveles en los que se publica. */
export type Nivel = 'tool' | 'modulo';

/**
 * Los estados de una entrada, en el orden del flujo.
 *
 * `validado` y `juzgado` son las dos mitades de "validar" del plan: la primera
 * es la comprobacion determinista (las reglas, la huella, la lista blanca) y
 * la segunda es el veredicto del juez. Son dos estados y no uno porque
 * fallan por razones distintas: una entry invalida no es una entry que el juez
 * no ha mirado, y confundirlas haria que un fallo de codigo se reportara como
 * un veredicto.
 */
export type Estado =
  | 'creado'
  | 'validado'
  | 'juzgado'
  | 'licenciado'
  | 'publicado'
  | 'suspendido'
  | 'retirado';

/** El descriptor que se publica: una tool atomica o un modulo. */
export type Descriptor = ToolDescriptor | ModuleDescriptor;

/** Una entrada del catalogo. Dato puro: sin metodos y sin estado propio. */
export interface Entrada {
  readonly id: string;
  readonly version: string;
  readonly autor: string;
  readonly titulo: string;
  readonly nivel: Nivel;
  readonly clase: Clase;
  /** sha256 del descriptor canonico. Se calcula; no se escribe. */
  readonly huella: string;
  readonly descriptor: Descriptor;
  readonly estado: Estado;
  /** Una afirmacion por parte, en el orden de las partes. */
  readonly afirmaciones: readonly string[];
  /** El numero de publicacion. `null` mientras no se publique. */
  readonly secuencia: number | null;
  /** Por que se suspendio o se retiro. `null` mientras no haya pasado. */
  readonly motivo: string | null;
}

/** Si el descriptor es un modulo. Un modulo tiene nodos; una tool, no. */
export function esModulo(descriptor: Descriptor): descriptor is ModuleDescriptor {
  return 'nodes' in descriptor;
}

/** El nivel, derivado de la forma del descriptor. */
export function nivelDe(descriptor: Descriptor): Nivel {
  return esModulo(descriptor) ? 'modulo' : 'tool';
}

/** La clase, derivada del eje 2 del descriptor. */
export function claseDe(descriptor: Descriptor): Clase {
  return esModulo(descriptor) ? claseDeModulo(descriptor) : claseDeTool(descriptor.determinism);
}

/**
 * Crea la entrada de un descriptor.
 *
 * El id, la version, el autor, el titulo, el nivel, la clase y la huella se
 * derivan: no se reciben. Lo unico que recibe son las afirmaciones, que son
 * del autor y no se pueden deducir.
 */
export function crearEntrada(descriptor: Descriptor, afirmaciones: readonly string[]): Entrada {
  return {
    id: descriptor.id,
    version: descriptor.version,
    autor: descriptor.author,
    titulo: descriptor.title,
    nivel: nivelDe(descriptor),
    clase: claseDe(descriptor),
    huella: integrityOf(descriptor),
    descriptor,
    estado: 'creado',
    afirmaciones: [...afirmaciones],
    secuencia: null,
    motivo: null,
  };
}
