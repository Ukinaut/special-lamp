import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// One server process owns these files. Cache reads and replace complete files atomically.
export class JsonStore {
  constructor() { this.cache = new Map(); }
  read(file, fallback = []) {
    if (!this.cache.has(file)) {
      this.cache.set(file, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback);
    }
    return structuredClone(this.cache.get(file));
  }
  write(file, value) {
    const tmp = `${file}.${randomUUID()}.tmp`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    try {
      fs.writeFileSync(tmp, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(tmp, file);
      this.cache.set(file, structuredClone(value));
    } finally {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
  }
  invalidate(file) { file ? this.cache.delete(file) : this.cache.clear(); }
}
