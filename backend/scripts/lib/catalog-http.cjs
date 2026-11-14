const { setTimeout: sleep } = require('node:timers/promises');

/**
 * Переводит Retry-After из секунд или HTTP-даты в задержку; некорректный заголовок заменяет резервной задержкой.
 * @param value Сохранённые коды кухонь либо значение заголовка.
 * @param fallback Задержка в миллисекундах при отсутствии корректного заголовка.
 * @param now Момент формирования события; задаётся явно для воспроизводимых проверок.
 */
function retryDelay(value, fallback, now = Date.now()) {
  if (value === null) return fallback;
  const seconds = Number(value);
  if (value.trim() !== '' && Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : fallback;
}

/**
 * Загружает полный JSON с ограничением времени и числа попыток; учитывает Retry-After и отклоняет неполные ответы.
 * @param url Адрес JSON-источника.
 * @param options Параметры запроса, время ожидания и число попыток.
 * @param dependencies Подменяемые HTTP-клиент, ожидание и журнал для изолированных тестов.
 * @throws При постоянной HTTP-ошибке, исчерпании повторов или неполном ответе источника.
 * @returns Полный JSON-ответ успешного запроса.
 */
async function getJson(url, options = {}, dependencies = {}) {
  const request = dependencies.fetch ?? fetch;
  const wait = dependencies.sleep ?? sleep;
  const log = dependencies.log ?? console.warn;
  const { attempts = 3, timeout = 120000, ...init } = options;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let delay;
    try {
      const response = await request(url, {
        ...init,
        headers: { 'User-Agent': 'Meetly/1.0 (educational restaurant catalogue)', ...init.headers },
        signal: AbortSignal.timeout(timeout),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.remark) throw new Error(`Источник вернул неполный ответ: ${data.remark}`);
        return data;
      }
      await response.body?.cancel();
      const error = new Error(`HTTP ${response.status} (${new URL(url).hostname})`);
      error.status = response.status;
      if (![408, 429, 500, 502, 503, 504].includes(response.status)) throw error;
      delay = retryDelay(response.headers.get('retry-after'), response.status === 429 ? 30000 : attempt * 5000);
      // Never retry earlier than requested by the provider or wait indefinitely.
      if (delay > 60000 || attempt === attempts) throw error;
    } catch (error) {
      if (error.status || error instanceof SyntaxError || /неполный ответ/.test(error.message)) throw error;
      if (attempt === attempts) throw new Error(`Не удалось получить ${new URL(url).hostname}: ${error.cause?.code ?? error.message}`, { cause: error });
      delay = attempt * 5000;
    }
    log(`Источник ${new URL(url).hostname} временно недоступен. Повтор ${attempt + 1}/${attempts} через ${delay / 1000} с.`);
    await wait(delay);
  }
}

module.exports = { getJson, retryDelay };
