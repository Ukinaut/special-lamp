import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { JsonStore } from '../json-store.js';
import { CustomerMemory, declaredFacts } from '../customer-memory.js';
import { RagRetriever } from '../rag-retriever.js';
import { GroundedAssistant, validateGroundedAnswer, ASSISTANT_LIMITS } from '../grounded-assistant.js';

function temporary(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aitue-rag-'));
  t.after(() => {
    const resolved = path.resolve(directory);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('aitue-rag-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return directory;
}
const article = { id: 'doc', title: 'Revestimiento hidrofóbico', content: 'El revestimiento hidrofóbico se limpia con un paño seco.', approved: true };
const answer = source => ({ introduccion: 'ninguna', fragmentos: [{ fuente_id: source.id, texto: source.text }], pregunta: 'ninguna', memorias_propuestas: [] });
const request = { chatId: 'alice', userText: 'revestimiento hidrofóbico', systemPrompt: 'Conservar el tono de AITUE.', route: { action: 'ASK_CLARIFICATION' }, fallback: 'RESPUESTA OFICIAL EXISTENTE', apiKey: 'sk-test-only', model: 'gpt-5.6-luna', maxTokens: 500 };
function fixture(t, options = {}) {
  const memory = new CustomerMemory(new JsonStore(), temporary(t), options.memoryOptions);
  const documents = [structuredClone(article)];
  const retriever = new RagRetriever(() => documents);
  const audits = [];
  const assistant = new GroundedAssistant({ memory, retriever, onAudit: (id, value) => audits.push(value), ...options });
  return { memory, documents, retriever, assistant, audits };
}

test('memory stores explicit statements with provenance, remains isolated, survives restart and expires', t => {
  const directory = temporary(t);
  let now = Date.parse('2026-10-06T13:00:00Z');
  const memory = new CustomerMemory(new JsonStore(), directory, { now: () => now });
  const text = 'Tengo un Starlink Mini y estoy viendo el AITUE Pro para mi camioneta.';
  memory.observe('alice', text, 'incoming-one', [{ role: 'user', text }]);
  assert.equal(memory.context('alice').datos_declarados.equipo.valor, 'Starlink Mini');
  assert.equal(memory.context('alice').datos_declarados.producto_interes.sourceId, 'incoming-one');
  assert.equal(memory.context('bob').datos_declarados.equipo, undefined);
  assert.deepEqual(declaredFacts('No tengo un Starlink Mini. No me interesa el Pro. Precio $5000. sk-secret-no-copy'), []);
  assert.deepEqual(declaredFacts('Solo el equipo, pero necesito instalación.'), []);
  assert.deepEqual(declaredFacts('Tengo un Starlink Mini y tengo un Starlink Standard.'), []);
  assert.equal(memory.acceptProposals('alice', [{ campo: 'equipo', valor: 'Router inexistente', evidencia: 'tengo un router' }], text, 'bad'), 0);
  memory.flush();
  const restored = new CustomerMemory(new JsonStore(), directory, { now: () => now });
  assert.equal(restored.context('alice').datos_declarados.uso.valor, 'camioneta');
  restored.observe('alice', 'Ya no tengo un Starlink Mini. Ya no me interesa el Pro. No necesito instalación.', 'correction');
  assert.equal(restored.context('alice').datos_declarados.equipo, undefined);
  assert.equal(restored.context('alice').datos_declarados.producto_interes, undefined);
  assert.equal(restored.context('alice').datos_declarados.requiere_instalacion.valor, 'no');
  now += 31 * 86400000;
  assert.deepEqual(restored.context('alice').datos_declarados, {});
});

test('daily AI quotas persist across restart and bound clients without changing the RAG', t => {
  const directory = temporary(t);
  let now = Date.parse('2026-10-06T13:00:00Z');
  const opts = { now: () => now, perClientDaily: 1, globalDaily: 2, maxClients: 2 };
  const memory = new CustomerMemory(new JsonStore(), directory, opts);
  assert.equal(memory.consume('alice'), true); assert.equal(memory.consume('alice'), false);
  memory.flush();
  const restored = new CustomerMemory(new JsonStore(), directory, opts);
  assert.equal(restored.consume('alice'), false);
  assert.equal(restored.consume('bob'), true); assert.equal(restored.consume('third'), false);
  assert.ok(restored.clients.size <= 2);
  now += 86400000;
  assert.equal(restored.consume('third'), true);
});

test('retrieval filters permissions and validity, resolves references and observes size limits', () => {
  const docs = [
    { id: 'pro', title: 'AITUE Pro', content: 'AITUE Pro para uso en camionetas.', approved: true },
    { id: 'draft', title: 'AITUE Pro', content: 'No debe aparecer.', approved: false },
    { id: 'private', title: 'AITUE Pro', content: 'Dato privado de otro cliente.', clientId: 'bob' },
    { id: 'expired', title: 'AITUE Pro', content: 'Dato vencido.', validUntil: '2020-01-01' }
  ];
  const original = JSON.stringify(docs);
  const retriever = new RagRetriever(() => docs, { maxFragments: 1, maxCharacters: 200 });
  const result = retriever.retrieve('ese modelo', { clientId: 'alice', memory: { datos_declarados: { producto_interes: { valor: 'AITUE Pro' } } } });
  assert.equal(result.fragments.length, 1); assert.equal(result.fragments[0].articleId, 'pro');
  assert.equal(retriever.retrieve('astronomía culinaria', { clientId: 'alice' }).fragments.length, 0);
  assert.equal(JSON.stringify(docs), original);
});

test('response validation rejects invented facts, prices, contacts, actions and schema escapes', () => {
  const source = { id: 'one', text: 'El equipo usa alimentación de 12V. Precio $5000. Contacto +54 9 11 1234-5678.' };
  const base = { introduccion: 'ninguna', fragmentos: [{ fuente_id: 'one', texto: 'El equipo usa alimentación de 12V.' }], pregunta: 'ninguna', memorias_propuestas: [] };
  assert.equal(validateGroundedAnswer(base, [source]).reply, base.fragmentos[0].texto);
  for (const text of ['El equipo soporta 5G.', 'Precio $5000.', 'Contacto +54 9 11 1234-5678.']) {
    assert.throws(() => validateGroundedAnswer({ ...base, fragmentos: [{ fuente_id: 'one', texto: text }] }, [source]));
  }
  assert.throws(() => validateGroundedAnswer({ ...base, accion_propuesta: 'reservar' }, [source]));
  assert.throws(() => validateGroundedAnswer({ ...base, fragmentos: [{ fuente_id: 'otro', texto: base.fragmentos[0].texto }] }, [source]));
  assert.throws(() => validateGroundedAnswer(answer({ id: 'email', text: 'Escribí a s@aitue.net para consultar.' }), [{ id: 'email', text: 'Escribí a s@aitue.net para consultar.' }], { allowedContacts: 'clientes@aitue.net' }));
  const actionSource = { id: 'action', text: 'Cita confirmada [AGENDA_CITA: 2026-10-07T10:00]' };
  assert.throws(() => validateGroundedAnswer(answer(actionSource), [actionSource]));
});

test('OpenAI receives bounded context with rules separated from data and grounded output is composed by the server', async t => {
  let captured;
  const f = fixture(t, { fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses'); captured = JSON.parse(options.body);
    const context = JSON.parse(captured.input[0].content);
    return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(answer(context.fuentes_rag[0])) }] }] });
  } });
  f.memory.observe('bob', 'Tengo un Starlink Mini', 'private');
  const history = Array.from({ length: 30 }, (_, i) => ({ sender: i % 2 ? 'bot' : 'user', text: 'historial '.repeat(200) }));
  const reply = await f.assistant.answer({ ...request, history });
  assert.equal(reply, article.content);
  const context = JSON.parse(captured.input[0].content);
  assert.ok(context.historial.length <= 8);
  assert.ok(context.historial.reduce((n, item) => n + item.texto.length, 0) <= 4000);
  assert.equal(context.memoria_cliente.datos_declarados.equipo, undefined);
  assert.equal(captured.store, false); assert.equal(captured.text.format.strict, true);
  assert.equal(captured.reasoning.effort, 'none');
  assert.ok(Buffer.byteLength(JSON.stringify(captured)) <= ASSISTANT_LIMITS.inputBytes);
  assert.equal(f.audits.at(-1).status, 'grounded');
});

