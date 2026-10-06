import path from 'node:path';
import { createHash } from 'node:crypto';

export const LIMIT_FIELDS = {
  recentMessages: { label: 'Mensajes recientes', min: 2, max: 20, value: 8 },
  historyCharacters: { label: 'Caracteres del historial', min: 500, max: 12000, value: 4000 },
  memoryDays: { label: 'Vencimiento de memoria (días)', min: 1, max: 180, value: 30 },
  maxClients: { label: 'Clientes con memoria', min: 100, max: 5000, value: 1000 },
  summaryCharacters: { label: 'Caracteres del resumen', min: 100, max: 2000, value: 800 },
  ragFragments: { label: 'Fragmentos de conocimiento', min: 1, max: 8, value: 4 },
  ragCharacters: { label: 'Caracteres de conocimiento', min: 1400, max: 12000, value: 6000 },
  inputBytes: { label: 'Tamaño máximo de consulta (bytes)', min: 8192, max: 65536, value: 32768 },
  outputTokens: { label: 'Máximo de salida de IA (tokens)', min: 100, max: 1200, value: 600 },
  answerWords: { label: 'Palabras por respuesta de IA', min: 30, max: 250, value: 120 },
  timeoutMs: { label: 'Espera máxima de IA (milisegundos)', min: 2000, max: 20000, value: 8000 },
  perClientDaily: { label: 'Solicitudes de IA por cliente al día', min: 0, max: 1000, value: 60 },
  globalDaily: { label: 'Solicitudes de IA totales al día', min: 0, max: 10000, value: 1000 }
};
export const DEFAULT_LIMITS = Object.freeze(Object.fromEntries(Object.entries(LIMIT_FIELDS).map(([key, field]) => [key, field.value])));
export const DEFAULT_ASSISTANT_SETTINGS = Object.freeze({
  limits: DEFAULT_LIMITS, memoryEnabled: true,
  style: { mode: 'natural', tone: 'cercano', instructions: 'Respondé en español, con frases breves y un tono amable. Usá el contexto del cliente sin repetir preguntas ya respondidas. Evitá sonar como un menú o repetir saludos. No agregues datos que no estén respaldados.' }
});
const object = value => value && typeof value === 'object' && !Array.isArray(value);
export const revisionOf = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function validateSettings(patch, previous = DEFAULT_ASSISTANT_SETTINGS) {
  if (!object(patch) || Object.keys(patch).some(k => !['limits', 'style', 'memoryEnabled'].includes(k))) throw new Error('Configuración de memoria y RAG inválida.');
  const result = structuredClone(previous);
  if (patch.limits !== undefined) {
    if (!object(patch.limits)) throw new Error('Límites inválidos.');
    for (const [key, value] of Object.entries(patch.limits)) {
      const field = LIMIT_FIELDS[key];
      if (!field || !Number.isInteger(value) || value < field.min || value > field.max) throw new Error(`Valor fuera de rango: ${field?.label || key}.`);
      result.limits[key] = value;
    }
  }
  if (patch.style !== undefined) {
    if (!object(patch.style) || Object.keys(patch.style).some(k => !['mode', 'tone', 'instructions'].includes(k))) throw new Error('Estilo inválido.');
    Object.assign(result.style, patch.style);
    if (!['literal', 'natural'].includes(result.style.mode) || !['cercano', 'neutral', 'formal'].includes(result.style.tone) || typeof result.style.instructions !== 'string' || result.style.instructions.length > 2000) throw new Error('Estilo o pautas de conversación inválidos.');
  }
  if (patch.memoryEnabled !== undefined) {
    if (typeof patch.memoryEnabled !== 'boolean') throw new Error('Estado de memoria inválido.');
    result.memoryEnabled = patch.memoryEnabled;
  }
  return result;
}

export class AssistantSettings {
  constructor(store, directory) {
    this.store = store; this.file = path.join(directory, 'assistant-settings.json');
    this.value = validateSettings(store.read(this.file, {}));
  }
  get() { return structuredClone(this.value); }
  revision() { return revisionOf(this.value); }
  update(patch, revision) {
    if (revision !== this.revision()) { const err = new Error('La configuración cambió. Actualizá el panel antes de guardar.'); err.status = 409; throw err; }
    const value = validateSettings(patch, this.value);
    this.store.write(this.file, value); this.value = value;
    return this.get();
  }
}
