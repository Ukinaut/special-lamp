export class MessageQueue {
  constructor({ concurrency = 4, maxPending = 200 } = {}) {
    this.concurrency = concurrency;
    this.maxPending = maxPending;
    this.pending = 0;
    this.running = 0;
    this.waiters = [];
    this.chats = new Map();
    this.inFlight = new Map();
    this.processed = new Map();
  }
  async acquire() {
    if (this.running >= this.concurrency) await new Promise(resolve => this.waiters.push(resolve));
    else this.running++;
  }
  release() { const next = this.waiters.shift(); if (next) next(); else this.running--; }
  run(chatId, messageId, task) {
    const key = messageId ? `${chatId}:${messageId}` : null;
    const now = Date.now();
    for (const [id, expiry] of this.processed) if (expiry < now) this.processed.delete(id);
    if (key && this.processed.has(key)) return Promise.resolve();
    if (key && this.inFlight.has(key)) return this.inFlight.get(key);
    if (this.pending >= this.maxPending) return Promise.reject(new Error('La cola de mensajes está ocupada.'));
    this.pending++;
    const previous = this.chats.get(chatId) || Promise.resolve();
    const next = previous.catch(() => {}).then(async () => {
      await this.acquire();
      try {
        const result = await task();
        if (key) {
          this.processed.set(key, Date.now() + 24 * 60 * 60 * 1000);
          while (this.processed.size > 10000) this.processed.delete(this.processed.keys().next().value);
        }
        return result;
      } finally { this.release(); }
    }).finally(() => {
      this.pending--;
      if (key) this.inFlight.delete(key);
      if (this.chats.get(chatId) === next) this.chats.delete(chatId);
    });
    this.chats.set(chatId, next);
    if (key) this.inFlight.set(key, next);
    return next;
  }
}
