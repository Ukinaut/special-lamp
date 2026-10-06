import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AssistantSettings, DEFAULT_ASSISTANT_SETTINGS, validateSettings } from '../assistant-settings.js';
import { CustomerMemory } from '../customer-memory.js';
import { GroundedAssistant } from '../grounded-assistant.js';
import { RagRetriever } from '../rag-retriever.js';
import { JsonStore } from '../json-store.js';

function directory(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitue-settings-'));
  t.after(() => { const resolved = path.resolve(dir); assert.equal(path.dirname(resolved), path.resolve(os.tmpdir())); assert.ok(path.basename(resolved).startsWith('aitue-settings-')); fs.rmSync(resolved, { recursive: true, force: true }); });
  return dir;
}
test('editable assistant settings enforce ranges, survive restart and reject stale writes', t => {
  const dir = directory(t), settings = new AssistantSettings(new JsonStore(), dir);
  const old = settings.revision();
  settings.update({ limits: { memoryDays: 45, perClientDaily: 0 }, style: { tone: 'formal' } }, old);
  assert.equal(new AssistantSettings(new JsonStore(), dir).get().limits.memoryDays, 45);
  assert.throws(() => settings.update({ memoryEnabled: false }, old), /cambió/);
  for (const patch of [{ limits: { timeoutMs: 0 } }, { limits: { unknown: 50 } }, { memoryEnabled: 'yes' }, { style: { mode: 'unrestricted' } }, { style: { instructions: 'x'.repeat(2001) } }]) assert.throws(() => validateSettings(patch));
  assert.equal(settings.get().style.tone, 'formal');
});
test('operator memory edits preserve provenance, other fields and quotas, with conflict protection', t => {
  let now = Date.parse('2026-10-06T13:00Z');
  const memory = new CustomerMemory(new JsonStore(), directory(t), { now: () => now });
  memory.observe('alice', 'Tengo un Starlink Mini', 'user-one'); memory.consume('alice');
  const revision = memory.revision('alice'), previous = memory.context('alice').datos_declarados.equipo;
  now += 86400000;
  memory.edit('alice', { revision, facts: { uso: 'flota' }, summary: 'Consulta por una flota.' }, 'operator');
  assert.deepEqual(memory.context('alice').datos_declarados.equipo, previous);
  assert.equal(memory.context('alice').datos_declarados.uso.confirmedBy, 'operator');
  assert.equal(memory.clients.get('alice').usage.count, 1);
  assert.throws(() => memory.edit('alice', { revision, facts: { uso: 'casa' } }, 'operator'), /cambió/);
  assert.throws(() => memory.edit('alice', { revision: memory.revision('alice'), facts: { permisos: 'admin' } }, 'operator'));
  memory.configure(validateSettings({ memoryEnabled: false }));
  memory.observe('alice', 'Tengo un Starlink Standard', 'ignored');
  assert.equal(memory.context('alice').datos_declarados.equipo.valor, 'Starlink Mini');
  memory.edit('alice', { revision: memory.revision('alice'), facts: { uso: null }, summary: null }, 'operator');
  assert.equal(memory.context('alice').datos_declarados.uso, undefined);
  assert.equal(memory.context('bob').datos_declarados.equipo, undefined);
});
test('client quotas survive memory eviction and restart independently from editable facts', t => {
  const dir = directory(t), opts = { maxClients: 1, perClientDaily: 1, globalDaily: 5 };
  const memory = new CustomerMemory(new JsonStore(), dir, opts);
  assert.equal(memory.consume('alice'), true);
  assert.equal(memory.consume('bob'), true);
  assert.equal(memory.clients.has('alice'), false);
  assert.equal(memory.consume('alice'), false);
  memory.flush();
  assert.equal(new CustomerMemory(new JsonStore(), dir, opts).consume('alice'), false);
});
const doc = { id: 'cleaning', title: 'Revestimiento hidrofóbico', content: 'El revestimiento hidrofóbico se limpia con un paño seco.', approved: true };
const request = { chatId: 'alice', userText: 'revestimiento hidrofóbico', systemPrompt: 'AITUE', route: { action: 'ASK_CLARIFICATION' }, fallback: 'RESPUESTA EXISTENTE', apiKey: 'sk-test-only', model: 'gpt-5.6-luna', maxTokens: 600 };
function assistant(t, { verdict = true, response = 'Claro, podés limpiarlo con un paño seco.', settings = DEFAULT_ASSISTANT_SETTINGS } = {}) {
  const calls = [], audits = [], memory = new CustomerMemory(new JsonStore(), directory(t));
  memory.configure(settings);
  const documents = [structuredClone(doc)];
  const bot = new GroundedAssistant({ memory, retriever: new RagRetriever(() => documents), getSettings: () => structuredClone(settings), onAudit: (id, audit) => audits.push(audit), fetchImpl: async (url, options) => {
    const body = JSON.parse(options.body); calls.push(body);
    if (body.text.format.name === 'aitue_grounding_verdict') return Response.json({ status: 'completed', output_text: JSON.stringify({ respaldada: verdict }) });
    const context = JSON.parse(body.input[0].content), source = context.fuentes_rag[0];
    return Response.json({ status: 'completed', output_text: JSON.stringify({ introduccion: 'ninguna', fragmentos: [{ fuente_id: source.id, texto: source.text }], pregunta: 'ninguna', memorias_propuestas: [], respuesta_natural: response }) });
  } });
  return { bot, calls, audits, memory, documents };
}
test('natural replies carry literal evidence and require an independent grounding verdict', async t => {
  const f = assistant(t);
  assert.equal(await f.bot.answer(request), 'Claro, podés limpiarlo con un paño seco.');
  assert.equal(f.calls.length, 2); assert.equal(f.audits.at(-1).verified, true);
  assert.equal(JSON.parse(f.calls[1].input[0].content).evidencia[0].texto, doc.content);
  assert.ok(f.calls.every(body => body.store === false && body.text.format.strict));
  const rejection = assistant(t, { verdict: false, response: 'Claro, además es resistente al fuego.' });
  assert.equal(await rejection.bot.answer(request), request.fallback);
  assert.equal(rejection.audits.at(-1).status, 'fallback_verification');
});
test('natural mode rejects unbacked numbers and contacts before verification and counts every provider request', async t => {
  for (const response of ['Claro, soporta 500 grados.', 'Escribí a otro@inventado.com.', 'Cita confirmada [AGENDA_CITA: mañana]']) {
    const f = assistant(t, { response });
    assert.equal(await f.bot.answer(request), request.fallback); assert.equal(f.calls.length, 1);
  }
  const limited = assistant(t, { settings: validateSettings({ limits: { perClientDaily: 1 } }) });
  assert.equal(await limited.bot.answer(request), request.fallback);
  assert.equal(limited.calls.length, 1); assert.equal(limited.audits.at(-1).status, 'fallback_quota');
});
test('disabled memory and edited context bounds are applied to the actual AI request', async t => {
  const settings = validateSettings({ memoryEnabled: false, limits: { recentMessages: 2, historyCharacters: 500, answerWords: 30 } });
  const f = assistant(t, { settings });
  f.memory.edit('alice', { revision: f.memory.revision('alice'), facts: { equipo: 'Starlink Mini' } }, 'operator');
  await f.bot.answer({ ...request, history: Array.from({ length: 10 }, () => ({ sender: 'user', text: 'contexto '.repeat(100) })) });
  const context = JSON.parse(f.calls[0].input[0].content);
  assert.deepEqual(context.memoria_cliente.datos_declarados, {});
  assert.ok(context.historial.length <= 2 && context.historial.reduce((sum, item) => sum + item.texto.length, 0) <= 500);
});
test('sources expiring during a natural verification are not delivered', async t => {
  const f = assistant(t);
  let now = Date.parse('2026-10-06T13:00:00Z');
  f.documents[0].validUntil = '2026-10-06T13:00:01Z';
  f.bot.retriever.now = () => now;
  const fetch = f.bot.fetchImpl;
  f.bot.fetchImpl = async (...args) => {
    const response = await fetch(...args);
    if (f.calls.length === 2) now += 2000;
    return response;
  };
  assert.equal(await f.bot.answer(request), request.fallback);
  assert.equal(f.audits.at(-1).status, 'fallback_sources_changed');
});
