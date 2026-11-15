// Transformer do Jest para pacotes ESM-only em node_modules (NestJS 12, file-type...).
// O Jest so carrega ESM via require() nativamente a partir do Node 24.9; no Node 22 convertemos
// esses arquivos para CommonJS com o TypeScript ja instalado. Pacotes CommonJS passam intactos.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const packageTypeCache = new Map();

/** Descobre se o arquivo pertence a um pacote com "type": "module". */
function isEsmFile(filename) {
  if (filename.endsWith('.mjs')) {
    return true;
  }
  if (filename.endsWith('.cjs')) {
    return false;
  }
  let dir = path.dirname(filename);
  const visited = [];
  while (true) {
    if (packageTypeCache.has(dir)) {
      const cached = packageTypeCache.get(dir);
      visited.forEach((d) => packageTypeCache.set(d, cached));
      return cached;
    }
    visited.push(dir);
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      let esm = false;
      try {
        esm = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).type === 'module';
      } catch {
        esm = false;
      }
      visited.forEach((d) => packageTypeCache.set(d, esm));
      return esm;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      visited.forEach((d) => packageTypeCache.set(d, false));
      return false;
    }
    dir = parent;
  }
}

module.exports = {
  process(sourceText, sourcePath) {
    if (!isEsmFile(sourcePath)) {
      return { code: sourceText };
    }
    // import.meta nao existe em CommonJS: troca pelos equivalentes. Um `const require =
    // createRequire(...)` colidiria com o `require` do wrapper CommonJS, entao e removido.
    const patched = sourceText
      .replace(/\b(?:const|let|var)\s+require\s*=\s*createRequire\([^)]*\);?/g, '')
      .replace(/import\.meta\.url/g, "require('node:url').pathToFileURL(__filename).href")
      .replace(/import\.meta\.resolve\(/g, 'require.resolve(')
      .replace(/import\.meta\.dirname/g, '__dirname')
      .replace(/import\.meta\.filename/g, '__filename');
    const output = ts.transpileModule(patched, {
      fileName: sourcePath,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        allowJs: true,
        esModuleInterop: true,
        sourceMap: false,
        inlineSourceMap: false,
      },
    });
    return { code: output.outputText };
  },
};
