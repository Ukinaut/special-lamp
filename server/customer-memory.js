import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { revisionOf } from './assistant-settings.js';

export const MEMORY_FIELDS = ['equipo', 'producto_interes', 'uso', 'requiere_instalacion'];
const DAY = 86400000;
const clean = text => String(text || '').replace(/(?:sk-|nvapi-|gsk_)[\w-]+/gi, '[clave omitida]').replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[contacto]').replace(/\+?\d[\d\s()-]{8,}\d/g, '[contacto]').replace(/\s+/g, ' ').trim();

// Only explicit, low-impact statements can become durable facts. No prices or permissions.
export function declaredFacts(text) {
  text = String(text || '');
  const facts = [];
  const take = (field, pattern, value, allowNegation = false) => {
    for (const match of text.matchAll(new RegExp(pattern.source, `${pattern.flags}g`))) {
      if (!allowNegation && /\b(?:no|nunca)\s*$/i.test(text.slice(Math.max(0, match.index - 16), match.index))) continue;
      facts.push({ campo: field, valor: value(match), evidencia: match[0] });
    }
  };
  take('equipo', /\btengo\s+(?:(?:un|una|el|la)\s+)?(?:equipo\s+)?(Starlink\s+Mini(?:\s+X)?|Starlink\s+Standard)\b/i, m => m[1].replace(/\s+/g, ' '));
  take('producto_interes', /\b(?:me interesa|estoy viendo|busco|quiero(?: informaci[oó]n sobre| saber (?:de|sobre))?)\s+(?:(?:el|un)(?: modelo)?\s+)?(?:AITUE\s+)?(Standard|Pro|Ultra\+?)(?=\s|[.,?!]|$)/i, m => `AITUE ${m[1]}`);
  take('uso', /\b(?:en|para)\s+(?:mi|mis)\s+(camionetas?|camiones|cami[oó]n|autos?|veh[ií]culos?|casa|flota|barco)\b/i, m => m[1].toLowerCase());
  take('requiere_instalacion', /\b(?:necesito|quiero|busco)\s+(?:tambi[eé]n\s+)?(?:la\s+)?instalaci[oó]n\b/i, () => 'sí');
  take('requiere_instalacion', /\b(?:solo (?:el )?equipo|sin instalaci[oó]n)\b/i, () => 'no', true);
  take('requiere_instalacion', /\bno\s+(?:necesito|quiero|busco)\s+(?:la\s+)?instalaci[oó]n\b/i, () => 'no', true);
  return facts.filter(fact => new Set(facts.filter(item => item.campo === fact.campo).map(item => item.valor)).size === 1);
}

function retractFacts(record, text) {
  const patterns = [
    ['equipo', /\bno\s+tengo\s+(?:(?:un|una|el|la)\s+)?(?:equipo\s+)?(Starlink\s+Mini(?:\s+X)?|Starlink\s+Standard)\b/gi, m => m[1]],
    ['producto_interes', /\bno\s+me interesa\s+(?:(?:el|un)(?: modelo)?\s+)?(?:AITUE\s+)?(Standard|Pro|Ultra\+?)(?=\s|[.,?!]|$)/gi, m => `AITUE ${m[1]}`]
  ];
  for (const [field, pattern, value] of patterns) {
    for (const match of String(text || '').matchAll(pattern)) {
      if (record.facts[field]?.valor.toLowerCase() === value(match).replace(/\s+/g, ' ').toLowerCase()) delete record.facts[field];
    }
  }
}

