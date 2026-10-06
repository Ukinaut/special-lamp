// npm start loads .env before reaching this entry point.
// Explicit development settings still take precedence over the local default.
process.env.SERVE_FRONTEND ||= 'true';
await import('./server/wp-server.js');
