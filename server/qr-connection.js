export class QrConnection {
  constructor({ createSocket, onStatus, onQr, onMessages, onError = console.error, setTimer = setTimeout, clearTimer = clearTimeout }) {
    Object.assign(this, { createSocket, onStatus, onQr, onMessages, onError, setTimer, clearTimer });
    this.enabled = false;
    this.generation = 0;
    this.attempt = 0;
    this.socket = null;
    this.pending = null;
    this.timer = null;
    this.credentialSave = Promise.resolve();
  }
  start() {
    this.enabled = true;
    if (this.pending || this.socket) return this.pending || Promise.resolve(this.socket);
    const generation = ++this.generation;
    this.onStatus('CONNECTING', null);
    const current = () => this.enabled && generation === this.generation;
    this.pending = (async () => {
      try {
        const { socket, saveCreds } = await this.createSocket();
        if (!current()) { socket.end(undefined); return null; }
        this.socket = socket;
        socket.ev.on('creds.update', () => {
          if (current()) this.credentialSave = this.credentialSave.then(() => saveCreds()).catch(this.onError);
        });
        socket.ev.on('messages.upsert', messages => { if (current()) Promise.resolve(this.onMessages(messages)).catch(this.onError); });
        socket.ev.on('connection.update', async update => {
          if (!current()) return;
          try {
            if (update.qr) await this.onQr(update.qr, current);
            if (!current()) return;
            if (update.connection === 'open') {
              this.attempt = 0;
              this.onStatus('CONNECTED', socket);
            } else if (update.connection === 'close') {
              const code = update.lastDisconnect?.error?.output?.statusCode;
              socket.ev.removeAllListeners();
              this.socket = null;
              if ([401, 500, 440, 403].includes(code)) {
                this.enabled = false;
                this.onStatus('RELINK_REQUIRED', null);
              } else this.scheduleReconnect();
            }
          } catch (err) { this.onError(err); }
        });
        return socket;
      } catch (err) { if (current()) { this.onError(err); this.scheduleReconnect(); } return null; }
      finally { this.pending = null; }
    })();
    return this.pending;
  }
  scheduleReconnect() {
    if (!this.enabled || this.timer) return;
    this.onStatus('RECONNECTING', null);
    const delay = Math.min(30000, 1000 * 2 ** Math.min(this.attempt++, 5));
    this.timer = this.setTimer(() => { this.timer = null; this.start(); }, delay);
  }
  async disconnect({ logout = false } = {}) {
    this.enabled = false;
    ++this.generation;
    if (this.timer) this.clearTimer(this.timer);
    this.timer = null;
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.ev.removeAllListeners();
      try { if (logout) await socket.logout(); }
      finally { socket.end(undefined); }
    }
    if (this.pending) await this.pending;
    await this.credentialSave;
    this.onStatus('DISCONNECTED', null);
  }
  async restart() { await this.disconnect(); return this.start(); }
}
