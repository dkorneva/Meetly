require('dotenv/config');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createApp } = require('../dist/main');
const { Database } = require('../dist/infrastructure/database');

test('Сервер не запускается без достаточно длинного JWT_SECRET', async t => {
  const previous = process.env.JWT_SECRET;
  t.after(() => { if (previous === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previous; });
  for (const secret of ['', 'short']) {
    process.env.JWT_SECRET = secret;
    await assert.rejects(createApp({ connectDatabase: false }), /JWT_SECRET/);
  }
});
test('Ошибка подключения к БД закрывает соединение и не открывает порт', async t => {
  const failure = new Error('Database unavailable');
  t.mock.method(Database.prototype, 'connect', async () => { throw failure; });
  const disconnect = t.mock.method(Database.prototype, 'disconnect', async () => {});
  await assert.rejects(createApp(), error => error === failure);
  assert.equal(disconnect.mock.callCount(), 1);
});
test('Сервер слушает указанный адрес, повторное закрытие безопасно', async t => {
  const disconnect = t.mock.method(Database.prototype, 'disconnect', async () => {});
  const app = await createApp({ connectDatabase: false });
  t.after(() => app.close());
  await app.listen(0, '127.0.0.1');
  assert.equal(app.server.address().address, '127.0.0.1');
  await Promise.all([app.close(), app.close()]);
  assert.equal(app.server.listening, false);
  assert.equal(disconnect.mock.callCount(), 1);
});
test('Занятый порт вызывает ошибку, приложение можно закрыть после неудачного запуска', async t => {
  const first = await createApp({ connectDatabase: false });
  const second = await createApp({ connectDatabase: false });
  t.after(() => Promise.all([first.close(), second.close()]));
  await first.listen(0, '127.0.0.1');
  await assert.rejects(second.listen(first.server.address().port, '127.0.0.1'), { code: 'EADDRINUSE' });
});
test('При запуске с неправильными настройками процесс завершает работу с кодом 1 без секретов в журнале', () => {
  const child = spawnSync(process.execPath, ['dist/main.js'], { env: { ...process.env, JWT_SECRET: 'short' }, encoding: 'utf8', timeout: 10000 });
  assert.ifError(child.error);
  assert.equal(child.status, 1);
  assert.match(child.stderr, /Не удалось запустить сервер/);
  assert.ok(!child.stderr.includes('short'));
});
