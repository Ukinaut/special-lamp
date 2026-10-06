import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('real API protects the panel, stores contact requests, persists settings and observes global pause', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-06T10:00:00-03:00').getTime() });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aitue-api-'));
  Object.assign(process.env, { BOT_TEST_MODE: 'true', BOT_DATA_DIR: directory, ADMIN_PASSWORD: 'test-only-password', SESSION_SECRET: 'test-session-secret', OPENAI_API_KEY: '', WHISPER_API_KEY: '', GROQ_API_KEY: '' });
  const { app, shutdown, testHooks } = await import('../wp-server.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  async function request(url, body, extraCookie) {
    const res = await fetch(base + url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', Cookie: extraCookie ?? cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { res, data: await res.json() };
  }
  try {
    assert.equal((await request('/api/customers')).res.status, 401);
    assert.equal((await request('/api/auth/login', { email: 'admin@aitue.net', password: 'wrong' })).res.status, 401);
    const login = await request('/api/auth/login', { email: 'admin@aitue.net', password: 'test-only-password' });
    assert.equal(login.res.status, 200);
    cookie = login.res.headers.get('set-cookie').split(';')[0];
    assert.equal((await request('/api/customers')).res.status, 200);
    assert.equal((await request('/api/config/settings', { model: 'test-model', temperature: 0, maxTokens: 200 })).res.status, 200);
    const stored = JSON.parse(fs.readFileSync(path.join(directory, 'runtime-config.json'), 'utf8'));
    assert.equal(stored.model, 'test-model'); assert.equal(stored.temperature, 0);
    const settings = await request('/api/config/knowledge');
    assert.equal(settings.data.model, 'test-model'); assert.equal(settings.data.apiKey, undefined);
    assert.equal((await request('/api/contact', { name: 'Cliente de prueba', email: 'test@example.com', phone: '+5491100000001', company: 'Prueba', message: '<b>Consulta</b>' })).res.status, 201);
    const customers = await request('/api/customers');
    assert.ok(customers.data.some(c => c.email === 'test@example.com' && c.notes === '<b>Consulta</b>'));
    assert.equal((await request('/api/appointments/config', { durationMin: 0 })).res.status, 400);
    const session = await request('/api/web-assistant/session', {});
    const webCookie = session.res.headers.get('set-cookie').split(';')[0];
    const sessionId = session.data.sessionId;
    assert.equal((await request('/api/chat', { message: 'hola', sessionId }, '')).res.status, 403);
    await request('/api/whatsapp/pause', { paused: true });
    const chat = await request('/api/chat', { message: 'hola', sessionId }, webCookie);
    assert.match(chat.data.reply, /pausada/);
    const poll = await request(`/api/web-assistant/poll/${sessionId}`, undefined, webCookie);
    assert.equal(poll.data.messages.filter(m => m.sender === 'bot').length, 1);
    const sent = [];
    testHooks.setSocket({ async sendMessage(to, data) { sent.push({ to, data }); }, async sendPresenceUpdate() {}, async chatModify() {} });
    const message = (n, id) => ({ key: { remoteJid: `54911000000${n}@s.whatsapp.net`, fromMe: false, id }, message: { conversation: 'hola' }, pushName: 'Prueba' });
    await testHooks.handleBaileysBatch({ type: 'notify', messages: [message('11', 'one'), message('12', 'two')] });
    assert.equal(sent.length, 0);
    assert.ok(testHooks.activeChats['5491100000011@s.whatsapp.net']);
    assert.ok(testHooks.activeChats['5491100000012@s.whatsapp.net']);
    await testHooks.handleBaileysBatch({ type: 'notify', messages: [message('11', 'one')] });
    assert.equal(testHooks.activeChats['5491100000011@s.whatsapp.net'].messages.length, 1);
    testHooks.setPaused(false);
    await testHooks.handleBaileysBatch({ type: 'notify', messages: [message('21', 'three'), message('22', 'four')] });
    assert.ok(sent.some(item => item.to === '5491100000021@s.whatsapp.net'));
    assert.ok(sent.some(item => item.to === '5491100000022@s.whatsapp.net'));
    const human = await request('/api/chat', { message: 'quiero un humano', sessionId }, webCookie);
    assert.match(human.data.reply, /equipo/);
    const humanPoll = await request(`/api/web-assistant/poll/${sessionId}`, undefined, webCookie);
    assert.equal(humanPoll.data.messages.filter(item => item.text === 'quiero un humano').length, 1);
    assert.ok(humanPoll.data.messages.some(item => item.sender === 'bot' && item.text === human.data.reply));
    const booking = { chatId: '5491100000021@s.whatsapp.net', dateTime: '2026-10-07T10:00' };
    assert.equal((await request('/api/appointments', booking)).res.status, 200);
    assert.equal((await request('/api/appointments', booking)).res.status, 409);
    testHooks.setSocket(null);
    await request('/api/appointments/config', { minAdvanceHours: 0 });
    assert.equal((await request('/api/appointments', { chatId: '5491100000021@s.whatsapp.net', dateTime: '2026-10-06T11:00' })).res.status, 200);
    await testHooks.runReminders();
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'appointments.json'))).at(-1).reminderSent, false);
    testHooks.setSocket({ async sendMessage(to, data) { sent.push({ to, data }); } });
    const beforeReminder = sent.length;
    await testHooks.runReminders();
    assert.equal(sent.length, beforeReminder + 1);
    const actualFetch = globalThis.fetch;
    const providerCalls = [];
    t.mock.method(globalThis, 'fetch', (url, options) => {
      if (/^https:\/\/(api\.openai\.com|integrate\.api\.nvidia\.com)\//.test(String(url))) {
        const body = JSON.parse(options.body);
        providerCalls.push(body);
        if (String(url).includes('api.openai.com') && (body.max_tokens !== undefined || (body.model === 'gpt-5.6-luna' && body.temperature !== undefined))) {
          return Promise.resolve(Response.json({ error: { message: 'Incompatible completion parameters' } }, { status: 400 }));
        }
        return Promise.resolve(Response.json({ choices: [{ message: { content: 'OK' } }] }));
      }
      return actualFetch(url, options);
    });
    assert.equal((await request('/api/config/test', { apiKey: 'sk-test-only', model: 'gpt-5.6-luna' })).res.status, 200);
    assert.equal(providerCalls.at(-1).reasoning_effort, 'none');
    assert.equal(providerCalls.at(-1).max_completion_tokens, 15);
    assert.equal((await request('/api/config/test', { apiKey: 'nvapi-test-only', model: 'openai/gpt-oss-120b' })).res.status, 200);
    assert.equal(providerCalls.at(-1).max_tokens, 15);
    assert.equal(providerCalls.at(-1).reasoning_effort, undefined);
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'appointments.json'))).at(-1).reminderSent, true);
    await testHooks.runReminders();
    assert.equal(sent.length, beforeReminder + 1);
  } finally {
    testHooks.setSocket(null);
    await shutdown();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
