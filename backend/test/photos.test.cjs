const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFile, readdir } = require("node:fs/promises");
const { join } = require("node:path");
const sharp = require("sharp");

test("все фотографии карточек находятся в ассетах фронтенда и имеют источник", async () => {
  const photos = join(__dirname, "../../frontend/assets/restaurants");
  const sources = JSON.parse(await readFile(join(photos, "sources.json"), "utf8"));
  const files = (await readdir(photos)).filter(f => f.endsWith(".webp")).sort();
  assert.deepEqual(sources.map(p => p.photoFile).sort(), files);
  assert.equal(files.length, 10);
  for (const p of sources) {
    assert.ok(p.photoOriginal.startsWith("https://"));
    assert.ok(p.photoSource.startsWith("https://"));
    const metadata = await sharp(join(photos, p.photoFile)).metadata();
    assert.equal(metadata.format, "webp");
    assert.ok(metadata.width >= 600 && metadata.height >= 250);
  }
});
