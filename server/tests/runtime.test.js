import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { MessageQueue } from '../message-queue.js';
import { QrConnection } from '../qr-connection.js';
import { JsonStore } from '../json-store.js';
import { ChatStore } from '../chat-store.js';
import { localParts, validateAppointment, validateBookingConfig } from '../booking.js';
import { escapeHtml } from '../../src/services/safe-html.js';

test('messages remain ordered per chat and duplicate events run once', async () => {
  const queue = new MessageQueue({ concurrency: 2 });
  const order = [];
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const first = queue.run('a', 'one', async () => { order.push('a-start'); await gate; order.push('a-end'); });
  const duplicate = queue.run('a', 'one', () => order.push('duplicate'));
  const second = queue.run('a', 'two', () => order.push('a-second'));
  await queue.run('b', 'one', () => order.push('b'));
  release();
  await Promise.all([first, duplicate, second]);
  assert.deepEqual(order, ['a-start', 'b', 'a-end', 'a-second']);
  assert.equal(queue.pending, 0);
  assert.equal(queue.running, 0);
});
test('failed messages can retry and queue concurrency is bounded', async () => {
  const queue = new MessageQueue({ concurrency: 2 });
  await assert.rejects(queue.run('a', 'one', () => { throw new Error('offline'); }));
  let running = 0;
  let peak = 0;
  await Promise.all(Array.from({ length: 10 }, (_, i) => queue.run(String(i), 'one', async () => {
    peak = Math.max(peak, ++running);
    await new Promise(resolve => setTimeout(resolve, 2));
    running--;
  })));
  assert.equal(peak, 2);
});
test('QR connection has one socket and one reconnect timer; logout does not reconnect', async () => {
  const statuses = [];
  const sockets = [];
  const timers = [];
  const connection = new QrConnection({
    async createSocket() { const socket = { ev: new EventEmitter(), end() {}, async logout() {} }; sockets.push(socket); return { socket, saveCreds() {} }; },
    onStatus: status => statuses.push(status), onQr() {}, onMessages() {},
    setTimer: callback => { timers.push(callback); return timers.length; }, clearTimer() {}, onError: error => { throw error; }
  });
  await Promise.all([connection.start(), connection.start()]);
  assert.equal(sockets.length, 1);
  sockets[0].ev.emit('connection.update', { connection: 'open' });
  sockets[0].ev.emit('connection.update', { connection: 'close', lastDisconnect: { error: { output: { statusCode: 408 } } } });
  assert.equal(timers.length, 1);
  await timers[0]();
  await connection.pending;
  assert.equal(sockets.length, 2);
  await connection.disconnect({ logout: true });
  assert.equal(connection.enabled, false);
  assert.equal(statuses.at(-1), 'DISCONNECTED');
});
test('expired QR sessions require relinking and do not delete credentials automatically', async () => {
  const socket = { ev: new EventEmitter(), end() {} };
  const statuses = [];
  const connection = new QrConnection({ createSocket: async () => ({ socket, saveCreds() {} }), onStatus: s => statuses.push(s), onQr() {}, onMessages() {}, setTimer() { throw new Error('Unexpected retry'); } });
  await connection.start();
  socket.ev.emit('connection.update', { connection: 'close', lastDisconnect: { error: { output: { statusCode: 401 } } } });
  assert.equal(statuses.at(-1), 'RELINK_REQUIRED');
  assert.equal(connection.enabled, false);
});
test('chat histories and logs are bounded and survive a restart without changing source objects', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aitue-state-'));
  try {
    const store = new JsonStore();
    const state = new ChatStore(store, directory, { maxMessages: 2, maxLogs: 2 });
    state.chats.a = { id: 'a', messages: [] };
    state.chats.a.messages.push({ text: 'one' }, { text: 'two' }, { text: 'three' });
    state.logs.unshift('one'); state.logs.unshift('two'); state.logs.unshift('three');
    state.flush();
    const restored = new ChatStore(new JsonStore(), directory, { maxMessages: 2, maxLogs: 2 });
    assert.deepEqual(restored.chats.a.messages.map(m => m.text), ['two', 'three']);
    assert.deepEqual([...restored.logs], ['three', 'two']);
    const data = store.read(path.join(directory, 'live-chats.json'));
    data.a.id = 'mutated';
    assert.equal(store.read(path.join(directory, 'live-chats.json')).a.id, 'a');
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test('bookings use Argentina time and reject overlapping slots and invalid rules', () => {
  const config = { workDays: [1, 2, 3, 4, 5], openTime: '09:00', closeTime: '18:00', durationMin: 30, minAdvanceHours: 2, maxConcurrent: 1, blockedDates: [] };
  assert.equal(localParts(new Date('2026-10-07T01:00:00Z')).date, '2026-10-06');
  assert.throws(() => validateBookingConfig({ ...config, durationMin: 0 }));
  const now = new Date('2026-10-06T12:00:00Z');
  assert.equal(validateAppointment('2026-10-07T10:00', [], config, now).toISOString(), '2026-10-07T13:00:00.000Z');
  assert.throws(() => validateAppointment('2026-10-07T10:15', [{ dateTime: '2026-10-07T10:00' }], config, now), /reservado/);
  assert.throws(() => validateAppointment('2026-10-11T10:00', [], config, now));
});
test('user messages are displayed as text, including HTML and quote characters', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
