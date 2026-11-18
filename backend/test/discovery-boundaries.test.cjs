const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DiscoveryService } = require('../dist/application/discovery.service');

test('Подбор ранжирует компромиссы, исключает удалённые варианты и соблюдает фильтры', async () => {
  const places = [
    { id: 'a', name: 'Пицца', cuisine: 'italian', cuisineLabel: 'Итальянская', price: 900, outdoor: true, openNow: true, address: 'Москва' },
    { id: 'b', name: 'Суши', cuisine: 'japanese', price: 3000, outdoor: false, openNow: false, address: 'Москва' },
    { id: 'c', name: 'Пицца другая', cuisine: 'italian', price: 900, outdoor: true, openNow: true, address: 'Москва' },
    { id: 'excluded', name: 'Исключено', cuisine: 'italian', price: 900, outdoor: true, openNow: true },
  ];
  const db = { member: { findMany: async () => [{ budget: 1000, cuisines: '["Итальянская"]' }, { budget: 2000, cuisines: '["Грузинская"]' }] }, candidate: { findMany: async () => [{ restaurantId: 'excluded' }] } };
  let format = 'В помещении';
  const service = new DiscoveryService(db, { member: async () => ({ format }) }, { filterCatalog: async () => ({ items: places, warning: 'warning' }) });
  const result = await service.list('user', 'meeting');
  assert.deepEqual(result.items.map(p => p.id), ['a', 'c', 'b']);
  assert.equal(result.items[0].matchLabel, 'Компромисс');
  assert.equal(result.items[2].matchLabel, 'Другой вариант');
  assert.equal(result.total, 3);
  assert.equal(result.warning, 'warning');
  for (const filters of [{ cuisine: 'Итальянская' }, { cuisines: ['Итальянская'] }, { budget: 1000 }, { openNow: true }, { q: ' ПИЦЦА ' }]) {
    assert.deepEqual((await service.list('user', 'meeting', filters)).items.map(p => p.id), ['a', 'c']);
  }
  assert.equal((await service.list('user', 'meeting', { q: 'нет такого места' })).total, 0);
  format = 'На улице';
  assert.deepEqual((await service.list('user', 'meeting')).items.map(p => p.id), ['a', 'c']);
});
