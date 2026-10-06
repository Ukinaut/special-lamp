export class ChatStore {
  constructor(store, directory, { maxChats = 1000, maxMessages = 200, maxLogs = 1000 } = {}) {
    this.store = store;
    this.chatFile = `${directory}/live-chats.json`;
    this.logFile = `${directory}/bot-logs.json`;
    this.dirty = false;
    const mark = () => { this.dirty = true; };
    const bounded = (items, limit) => {
      const array = (Array.isArray(items) ? items : []).slice(-limit);
      return new Proxy(array, {
        get(target, key) {
          if (key === 'push') return (...values) => { target.push(...values); if (target.length > limit) target.splice(0, target.length - limit); mark(); return target.length; };
          return Reflect.get(target, key);
        },
        set(target, key, value) { target[key] = value; mark(); return true; }
      });
    };
    const track = chat => new Proxy({ ...chat, messages: bounded(chat.messages, maxMessages) }, {
      set(target, key, value) { target[key] = value; mark(); return true; }
    });
    const initial = store.read(this.chatFile, {});
    const chats = Object.create(null);
    for (const [id, chat] of Object.entries(initial).slice(-maxChats)) chats[id] = track(chat);
    this.chats = new Proxy(chats, {
      set(target, id, chat) {
        if (!Object.hasOwn(target, id) && Object.keys(target).length >= maxChats) {
          const removable = Object.keys(target).find(key => !target[key].botPaused);
          if (!removable) throw new Error('El límite de conversaciones activas fue alcanzado.');
          delete target[removable];
        }
        target[id] = track(chat); mark(); return true;
      },
      deleteProperty(target, id) { delete target[id]; mark(); return true; }
    });
    this.logs = new Proxy(store.read(this.logFile, []).slice(0, maxLogs), {
      get(target, key) {
        if (key === 'unshift') return (...values) => { target.unshift(...values); if (target.length > maxLogs) target.length = maxLogs; mark(); return target.length; };
        return Reflect.get(target, key);
      },
      set(target, key, value) { target[key] = value; mark(); return true; }
    });
  }
  flush() {
    if (!this.dirty) return;
    // JSON serialization strips proxies before the store clones its cache.
    this.store.write(this.chatFile, JSON.parse(JSON.stringify(this.chats)));
    this.store.write(this.logFile, JSON.parse(JSON.stringify(this.logs)));
    this.dirty = false;
  }
}
