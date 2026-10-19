// Ejecuta el TypeScript original. Los decoradores y tokens de Angular son dobles.
// No valida compilación Angular, inyección de dependencias, DOM ni backend.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const dep = process.env.QA_NODE_MODULES ? createRequire(path.join(process.env.QA_NODE_MODULES, 'package.json')) : require;
const ts = dep('typescript');
const root = path.resolve(process.env.QA_PROJECT_ROOT || (fs.existsSync(path.join(__dirname, '../fuentes')) ? path.join(__dirname, '../fuentes') : path.join(__dirname, '..')));
const cache = new Map();
const decorator = () => () => {};
function load(relative) {
  const full = path.resolve(root, relative);
  if (cache.has(full)) return cache.get(full).exports;
  const module = { exports: {} }; cache.set(full, module);
  const source = fs.readFileSync(full, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true, esModuleInterop: true }}).outputText;
  function localRequire(name) {
    if (name === '@angular/core') return { Injectable: decorator, Inject: decorator, PLATFORM_ID: 'browser' };
    if (name === '@angular/material/core') return { MAT_DATE_FORMATS: 'date-formats' };
    if (name === '@env/environment') return { environment: { key: 'clave-sintetica-qa', api: 'http://127.0.0.1:5279' }};
    if (name.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(full), name + '.ts')));
    return dep(name);
  }
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: full })(localRequire, module, module.exports);
  return module.exports;
}
module.exports = { load, root, dep };
