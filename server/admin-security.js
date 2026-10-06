import { randomBytes, createHmac, timingSafeEqual, scryptSync } from 'node:crypto';

const COOKIE = 'aitue_admin';
const WEB_COOKIE = 'aitue_web';
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(item => {
    const index = item.indexOf('=');
    return index < 0 ? [] : [item.slice(0, index).trim(), item.slice(index + 1)];
  }).filter(item => item.length === 2));
}
function equal(a, b) {
  const left = Buffer.from(a || '');
  const right = Buffer.from(b || '');
  return left.length === right.length && timingSafeEqual(left, right);
}

export function installSecurity(app, { env = process.env, now = Date.now } = {}) {
  const password = env.ADMIN_PASSWORD || '';
  const email = env.ADMIN_EMAIL || 'admin@aitue.net';
  const secret = env.SESSION_SECRET || createHmac('sha256', password || randomBytes(32)).update('aitue-session').digest('hex');
  const passwordHash = password ? scryptSync(password, secret, 32) : null;
  const attempts = new Map();
  const traffic = new Map();
  const allowedOrigins = new Set((env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(s => s.trim()));
  const sign = payload => createHmac('sha256', secret).update(payload).digest('base64url');
  const encode = value => {
    const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
    return `${payload}.${sign(payload)}`;
  };
  function decode(cookie) {
    const [payload, signature] = (cookie || '').split('.');
    if (!payload || !equal(signature, sign(payload))) return null;
    try { const data = JSON.parse(Buffer.from(payload, 'base64url')); return data.exp > now() ? data : null; }
    catch { return null; }
  }
  function setCookie(req, res, name, value, seconds) {
    res.append('Set-Cookie', `${name}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${seconds}${env.COOKIE_SECURE === 'true' || req.secure ? '; Secure' : ''}`);
  }
  function allowRate(map, key, max, windowMs) {
    for (const [id, value] of map) if (value.end <= now()) map.delete(id);
    if (map.size > 10000 && !map.has(key)) return false;
    const value = map.get(key) || { count: 0, end: now() + windowMs };
    value.count++;
    map.set(key, value);
    return value.count <= max;
  }
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.has(origin)) {
      try { if (new URL(origin).host !== req.get('host')) return res.status(403).json({ error: 'Origen no permitido.' }); }
      catch { return res.status(403).json({ error: 'Origen inválido.' }); }
    }
    req.adminUser = decode(cookies(req)[COOKIE])?.user || null;
    next();
  });
  app.post('/api/auth/login', (req, res) => {
    if (!passwordHash) return res.status(503).json({ error: 'Configurá ADMIN_PASSWORD en el archivo .env y reiniciá el servidor.' });
    if (!allowRate(attempts, req.ip, 10, 15 * 60000)) return res.status(429).json({ error: 'Demasiados intentos. Probá nuevamente en 15 minutos.' });
    const input = req.body?.password;
    if (typeof input !== 'string' || input.length > 256 || req.body?.email !== email || !timingSafeEqual(scryptSync(input, secret, 32), passwordHash)) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    attempts.delete(req.ip);
    setCookie(req, res, COOKIE, encode({ user: email, exp: now() + 8 * 3600000 }), 8 * 3600);
    res.json({ user: email });
  });
  app.get('/api/auth/session', (req, res) => res.status(req.adminUser ? 200 : 401).json({ user: req.adminUser }));
  app.post('/api/auth/logout', (req, res) => { setCookie(req, res, COOKIE, '', 0); res.json({ success: true }); });
  app.post('/api/web-assistant/session', (req, res) => {
    let session = decode(cookies(req)[WEB_COOKIE]);
    if (!session?.id) session = { id: `web_${randomBytes(24).toString('hex')}`, exp: now() + 30 * 86400000 };
    setCookie(req, res, WEB_COOKIE, encode(session), 30 * 86400);
    res.json({ sessionId: session.id });
  });
  app.use('/api', (req, res, next) => {
    if (req.path === '/health') return next();
    if (req.path === '/contact') {
      if (!allowRate(traffic, `contact:${req.ip}`, 10, 60000)) return res.status(429).json({ error: 'Esperá un minuto para enviar otra solicitud.' });
      return next();
    }
    if (req.path === '/chat' || req.path.startsWith('/web-assistant/poll/')) {
      const session = decode(cookies(req)[WEB_COOKIE]);
      const requested = req.path === '/chat' ? req.body?.sessionId : decodeURIComponent(req.path.slice('/web-assistant/poll/'.length));
      if (!session?.id || requested !== session.id) return res.status(403).json({ error: 'La sesión del chat venció. Recargá la página.' });
      if (req.path === '/chat' && !allowRate(traffic, `chat:${session.id}`, 60, 60000)) return res.status(429).json({ error: 'Esperá un momento antes de enviar otro mensaje.' });
      return next();
    }
    if (!req.adminUser) return res.status(401).json({ error: 'Iniciá sesión para acceder al panel.' });
    next();
  });
}
