const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const configFile = ts.readConfigFile(path.join(root, "tsconfig.docs.json"), ts.sys.readFile);
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const program = ts.createProgram(config.fileNames, config.options);
const checker = program.getTypeChecker();
const sections = [];
let functions = 0;
let classes = 0;
const missing = [];

for (const source of program.getSourceFiles()) {
  const relative = path.relative(root, source.fileName).replace(/\\/g, "/");
  if (!relative.startsWith("src/") || source.isDeclarationFile) continue;
  const entries = [];
  function visit(node) {
    let name, signatureNode, anchor;
    if (ts.isFunctionDeclaration(node) && node.name) {
      name = node.name.text;
      signatureNode = node;
      anchor = node;
    } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const initializer = node.initializer;
      if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) {
        name = node.name.text;
        signatureNode = initializer;
        anchor = node.parent.parent;
      } else if (ts.isCallExpression(initializer) && initializer.expression.getText(source) === "forwardRef") {
        name = node.name.text;
        signatureNode = initializer.arguments[0];
        anchor = node.parent.parent;
      }
    }
    if (signatureNode) {
      const signature = checker.getSignatureFromDeclaration(signatureNode);
      const declaration = name + checker.signatureToString(signature, signatureNode, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope);
      const jsdoc = anchor.jsDoc?.at(-1);
      if (!jsdoc) missing.push(`${relative}: ${name}`);
      const description = typeof jsdoc?.comment === "string" ? jsdoc.comment : "";
      entries.push(`### ${name}\n\n${description}\n\n\`\`\`typescript\n${declaration}\n\`\`\``);
      functions += 1;
    }
    if (ts.isClassDeclaration(node)) {
      classes += 1;
      entries.push(`### Класс ${node.name?.text ?? "default"}\n\n\`\`\`typescript\n${node.getText(source)}\n\`\`\``);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (entries.length) sections.push(`## ${relative}\n\n${entries.join("\n\n")}`);
}

if (missing.length) {
  console.error("Отсутствует JSDoc:\n" + missing.join("\n"));
  process.exitCode = 1;
} else {
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/SIGNATURES.md"),
    `# Сигнатуры Meetly\n\nСгенерировано из TypeScript. Включены экспортируемые и внутренние именованные функции, обработчики, компоненты и функции стилей. Анонимные обратные вызовы описываются в составе принимающих их функций.\n\nФункций: ${functions}. Классов: ${classes}.${classes ? "" : " В проекте используются функциональные компоненты React; классов нет."}\n\n${sections.join("\n\n")}\n`);
  console.log(`Документация: ${functions} сигнатур, ${classes} классов; у всех функций есть JSDoc.`);
}
