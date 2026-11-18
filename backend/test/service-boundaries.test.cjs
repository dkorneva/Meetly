const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { MeetingsService } = require('../dist/application/meetings.service');
const { Tokens } = require('../dist/infrastructure/tokens');
const { handleError, errorResponse } = require('../dist/http/error-handler');
const { BadRequestError } = require('../dist/http/errors');
const jwt = require('jsonwebtoken');
const input = { title: '  Новая встреча  ', date: '2099-01-01', time: '12:00', budget: 1500, cuisines: ['Итальянская'], format: 'В помещении' };

test('Редактирование встречи сохраняет город, меняет предпочтения и увеличивает версию', async () => {
  const meeting = { id: 'meeting', ownerId: 'owner', status: 'voting', city: 'Казань', startsAt: new Date('2099-01-02T09:00:00Z') };
  const memberUpdate = mock.fn(async () => ({})), meetingUpdate = mock.fn(async ({ data }) => ({ ...meeting, ...data }));
  const tx = { member: { findUnique: async () => ({}), update: memberUpdate }, meeting: { findUnique: async () => meeting, update: meetingUpdate } };
  const service = new MeetingsService({ atomic: action => action(tx) });
  const result = await service.edit('owner', 'meeting', input);
  assert.equal(result.title, 'Новая встреча');
  assert.equal(result.city, 'Казань');
  assert.equal(result.startsAt.toISOString(), '2099-01-01T09:00:00.000Z');
  assert.deepEqual(result.version, { increment: 1 });
  assert.deepEqual(memberUpdate.mock.calls[0].arguments[0].data, { budget: 1500, cuisines: '["Итальянская"]' });
  assert.equal((await service.edit('owner', 'meeting', { ...input, city: 'Москва' })).city, 'Москва');
});
test('Перенос встречи в прошлое отклоняется до записи, неизменённая дата разрешена', async () => {
  let startsAt = new Date('2099-01-01T09:00:00Z');
  const update = mock.fn(async x => x);
  const tx = { member: { findUnique: async () => ({}), update }, meeting: { findUnique: async () => ({ ownerId: 'owner', status: 'voting', startsAt, city: 'Москва' }), update } };
  const service = new MeetingsService({ atomic: action => action(tx) });
  await assert.rejects(service.edit('owner', 'meeting', { ...input, date: '2000-01-01' }), BadRequestError);
  assert.equal(update.mock.callCount(), 0);
  startsAt = new Date('2000-01-01T09:00:00Z');
  await service.edit('owner', 'meeting', { ...input, date: '2000-01-01' });
  assert.equal(update.mock.callCount(), 2);
});
test('JWT отклоняет подмену подписи, истечение срока и строковый payload', () => {
  const key = 'a'.repeat(40), tokens = new Tokens(key);
  const valid = tokens.sign({ sub: 'user', kind: 'access' }, 60);
  assert.equal(tokens.verify(valid).sub, 'user');
  assert.throws(() => new Tokens('b'.repeat(40)).verify(valid));
  assert.throws(() => tokens.verify(tokens.sign({ sub: 'user' }, -1)));
  assert.throws(() => tokens.verify(jwt.sign('text', key)), /Invalid token payload/);
});
test('Ошибку после отправки заголовков получает следующий обработчик', () => {
  const error = new Error('failed'), next = mock.fn();
  handleError(error, {}, { headersSent: true }, next);
  assert.equal(next.mock.calls[0].arguments[0], error);
});
test('Неожиданная ошибка скрывает секреты в ответе и журнале', t => {
  const log = t.mock.method(console, 'error', () => {});
  let body;
  const res = { headersSent: false, status(code) { assert.equal(code, 500); return this; }, json(value) { body = value; } };
  handleError(new Error('password=private'), { method: 'POST', path: '/api/test' }, res, () => assert.fail());
  assert.equal(body.message, 'Внутренняя ошибка сервера');
  assert.ok(!JSON.stringify(log.mock.calls).includes('password=private'));
  assert.equal(errorResponse(new URIError()).statusCode, 400);
  assert.equal(errorResponse({ type: 'entity.too.large' }).statusCode, 413);
});
