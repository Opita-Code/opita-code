// Genera tools/l3-persist-steps.json: session_start + dos guardado de memoria.
// El probe sustituye __SESSION__ por el session_id del session_start.
import { writeFileSync } from 'node:fs';

const RUTA = `RUTA CORRECTA PARA HACER JUDGE, medida el 2026-10-23 tras un diagnostico
completo de por que el juez no podia ver. NO la copie de ningun doc: se leyo
del codigo y de la config viva.

1. HAY DOS CANALES DE LLM, Y SON INDEPENDIENTES
   a) judge-* (LLMJudge, Phase 14 T-301): lo alimenta el FAILOVER sobre el
      keyring del catalogo (anthropic, openai, google, deepseek, minimax,
      minimax-cn, zhipu, moonshot, qwen). El pin DARK_JUDGE_PROVIDER mueve uno
      al frente, y un proveedor en cooldown se salta.
   b) chat-* (NLI, Phase 13 T-201): lo alimenta el BINDING DEL PROYECTO en
      projects.nli_config_json, con primary y fallback.
   El fallo que me costo la sesion: cambiar la key del keyring NO toca el
   canal NLI, porque el NLI usa SOLO el auth_token del binding
   (internal/nli/chat.go:277). Son dos caminos y hay que arreglar los dos.

2. EL VEREDICTO DE drift_judge USA UNO, Y SI FALLA USA EL OTRO
   internal/orchestration/drift_judge.go:209 intenta ensureLLMJudge, que solo
   aplica con prefijo judge- en el primary. Si no, cae a EnsureNLIRouter en
   :306 y llama provider.Score en :340. El error que ve el operador sale de
   :439 como "nli score failed: <err>". O sea: si ves ese texto, el problema
   es el canal NLI, aunque parezca del juez.

3. EL PROVEEDOR NLI SE CACHEA EN EL ORQUESTADOR
   orchestrator.go:317 hace o.nliProvider = p, y :297 lo devuelve sin
   reconstruirlo si no es nil. CONSECUENCIA: cambiar la config del proyecto NO
   toma efecto hasta que el PROCESO REINICIA. Un bind correcto que sigue
   dando 429 es exactamente este sintoma. No aparece en ningun doc de la spec.

4. drift_judge EXIGE artifact_ref, NO content
   Para drift_judge el campo content se IGNORA, y sin artifact_ref la llamada
   da ErrInternal. El artifact_ref puede ser kind=file|git_sha|url|spec_id|
   artifact_id, y exige spec_intent, que es la hipotesis.
   TRAMPA: con kind=file, el path se resuelve contra el CWD DEL PROCESO, no
   contra git_repo. git_repo no hace lo que su nombre dice. Con ruta relativa
   falla con "artifact resolution failed". HAY QUE PASAR RUTA ABSOLUTA.

5. PARA AUMENTAR CAPACIDAD HAY QUE TOCAR LOS DOS LADOS
   llm_key_add(key, provider) guarda en el keyring del SO (Windows Credential
   Manager) y valida con un probe gratis antes de guardar.
   llm_provider_bind(provider_id, endpoint, auth_token?, model_rev?,
   timeout_ms?) escribe el primary del proyecto ACTIVO. provider_id DEBE
   empezar por judge- o chat-; otros prefijos se rechazan, y el auth_token
   nunca se devuelve. El fallback del NLI viene vacio por defecto: si quieres
   redundancia hay que llenarlo a mano.

6. NO CONFUNDAS EL PROBE CON UNA PRUEBA DE SALUD
   llm_provider_probe manda "model":"probe" LITERAL. Un proveedor que valida
   el modelo responde 400 "unknown model". Probe 400 NO significa binding
   roto: es una prueba con un modelo invalido. La verdad la dice una peticion
   real con el modelo real.

7. LOS MODELOS DE RAZONAMIENTO QUEMAN max_tokens EN THINKING
   El NLI manda max_tokens=1024 para MiniMax-M3 (tabla reasoningModelMaxTokens
   en internal/nli/chat.go). Esos tokens van al bloque think antes de la
   respuesta, y el modelo puede agotar el max_tokens SIN emitir la palabra
   final. Con max_tokens=64 el finish_reason es "length" y la respuesta es
   solo thinking: ahi el veredicto degrada sin que haya error de red.

8. EL CATALOGO DICE QUE MINIMAX ES minimaxi.com, Y EL HARNESS USA minimax.io
   Son dominios distintos y la key de uno no sirve en el otro: la misma key
   devolvio 401 en minimaxi.com y 200 en minimax.io. El MCP hereda del
   harness lo que opencode tenga en su auth.json.

9. QUE ES UN needs_human CON confidence 0.0000
   Es que el juez NO PUDO AFIRMAR NADA. No es drift y no es aprobacion. El
   evaluation queda registrado con el motivo, que es lo correcto, y si el
   motivo es infra no cuenta ni como rechazo ni como aprobacion.

10. EL PROCEDIMIENTO, EN ORDEN, CUANDO EL JUEZ NO RESPONDE
    a) llm_provider_status: active_provider (vacio significa que ninguna
       llamada al juez funciono nunca por el failover), has_key, pinned,
       in_cooldown.
    b) llm_key_list: que hay en el keyring y de donde sale.
    c) curl real contra el endpoint con el payload REAL del NLI (model, system,
       user, temperature 0, max_tokens 1024). El curl a mano separa "la key no
       sirve" de "el proceso tiene la config vieja", y esa distincion es la
       que ahorra el rato.
    d) error_list: la clase de error.
    e) Si la config esta bien y el curl da 200 pero el juez da 429, el proceso
       tiene el cliente cacheado: REINICIAR EL MCP.
    f) Dos intentos por unidad. Despues, parar y reportar: reintentar un rate
       limit no lo arregla y quema tiempo.`;

