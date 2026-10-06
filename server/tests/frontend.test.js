import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { KnowledgeService } from '../../src/services/knowledge.js';
import { OpenAIService } from '../../src/services/openai.js';
import { escapeHtml } from '../../src/services/safe-html.js';

test('the real admin script loads the panel and QR without overwriting server configuration', async () => {
  const nodes = new Map();
  const events = new Map();
  const requests = [];
  function node(id) {
    return { id, value: '', style: {}, children: [], textContent: '', className: '',
      classList: { add() {}, remove() {}, contains() { return false; } },
      addEventListener() {}, querySelectorAll() { return []; }, appendChild(child) { this.children.push(child); },
      setAttribute() {}, getAttribute() { return ''; }, innerHTML: '' };
  }
  const document = { hidden: false,
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node(id)); return nodes.get(id); },
    createElement(tag) { return node(tag); }, querySelectorAll() { return []; },
    addEventListener(event, handler) { events.set(event, handler); }
  };
  const oldFetch = globalThis.fetch;
  const oldStorage = globalThis.localStorage;
  const fixture = {
    model: 'gpt-4o-mini', temperature: 0, maxTokens: 200, apiKeyConfigured: true,
    systemPrompt: 'AITUE COMUNICA S.A. test',
    articles: [{ id: 'one', title: '<b>Test</b>', category: 'General', content: 'Contenido', updatedAt: '2026-10-06' }]
  };
  const fakeFetch = async (url, options = {}) => {
    requests.push({ url, method: options.method || 'GET' });
    const data = {
      '/api/auth/session': { user: 'admin@aitue.net' }, '/api/config/knowledge': fixture,
      '/api/operators': [], '/api/whatsapp/status': { status: 'SCAN_QR', qrDataUrl: 'data:image/png;base64,AAAA' },
      '/api/operators/availability': { available: true }
    }[url];
    if (data === undefined) throw new Error('Unexpected startup request: ' + url);
    return { ok: true, json: async () => data };
  };
  globalThis.fetch = fakeFetch;
  globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  try {
    const source = fs.readFileSync(new URL('../../src/admin.js', import.meta.url), 'utf8').replace(/^import\s[^\n]+\r?\n/gm, '');
    const sandbox = { document, fetch: fakeFetch, OpenAIService, KnowledgeService, UsersService: {}, escapeHtml,
      localStorage: globalThis.localStorage, sessionStorage: globalThis.localStorage,
      setInterval() { return 1; }, setTimeout() { return 1; }, console,
      window: { location: {}, scrollTo() {} }, alert() {}, confirm() { return false; } };
    vm.runInNewContext(source, sandbox);
    events.get('DOMContentLoaded')();
    for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve));
    assert.equal(nodes.get('admin-dashboard-view').style.display, 'grid');
    assert.equal(nodes.get('admin-login-view').style.display, 'none');
    assert.equal(nodes.get('cfg-model').value, fixture.model);
    assert.equal(nodes.get('wp-qr-img').src, 'data:image/png;base64,AAAA');
    assert.ok(nodes.get('kb-cards-container').children.length >= 1);
    assert.match(nodes.get('kb-cards-container').children[0].innerHTML, /&lt;b&gt;Test&lt;\/b&gt;/);
    assert.ok(requests.every(request => request.method === 'GET'));
    assert.equal(nodes.get('cfg-api-key').value, '');
  } finally { globalThis.fetch = oldFetch; globalThis.localStorage = oldStorage; }
});
