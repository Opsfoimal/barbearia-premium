import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';

test('proteções de origem, sessão, cache e limite de login', async () => {
  const password = randomBytes(24).toString('base64url');
  const { app, db } = createApp({ databasePath: ':memory:', adminPassword: password, adminEmail: 'security@example.com' });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const login = (extra = {}, value = password) => fetch(base + '/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'DQBStudio', ...extra },
    body: JSON.stringify({ email: 'security@example.com', password: value })
  });
  try {
    const catalog = await fetch(base + '/api/catalog');
    assert.equal(catalog.headers.get('cache-control'), 'no-store');
    assert.equal(catalog.headers.get('x-powered-by'), null);
    assert.equal(catalog.headers.get('x-content-type-options'), 'nosniff');
    assert(catalog.headers.get('content-security-policy').includes("script-src 'self'"));
    assert.equal((await login({ Origin: 'https://attacker.example' })).status, 403);
    assert.equal((await login({ 'Sec-Fetch-Site': 'cross-site' })).status, 403);
    assert.equal((await login({ 'X-Requested-With': '' })).status, 403);
    const valid = await login({ Origin: base });
    assert.equal(valid.status, 200);
    const cookie = valid.headers.get('set-cookie').split(';')[0];
    assert.match(valid.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
    const stored = db.prepare('SELECT token FROM sessions').get().token;
    assert.notEqual(stored, cookie.slice('session='.length));
    const route = '/api/admin/data?from=2026-10-08&to=2026-10-08';
    assert.equal((await fetch(base + route, { headers: { cookie } })).status, 200);
    assert.equal((await fetch(base + route, { headers: { cookie: `session=${stored}` } })).status, 401);
    assert.equal((await fetch(base + '/api/admin/services/1', { method: 'DELETE', headers: { cookie } })).status, 403);
    const logout = await fetch(base + '/api/logout', { method: 'POST', headers: { cookie, 'X-Requested-With': 'DQBStudio' } });
    assert.equal(logout.status, 200);
    assert.equal((await fetch(base + route, { headers: { cookie } })).status, 401);
    const malformed = await fetch(base + '/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'DQBStudio' }, body: '{bad-secret-json' });
    assert.equal(malformed.status, 400);
    assert(!(await malformed.text()).includes('bad-secret-json'));
    const oversized = await fetch(base + '/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'DQBStudio' }, body: JSON.stringify({ name: 'a'.repeat(25000) }) });
    assert.equal(oversized.status, 413);
    for (let attempt = 0; attempt < 9; attempt++) assert.equal((await login({}, 'incorrect')).status, 401);
    const blocked = await login();
    assert.equal(blocked.status, 429);
    assert.match((await blocked.json()).error, /tentativas/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});
