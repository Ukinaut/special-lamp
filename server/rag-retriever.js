import { createHash } from 'node:crypto';

const normalize = text => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const stop = new Set('el la los las un una unos unas de del a al y o que qué como con para por me mi mis tu tus su sus es son tengo quiero necesito saber informacion hola gracias ese esa eso este esta lo cuanto'.split(' '));
const aliases = { costos: 'precio', costo: 'precio', precios: 'precio', cuesta: 'precio', vale: 'precio', cotizar: 'precio', cotizaciones: 'precio', cotizacion: 'precio', camionetas: 'camioneta', vehiculos: 'vehiculo', imanes: 'iman', instalacion: 'instalar', instalaciones: 'instalar', instalarlo: 'instalar', cables: 'cable', protectores: 'protector' };
const words = text => normalize(text).split(/[^\p{L}\p{N}+]+/u).filter(w => w.length > 2 && !stop.has(w)).map(w => aliases[w] || w);
const hash = text => createHash('sha256').update(text).digest('hex');

export class RagRetriever {
  constructor(getArticles, { maxFragments = 4, maxCharacters = 6000, now = Date.now } = {}) {
    Object.assign(this, { getArticles, maxFragments, maxCharacters, now });
    this.revision = null; this.chunks = [];
  }
  refresh() {
    const data = this.getArticles();
    const articles = Array.isArray(data) ? data : [];
    const revision = hash(JSON.stringify(articles));
    if (revision === this.revision) return;
    this.revision = revision;
    this.chunks = [];
    for (const article of articles) {
      if (typeof article?.content !== 'string') continue;
      const articleId = String(article.id || hash(article.title || article.content).slice(0, 20));
      const version = hash(article.content);
      let offset = 0, index = 0;
      while (offset < article.content.length) {
        let end = Math.min(article.content.length, offset + 1400);
        if (end < article.content.length) {
          const boundary = article.content.lastIndexOf('\n', end);
          if (boundary > offset + 600) end = boundary;
        }
        const text = article.content.slice(offset, end).trim();
        if (text) this.chunks.push({ id: `${articleId}#${++index}`, articleId, title: String(article.title || '').slice(0, 200), text, tokens: words(text), titleTokens: words(article.title), article, version });
        offset = end;
      }
    }
  }
  allowed(chunk, clientId) {
    const a = chunk.article;
    if (a.approved === false || ['draft', 'rejected', 'archived'].includes(a.status) || a.visibility === 'internal') return false;
    if ((a.clientId || a.customerId) && (a.clientId || a.customerId) !== clientId) return false;
    const start = a.validFrom;
    const end = a.validUntil || a.expiresAt;
    if (start && (!Number.isFinite(Date.parse(start)) || Date.parse(start) > this.now())) return false;
    if (end && (!Number.isFinite(Date.parse(end)) || Date.parse(end) <= this.now())) return false;
    return true; // Existing administrator-authored articles remain available unchanged.
  }
  retrieve(query, { clientId, memory = {}, history = [] } = {}) {
    this.refresh();
    const current = words(query);
    const referential = /\b(?:ese|esa|eso|este|esa opcion|el mismo|ese modelo)\b/i.test(normalize(query));
    const extra = referential ? [memory.datos_declarados?.producto_interes?.valor, memory.datos_declarados?.equipo?.valor, history.filter(m => m.sender === 'user').slice(-2).map(m => m.text).join(' ')].filter(Boolean).join(' ') : '';
    const allTerms = [...new Set([...current, ...words(extra)])];
    const terms = allTerms.length > 64 ? [...allTerms.slice(0, 32), ...allTerms.slice(-32)] : allTerms;
    if (!terms.length) return { revision: this.revision, fragments: [] };
    const candidates = this.chunks.filter(c => this.allowed(c, clientId));
    const frequencies = new Map(terms.map(term => [term, candidates.filter(c => c.tokens.includes(term) || c.titleTokens.includes(term)).length]));
    const ranked = candidates.map(chunk => {
      let score = 0, matched = 0;
      for (const term of terms) {
        const frequency = chunk.tokens.filter(w => w === term).length;
        const titleFrequency = chunk.titleTokens.filter(w => w === term).length;
        if (!frequency && !titleFrequency) continue;
        matched++;
        const df = frequencies.get(term);
        score += Math.log(1 + (candidates.length + 1) / (df + 1)) * (Math.min(frequency, 3) + titleFrequency * 3) / (1 + chunk.tokens.length / 300);
      }
      return { chunk, score, coverage: matched / terms.length };
    }).filter(c => c.score > 0 && c.coverage >= 0.25).sort((a, b) => b.score - a.score);
    const fragments = []; let size = 0;
    for (const { chunk } of ranked) {
      if (fragments.length >= this.maxFragments) break;
      if (size + chunk.text.length > this.maxCharacters) continue;
      size += chunk.text.length;
      const { id, articleId, title, text, version } = chunk;
      fragments.push({ id, articleId, title, text, version, commercialValidUntil: chunk.article.commercialValidUntil || null });
    }
    return { revision: this.revision, fragments };
  }
  current(revision, fragments = [], clientId) {
    this.refresh();
    return this.revision === revision && fragments.every(f => this.chunks.some(c => c.id === f.id && this.allowed(c, clientId)));
  }
}
