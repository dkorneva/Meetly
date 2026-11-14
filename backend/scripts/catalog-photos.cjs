// Команда обслуживания: обновляет общие фотографии карточек во фронтенде.
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
/**
 * Выполняет команду обслуживания каталога и завершает процесс с ошибкой при неполных данных.
 */
async function main() {
  const photos = path.resolve(__dirname, "../../frontend/assets/restaurants");
  const places = JSON.parse(await fs.readFile(path.join(photos, "sources.json"), "utf8"));
  await fs.mkdir(photos, { recursive: true });
  for (const p of places) {
    if (!/^[a-z0-9-]+\.webp$/.test(p.photoFile) || new URL(p.photoOriginal).protocol !== "https:")
      throw new Error(`Некорректное фото ${p.name}`);
    const response = await fetch(p.photoOriginal, { signal: AbortSignal.timeout(20000) });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error(`Фото ${p.name}: HTTP ${response.status}`);
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 12 * 1024 * 1024) throw new Error(`Фото ${p.name} слишком велико`);
      chunks.push(chunk);
    }
    const input = Buffer.concat(chunks);
    const metadata = await sharp(input, { limitInputPixels: 40000000 }).metadata();
    if (metadata.width < 600 || metadata.height < 250) throw new Error(`Фото ${p.name} слишком маленькое`);
    const output = await sharp(input, { limitInputPixels: 40000000 }).rotate()
      .resize(960, 400, { fit: "cover", position: "centre" }).webp({ quality: 84 }).toBuffer();
    await fs.writeFile(path.join(photos, p.photoFile), output);
    console.log(`${p.name}: ${Math.round(output.length / 1024)} КБ`);
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