const L3 = `L3 (spec 538) VALIDADO. Commit a4d58d2 (docs) y dd7c737 (sonda).
Predecesores: bb0f2ca (L2), 8c79f13 y 8adce5c (disciplina).

EL VEREDICTO, MEDIDO
  10 de 10 documentos en aligned, con confidence 1.0000, nli_label=entailment,
  provider chat-minimax, model MiniMax-M3, sin degraded. Evaluations 986-995.
  Todo con el mismo proceso fresco y el mismo payload para los diez, cada uno
  con SU spec_intent, narrado y sin afirmar nada que el artefacto no contenga.

  Las evaluations 979 a 983 fueron needs_human con confidence 0.0000 y motivo
  "nli: provider rate limited". NO son drift: son el canal NLI caido por
  cuota. La 979 ya lo decia y no se conto como rechazo ni como aprobacion.

LO QUE ENTREGA
  Diez documentos: el razonamiento (mindsets), el criterio y sus limites, seis
  mindsets (espejo, empresa, archivo, veredicto, precio, no-pedi), la
  reconciliacion contra las 8 reglas y los 12 bordes de la spec, y la lista de
  cambios con las tres decisiones del operador.

HALLAZGOS QUE CAMBIAN DISENO
  1. Anonimato y antifraude son el MISMO dato en direcciones opuestas: para
     localizar a la persona hay que unirla, y para que el anonimo sea anonimo
     hay que no hacerlo.
  2. La seccion 4 de la spec dice "nunca cruza identidades" y el nombre publico
     del dueno es un cruce deliberato y ya decidido. Una spec que dice nunca
     mientras el producto cruza enseña al implementador que la spec miente.
  3. El flag antifraude no impugnable es conflicto real con el art. 8, y los
     sistemas los hacen inrectificables porque asi funcionan.
  4. El antifraude tiene que vivir DENTRO del mod, o el derecho de supresion es
     decorativo.
  5. La seccion 7 registra entradas, no salidas. fields_injected es medio
     registro: falta lo que salio por el canal legitimo de una tool.
  6. La rectificacion tiene que alcanzar las inferencias derivadas. Hoy el mod
     guarda la conclusion sin guardar de que salio, asi que no se puede
     invalidar.
  7. Los 12 bordes y los 8 tests de la spec SOBREVIVEN como pruebas de runtime.
     Se anaden T9 a T15, uno por mindset.

LO QUE SIGUE ABIERTO, Y SIGUE SIENDO DEL OPERADOR
  1. SI EL EJE POR CREENCIA ES EL CORRECTO. Se le pregunto dos veces y no ha
     respondido. Es defendible y esta razonado, pero es MI eleccion entre
     varias posibles, y cambiar el eje cambia los seis documentos.
  2. Cual se degrada: anonimato o antifraude.
  3. El sexto consentimiento para tratamiento en contexto de organizacion, y el
     techo de falsos positivos. Numeros y politicas: no se inventan.
  4. La spec boundary-memory-v1.md (10077 B) sigue sin partirse. Los diez
     documentos de L3 son juzgables; la spec madre no lo es.`;

const steps = [
  { name: 'dark_memory_session_start', arguments: { operator: 'INV-1', project_id: 'opita-code', constitution_id: 'dark-agents/dark-mem', constitution_ver: '1.0.0' } },
  { name: 'dark_memory_agent_memory_save', arguments: { session_id: '__SESSION__', operator: 'INV-1', kind: 'decision', title: 'RUTA CORRECTA PARA HACER JUDGE: dos canales, modelo de reasoning, y el cliente se cachea', tags: 'judge,nli,drift_judge,llm_key_add,llm_provider_bind,ruta,operational', pinned: true, content: RUTA } },
  { name: 'dark_memory_agent_memory_save', arguments: { session_id: '__SESSION__', operator: 'INV-1', kind: 'observation', title: 'L3 VALIDADO: los 10 documentos de mindset, aligned con entailment (evaluations 986-995)', tags: 'vibe-tools,l3,mindsets,cerrado,spec-538,validado,judge', pinned: true, content: L3 } },
];

writeFileSync('tools/l3-persist-steps.json', JSON.stringify(steps, null, 1));
console.log('steps:', steps.length);
