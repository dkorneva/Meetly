const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const layers = ["app", "pages", "widgets", "features", "entities", "shared"];
const errors = [];
let checked = 0;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}

function location(file) {
  const parts = path.relative(path.join(root, "src"), file).split(path.sep);
  return { layer: parts[0], slice: parts[1] };
}

for (const file of walk(path.join(root, "src"))) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const from = location(file);
  if (!layers.includes(from.layer)) errors.push(`Неизвестный слой: ${file}`);
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier?.text;
    if (!specifier?.startsWith(".")) continue;
    const base = path.resolve(path.dirname(file), specifier);
    const target = [base, base + ".ts", base + ".tsx", path.join(base, "index.ts")]
      .find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!target) {
      errors.push(`${path.relative(root, file)}: не найден ${specifier}`);
      continue;
    }
    const to = location(target);
    if (!layers.includes(to.layer)) continue; // Изображения и другие ресурсы вне src.
    checked += 1;
    const sameSlice = from.layer === to.layer && (from.slice === to.slice || ["app", "shared"].includes(from.layer));
    if (!sameSlice && layers.indexOf(to.layer) <= layers.indexOf(from.layer)) {
      errors.push(`${path.relative(root, file)}: запрещён импорт ${specifier}`);
    }
    if (!sameSlice && ["pages", "widgets", "features", "entities"].includes(to.layer)) {
      if (path.relative(path.join(root, "src", to.layer, to.slice), target) !== "index.ts") {
        errors.push(`${path.relative(root, file)}: импорт должен идти через публичный index.ts слайса ${to.slice}`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`FSD: проверено ${checked} зависимостей, нарушений нет.`);
}