export class CustomerMemory {
  constructor(store, directory, { now = Date.now, maxClients = 1000, ttlDays = 30, perClientDaily = 60, globalDaily = 1000, summaryCharacters = 800, enabled = true } = {}) {
    Object.assign(this, { store, now, maxClients, ttlDays, perClientDaily, globalDaily, summaryCharacters, enabled });
    this.file = path.join(directory, 'customer-memory.json');
    const saved = store.read(this.file, {});
    this.clients = new Map(Object.entries(saved.clients || {}));
    this.usage = saved.usage || { day: '', count: 0 };
    this.dirty = false;
    this.prune();
  }
  day() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(this.now())); }
  prune() {
    for (const [id, record] of this.clients) {
      if (!record || typeof record !== 'object' || !Number.isFinite(record.lastSeen)) { this.clients.delete(id); this.dirty = true; continue; }
      record.facts ||= {};
      for (const [field, fact] of Object.entries(record.facts)) if (!MEMORY_FIELDS.includes(field) || typeof fact?.valor !== 'string' || fact.valor.length > 120 || fact.expiresAt <= this.now() || !Number.isFinite(fact.expiresAt)) { delete record.facts[field]; this.dirty = true; }
      if (record.summary && (record.summary.expiresAt <= this.now() || !Number.isFinite(record.summary.expiresAt))) { delete record.summary; this.dirty = true; }
      if (record.lastSeen < this.now() - this.ttlDays * DAY) { this.clients.delete(id); this.dirty = true; }
    }
    while (this.clients.size > this.maxClients) { this.clients.delete(this.clients.keys().next().value); this.dirty = true; }
  }
  record(id) {
    if (!id || typeof id !== 'string' || id.length > 256) throw new Error('Identificador de memoria inválido.');
    this.prune();
    if (!this.clients.has(id)) {
      if (this.clients.size >= this.maxClients) {
        const oldest = [...this.clients].sort((a, b) => a[1].lastSeen - b[1].lastSeen)[0][0];
        this.clients.delete(oldest);
      }
      this.clients.set(id, { facts: {}, lastSeen: this.now(), usage: { day: '', count: 0 } });
      this.dirty = true;
    }
    return this.clients.get(id);
  }
  observe(id, text, sourceId = randomUUID(), history = []) {
    if (!this.enabled) return;
    const record = this.record(id);
    const timestamp = this.now();
    retractFacts(record, text);
    for (const fact of declaredFacts(text)) record.facts[fact.campo] = { ...fact, sourceId: String(sourceId).slice(0, 128), confirmedAt: timestamp, expiresAt: timestamp + this.ttlDays * DAY };
    record.summary = {
      texto: history.filter(item => item.role === 'user').slice(-3).map(item => `Cliente dijo: ${clean(item.text).slice(0, 200)}`).join(' | ').slice(0, this.summaryCharacters),
      sourceId: String(sourceId).slice(0, 128), expiresAt: timestamp + this.ttlDays * DAY
    };
    record.lastSeen = timestamp;
    this.dirty = true;
  }
  acceptProposals(id, proposals, text, sourceId) {
    if (!this.enabled) return 0;
    const candidates = declaredFacts(text);
    const accepted = proposals.filter(p => candidates.some(c => c.campo === p.campo && c.valor === p.valor && c.evidencia === p.evidencia));
    if (accepted.length) {
      const record = this.record(id);
      for (const fact of accepted) record.facts[fact.campo] = { ...fact, sourceId: String(sourceId || '').slice(0, 128), confirmedAt: this.now(), expiresAt: this.now() + this.ttlDays * DAY };
      this.dirty = true;
    }
    return accepted.length;
  }
  context(id) {
    this.prune();
    const record = this.clients.get(id);
    return record ? structuredClone({ datos_declarados: record.facts, resumen_declarado: record.summary || null }) : { datos_declarados: {}, resumen_declarado: null };
  }
  revision(id) { return revisionOf(this.context(id)); }
  edit(id, patch, actor) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch) || Object.keys(patch).some(k => !['revision', 'facts', 'summary'].includes(k))) throw new Error('Edición de memoria inválida.');
    if (patch.revision !== this.revision(id)) { const err = new Error('El cliente envió nueva información o la memoria cambió. Volvé a cargarla antes de guardar.'); err.status = 409; throw err; }
    const facts = patch.facts || {};
    if (typeof facts !== 'object' || Array.isArray(facts) || Object.keys(facts).some(k => !MEMORY_FIELDS.includes(k))) throw new Error('Campo de memoria no permitido.');
    for (const [field, value] of Object.entries(facts)) {
      if (value !== null && (typeof value !== 'string' || !value.trim() || value.length > 120 || /(?:sk-|nvapi-|gsk_)[\w-]+|\[AGENDA_CITA|api[_ -]?key|contrase[nñ]a/i.test(value))) throw new Error('Dato de memoria inválido. No guardes claves ni instrucciones.');
      if (field === 'requiere_instalacion' && value !== null && !['sí', 'no'].includes(value)) throw new Error('Instalación debe indicar sí o no.');
    }
    if (patch.summary !== undefined && patch.summary !== null && (typeof patch.summary !== 'string' || patch.summary.length > this.summaryCharacters || /(?:sk-|nvapi-|gsk_)[\w-]+/i.test(patch.summary))) throw new Error('Resumen inválido o demasiado largo.');
    const record = this.record(id), timestamp = this.now();
    for (const [field, value] of Object.entries(facts)) {
      if (value === null) delete record.facts[field];
      else record.facts[field] = { campo: field, valor: value.trim(), evidencia: 'Confirmado desde el panel por un operador.', origin: 'operator', confirmedBy: actor, sourceId: `admin:${randomUUID()}`, confirmedAt: timestamp, expiresAt: timestamp + this.ttlDays * DAY };
    }
    if (patch.summary !== undefined) {
      if (patch.summary === null || !patch.summary.trim()) delete record.summary;
      else record.summary = { texto: clean(patch.summary).slice(0, this.summaryCharacters), origin: 'operator', sourceId: `admin:${randomUUID()}`, expiresAt: timestamp + this.ttlDays * DAY };
    }
    record.lastSeen = timestamp; this.dirty = true; this.flush();
    return this.context(id);
  }
  consume(id) {
    const day = this.day();
    if (this.usage.day !== day) this.usage = { day, count: 0 };
    const record = this.record(id);
    if (record.usage?.day !== day) record.usage = { day, count: 0 };
    if (record.usage.count >= this.perClientDaily || this.usage.count >= this.globalDaily) return false;
    record.usage.count++; this.usage.count++; this.dirty = true;
    return true;
  }
  flush() {
    this.prune();
    if (!this.dirty) return;
    this.store.write(this.file, { version: 1, clients: Object.fromEntries(this.clients), usage: this.usage });
    this.dirty = false;
  }
}
