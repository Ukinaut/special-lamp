import { escapeHtml } from './services/safe-html.js';

const FIELDS = ['equipo', 'producto_interes', 'uso', 'requiere_instalacion'];
export function initMemoryRagPanel({ document: doc = document, fetchImpl = (...args) => fetch(...args), onRefresh = async () => {} } = {}) {
  const node = id => doc.getElementById(id);
  if (!node('memory-rag-controls')) return { load() {} };
  let config = null, memory = null, memoryId = '', clients = [], total = 0, listRequest = 0, loading = false;
  const status = text => { node('mr-status').textContent = text; };
  async function api(url, body) {
    const res = await fetchImpl(url, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(res.status === 404 ? 'Para cargar esta actualización, cerrá el programa y volvé a abrir Iniciar Bot.cmd. Después actualizá esta página.' : data.error || 'No se pudo completar la operación.');
    return data;
  }
  function showConfig(data) {
    config = data;
    const settings = data.settings;
    node('mr-mode').value = settings.style.mode;
    node('mr-tone').value = settings.style.tone;
    node('mr-instructions').value = settings.style.instructions;
    node('mr-memory-enabled').checked = settings.memoryEnabled;
    node('mr-summary').maxLength = settings.limits.summaryCharacters;
    node('mr-limit-fields').innerHTML = Object.entries(data.fields).map(([key, field]) => `<div><label class="admin-label" for="mr-limit-${key}">${escapeHtml(field.label)}</label><input type="number" class="admin-input" id="mr-limit-${key}" data-mr-limit="${key}" min="${field.min}" max="${field.max}" step="1" value="${settings.limits[key]}" required /></div>`).join('');
    node('mr-connection').textContent = `${data.connection.provider} · ${data.connection.model} · ${data.connection.configured ? 'Clave configurada' : 'Falta configurar la clave en OpenAI API'} · Límite general de salida: ${data.connection.panelMaxTokens} tokens. Guardar aquí no vuelve a vincular WhatsApp.`;
    node('mr-save-settings').disabled = false;
    node('mr-preview-submit').disabled = !data.connection.configured;
  }
  function showMemory(data, id) {
    memory = data; memoryId = id;
    for (const field of FIELDS) {
      const fact = data?.datos_declarados?.[field];
      node(`mr-${field}`).value = fact?.valor || '';
      node(`mr-${field}-origin`).textContent = fact ? `${fact.origin === 'operator' ? 'Operador' : 'Cliente'} · Vence ${new Date(fact.expiresAt).toLocaleDateString('es-AR')}` : '';
    }
    node('mr-summary').value = data?.resumen_declarado?.texto || '';
    node('mr-save-memory').disabled = !id || !data;
  }
  async function loadMemory() {
    const id = node('mr-client').value;
    showMemory(null, '');
    if (!id) return;
    try {
      const data = await api(`/api/chats/${encodeURIComponent(id)}/memory`);
      if (node('mr-client').value === id) showMemory(data, id);
    } catch (err) { status(err.message); }
  }
  async function loadClients(append = false) {
    const requestId = ++listRequest;
    const search = node('mr-client-search').value.trim();
    const data = await api(`/api/assistant/memories?search=${encodeURIComponent(search)}&offset=${append ? clients.length : 0}`);
    if (requestId !== listRequest) return;
    const selected = node('mr-client').value;
    clients = append ? [...clients, ...data.items] : data.items; total = data.total;
    node('mr-client').innerHTML = '<option value="">Seleccioná un cliente</option>' + clients.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} · ${escapeHtml(c.phone || c.id)} (${c.factsCount} datos)</option>`).join('');
    node('mr-client').value = clients.some(c => c.id === selected) ? selected : '';
    node('mr-client-count').textContent = `${clients.length} de ${total} conversaciones`;
    node('mr-more-clients').hidden = clients.length >= total;
    if (!node('mr-client').value) showMemory(null, '');
  }
  async function load() {
    if (loading) return;
    loading = true; status('Cargando memorias y configuración…');
    try {
      await onRefresh();
      const data = await api('/api/assistant/settings');
      showConfig(data); await loadClients(); await loadMemory(); status('Los cambios guardados se aplican a las consultas nuevas.');
    } catch (err) { status(err.message); }
    finally { loading = false; }
  }
  node('mr-refresh').addEventListener('click', load);
  node('mr-client').addEventListener('change', loadMemory);
  node('mr-search-clients').addEventListener('click', () => loadClients().catch(err => status(err.message)));
  node('mr-client-search').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); loadClients().catch(err => status(err.message)); } });
  node('mr-more-clients').addEventListener('click', () => loadClients(true).catch(err => status(err.message)));
  node('mr-settings-form').addEventListener('submit', async event => {
    event.preventDefault(); if (!config) return;
    const button = node('mr-save-settings'); button.disabled = true;
    try {
      const limits = Object.fromEntries(Object.keys(config.fields).map(key => [key, Number(node(`mr-limit-${key}`).value)]));
      const settings = { limits, memoryEnabled: node('mr-memory-enabled').checked, style: { mode: node('mr-mode').value, tone: node('mr-tone').value, instructions: node('mr-instructions').value.trim() } };
      const data = await api('/api/assistant/settings', { revision: config.revision, settings });
      showConfig(data); status('Estilo, memoria y límites guardados. Ya se usan en las consultas nuevas.');
    } catch (err) { status(err.message); }
    finally { button.disabled = false; }
  });
  node('mr-memory-form').addEventListener('submit', async event => {
    event.preventDefault(); const id = node('mr-client').value;
    if (!memory || memoryId !== id) return;
    const button = node('mr-save-memory'); button.disabled = true;
    try {
      const facts = {};
      for (const field of FIELDS) {
        const value = node(`mr-${field}`).value.trim();
        if (value !== (memory.datos_declarados[field]?.valor || '')) facts[field] = value || null;
      }
      const body = { revision: memory.revision, facts };
      const summary = node('mr-summary').value.trim();
      if (summary !== (memory.resumen_declarado?.texto || '')) body.summary = summary || null;
      if (!Object.keys(facts).length && !Object.hasOwn(body, 'summary')) { status('La memoria no tiene cambios pendientes.'); return; }
      const data = await api(`/api/chats/${encodeURIComponent(id)}/memory`, body);
      if (node('mr-client').value === id) showMemory(data, id);
      status('Memoria guardada. Se usa como contexto del cliente en las consultas nuevas.');
    } catch (err) { status(err.message); }
    finally { button.disabled = !memory || memoryId !== node('mr-client').value; }
  });
  node('mr-preview-form').addEventListener('submit', async event => {
    event.preventDefault(); if (!config?.connection.configured) return;
    const message = node('mr-preview-message').value.trim(); if (!message) return;
    const button = node('mr-preview-submit'); button.disabled = true;
    node('mr-preview-reply').textContent = 'Preparando la respuesta…'; node('mr-preview-sources').textContent = '';
    try {
      const data = await api('/api/assistant/preview', { message, clientId: node('mr-client').value || undefined });
      node('mr-preview-reply').textContent = data.reply || 'No hay respuesta disponible.';
      node('mr-preview-sources').textContent = data.audit?.status === 'grounded'
        ? `Fuentes: ${[...new Set(data.audit.sourceTitles)].join(', ')}. ${data.audit.verified ? 'Reformulación revisada con IA.' : 'Texto respaldado por los extractos.'} Solicitudes utilizadas: ${data.audit.providerCalls}.`
        : 'Se utilizó la respuesta de respaldo. Revisá la conexión, la evidencia disponible y los límites.';
    } catch (err) { node('mr-preview-reply').textContent = err.message; }
    finally { button.disabled = !config?.connection.configured; }
  });
  return { load };
}
