import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

test('the npm start entry point loads the server with frontend defaults and honors explicit settings', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aitue-startup-'));
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const code = `await import('./start-dev.mjs'); console.log('LAUNCH:' + process.env.SERVE_FRONTEND); const { shutdown } = await import('./server/wp-server.js'); await shutdown();`;
  try {
    for (const [setting, expected] of [['', 'true'], ['false', 'false']]) {
      const output = execFileSync(process.execPath, ['--input-type=module', '-e', code], {
        cwd: root, encoding: 'utf8', timeout: 20000,
        env: { ...process.env, BOT_TEST_MODE: 'true', BOT_DATA_DIR: directory, SERVE_FRONTEND: setting, OPENAI_API_KEY: '', WHISPER_API_KEY: '', GROQ_API_KEY: '', ADMIN_PASSWORD: 'test-only-password', SESSION_SECRET: 'test-only-session' }
      });
      assert.ok(output.includes(`LAUNCH:${expected}`));
    }
  } finally {
    const resolved = path.resolve(directory);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('aitue-startup-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
