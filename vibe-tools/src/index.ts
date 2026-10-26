export * from './axes.js';
export * from './hash.js';
export * from './canonical.js';
export * from './contract.js';
export * from './context.js';
export * from './tool.js';
export * from './rules/types.js';
export { validate } from './graph.js';
export type { CompiledModule, Validation } from './graph.js';
export { ruleNames, ruleNoDuplicates, ruleTierAllowsEffect } from './rules/identity.js';
export { ruleEdges } from './rules/edges.js';
export {
  ruleSinksExist,
  ruleSinksAreTerminal,
  ruleTerminalsDeclared,
  ruleDeliversArtifact,
} from './rules/terminals.js';
export { ruleOrderable } from './rules/order.js';

// L2 · modulos
export { runModule } from './module/run.js';
export type { RunModuleOptions } from './module/run.js';
export { bindInputs, feederIndex } from './module/bind.js';
export type { BindResult, BindSources } from './module/bind.js';
export { nodeRun, type ModuleErrorCode, type ModuleFailure, type ModuleOutcome, type NodeRun } from './module/outcome.js';
export { deliveriesOf, unemittedPorts } from './module/deliver.js';
export { sharePolicy, shareKey, cachedOutputs, ValueStore } from './module/share.js';
export type { SharePolicy } from './module/share.js';
export { ask, deliveriesFor } from './module/harness.js';
export type { HarnessAnswer, HarnessResult, HarnessOptions } from './module/harness.js';
export { BASE_TOOLS, baseRegistry } from './tools/index.js';
export { CANONICO_COMPLETO, ENTRADA_COMPLETO } from './canonical/completo.js';
export { CANONICO_RECETA, ENTRADA_RECETA } from './canonical/receta.js';
export { CANONICO_INVESTIGACION, ENTRADA_INVESTIGACION } from './canonical/investigacion.js';

// L1 · sandbox
export {
  CAPABILITIES,
  CAPABILITY_SET,
  isCapability,
  requiresFor,
  grantsFor,
  missingFor,
  effectAllowed,
} from './sandbox/capability.js';
export type { Capability } from './sandbox/capability.js';
export { createPort, sealedPort } from './sandbox/effects/create.js';
export type { EffectPort, EffectResult, EffectAttempt, EffectBackend, DenialKind } from './sandbox/effects/port.js';
export { requiresFor as hostRequires, supports, has, highest, HOSTS } from './sandbox/tier.js';
export type { HostEnvironment, HostFeature, TierSupport, HostName } from './sandbox/tier.js';
export { scanWasm, allowKey, capabilityOfImport, kindName, T0_ALLOWED } from './sandbox/wasm/scan.js';
export type { WasmVerdict, WasmImport, WasmViolation, WasmViolationCode } from './sandbox/wasm/scan.js';
export { runInSandbox, deniedCount } from './sandbox/runner.js';
export { parseImports, IMPORT_KINDS } from './sandbox/wasm/imports.js';
export { readStructure, hasImportSection } from './sandbox/wasm/structure.js';
export type { Structure, StructureCode, Section } from './sandbox/wasm/structure.js';
export { varUint, readName, skipLimits, sectionName, byteAt, allowKey as wasmAllowKey } from './sandbox/wasm/binary.js';
export type { SandboxOutcome, SandboxErrorCode, Binding, RunRequest } from './sandbox/runner.js';

// L4 · identidad: las tres, sus fabricas, el alcance del antifraude y la puerta
export { PREFIJOS, CAMPOS_POR_TIPO, namespaceDe } from './identity.js';
export type {
  Identity,
  IdentityKind,
  IdentidadLegal,
  IdentidadEmpresa,
  IdentidadAnonimo,
} from './identity.js';
export {
  identidadAnonima,
  identidadEmpresa,
  identidadLegal,
  identidadLegalDocumental,
  identidadLegalVerificada,
  mismaIdentidad,
  copiarIdentidad,
} from './identity/operaciones.js';
export { ALCANCE_ANTIFRAUDE, alcanceAntifraude, LOCALIZADORES } from './identity/antifraude.js';
export {
  SENALES_DOCUMENTALES,
  senalesQueExige,
  congelarEvidencia,
} from './identity/kyc.js';
export type { KycEstado, SenalKyc, EvidenciaKyc, VerificacionKyc } from './identity/kyc.js';
export { validarKyc } from './identity/kyc-puerta.js';
export type { MotivoKyc } from './identity/kyc-puerta.js';
export { validarIdentidad, afirmarIdentidad, IdentidadInvalidaError } from './identity/validacion.js';
export type { MotivoIdentidad } from './identity/validacion.js';
