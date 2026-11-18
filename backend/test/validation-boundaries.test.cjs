const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const v = require('../dist/http/validation');
const { BadRequestError } = require('../dist/http/errors');
const input = { title: 'Встреча', date: '2099-01-01', time: '12:00', budget: 1000, cuisines: [], format: 'Не важно' };

for (const value of [null, undefined, [], 'text', 42]) {
  test(`Вход отклоняет значение вместо объекта: ${JSON.stringify(value)}`, () => {
    assert.throws(() => v.login(value), BadRequestError);
  });
}
for (const budget of [NaN, Infinity, -1, 499, 100001, 1000.5, 1550, '1000']) {
  test(`Недопустимый бюджет: ${budget}`, () => {
    assert.throws(() => v.preferences({ budget, cuisines: [] }), /budget/);
  });
}
test('Границы бюджета и списка кухонь принимаются без потери данных', () => {
  for (const budget of [500, 100000]) assert.deepEqual(v.preferences({ budget, cuisines: ['Итальянская'] }), { budget, cuisines: ['Итальянская'] });
  for (const cuisines of [null, 'italian', ['a', 'a'], [''], ['a'.repeat(81)], Array(101).fill('a')])
    assert.throws(() => v.preferences({ budget: 1000, cuisines }), /cuisines/);
});
for (const [field, value] of [['title', '\nВстреча'], ['title', '!!'], ['title', 'а'.repeat(101)], ['date', '01-01-2099'], ['time', '24:00'], ['format', 'Дома'], ['city', '']]) {
  test(`Параметры встречи отклоняют неверное поле ${field}: ${JSON.stringify(value)}`, () => {
    assert.throws(() => v.meeting({ ...input, [field]: value }), new RegExp(field));
  });
}
test('Профиль принимает частичное обновление и удаление аватара', () => {
  const avatarId = randomUUID();
  assert.deepEqual(v.profile({}), {});
  assert.deepEqual(v.profile({ avatarId: null }), { avatarId: null });
  assert.deepEqual(v.profile({ name: 'Анна-Мария', email: 'a@example.com', dark: false, calendar: true, avatarId }), { name: 'Анна-Мария', email: 'a@example.com', dark: false, calendar: true, avatarId });
  for (const patch of [{ name: '1Анна' }, { dark: 'false' }, { calendar: 1 }, { avatarId: 42 }, { admin: true }]) assert.throws(() => v.profile(patch), BadRequestError);
});
test('Текст, пароли и токены проверяются на границах длины', () => {
  for (const password of ['', 'a'.repeat(129)]) assert.throws(() => v.login({ email: 'a@example.com', password }), /password/);
  assert.throws(() => v.login({ email: 'invalid', password: 'x' }), /email/);
  for (const password of ['short', 'aaaaaaaa', 'AAAAAAAA1!', 'aaaaaaaa1!', 'Abcdefgh!']) assert.throws(() => v.registration({ name: 'Анна', email: 'a@example.com', password }), /password/);
  for (const length of [39, 201]) {
    assert.throws(() => v.refresh({ refreshToken: 'r'.repeat(length) }), /refreshToken/);
    assert.throws(() => v.invitation({ token: 'r'.repeat(length) }), /token/);
  }
  for (const length of [40, 200]) assert.equal(v.invitation({ token: 'r'.repeat(length) }).length, length);
  assert.equal(v.queryText(undefined, 'default'), 'default');
  assert.throws(() => v.queryText(['a']), /query/);
  assert.throws(() => v.queryText('a'.repeat(4001)), /query/);
});
test('Фильтры преобразуют строковые параметры, но отклоняют массивы и неверные значения', () => {
  assert.deepEqual(v.filters({ budget: '1500', cuisines: 'Итальянская', openNow: 'false' }), { budget: 1500, cuisines: ['Итальянская'], openNow: false });
  assert.deepEqual(v.filters({ openNow: 'true' }), { openNow: true });
  for (const patch of [{ budget: [] }, { budget: 'abc' }, { budget: 1.5 }, { openNow: 'yes' }, { cuisines: 1 }, { cuisines: ['a', 'a'] }, { cuisines: Array(101).fill('a') }, { q: [] }, { cuisine: '' }]) assert.throws(() => v.filters(patch), BadRequestError);
});
test('Сообщения, реакции и необязательная встреча для файла проверяются отдельно', () => {
  const id = randomUUID();
  assert.deepEqual(v.message({ text: '', fileId: id }), { text: '', fileId: id });
  assert.throws(() => v.message({ text: 'a'.repeat(4001) }), /text/);
  assert.throws(() => v.message({ text: 'ok', fileId: 'wrong' }), /fileId/);
  assert.equal(v.upload({}), undefined);
  assert.equal(v.upload({ meetingId: id }), id);
  assert.equal(v.restaurantId({ restaurantId: id }), id);
  assert.equal(v.reaction({ liked: false }), false);
  assert.throws(() => v.reaction({ liked: 0 }), /liked/);
});