test('invalid output, refusal, timeout, insufficient sources and quotas preserve the official fallback', async t => {
  const f = fixture(t, { memoryOptions: { perClientDaily: 2 }, fetchImpl: async () => Response.json({ status: 'completed', output_text: '{"respuesta":"texto inventado"}' }) });
  assert.equal(await f.assistant.answer(request), request.fallback);
  f.assistant.fetchImpl = async () => { throw new Error('Timeout'); };
  assert.equal(await f.assistant.answer(request), request.fallback);
  f.assistant.fetchImpl = () => { throw new Error('Quota should prevent the request'); };
  assert.equal(await f.assistant.answer(request), request.fallback);
  assert.equal(f.audits.at(-1).status, 'fallback_quota');
  assert.equal(await f.assistant.answer({ ...request, userText: 'astronomía culinaria' }), request.fallback);
  assert.equal(f.audits.at(-1).status, 'fallback_no_sources');
});

test('pauses and changes to retrieved sources during an AI request prevent delivery of stale content', async t => {
  let enabled = true;
  const f = fixture(t, { canRespond: () => enabled });
  f.assistant.fetchImpl = async () => {
    const source = f.retriever.retrieve(request.userText).fragments[0];
    enabled = false;
    return Response.json({ status: 'completed', output_text: JSON.stringify(answer(source)) });
  };
  assert.equal(await f.assistant.answer(request), null);
  enabled = true;
  f.assistant.fetchImpl = async () => {
    const source = f.retriever.retrieve(request.userText).fragments[0];
    f.documents[0].content = 'Información actualizada y distinta.';
    return Response.json({ status: 'completed', output_text: JSON.stringify(answer(source)) });
  };
  assert.equal(await f.assistant.answer(request), request.fallback);
  assert.equal(f.audits.at(-1).status, 'fallback_sources_changed');
});

test('oversized instructions never erase stored rules and never make an unbounded provider request', async t => {
  let calls = 0;
  const f = fixture(t, { fetchImpl: async () => { calls++; throw new Error('Unexpected request'); } });
  const prompt = 'regla importante '.repeat(4000);
  assert.equal(await f.assistant.answer({ ...request, systemPrompt: prompt }), request.fallback);
  assert.equal(calls, 0); assert.equal(f.audits.at(-1).status, 'fallback_context_limit');
});
