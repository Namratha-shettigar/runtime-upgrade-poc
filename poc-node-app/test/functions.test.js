// ---------------------------------------------------------------------------
// Automated tests. Run with:  npm test
// They use Node's BUILT-IN test runner, so nothing extra needs installing.
// In CI we run these on the OLD and the NEW Node version: they should pass on
// 18 and fail on 24. That failure is our early warning before production.
// ---------------------------------------------------------------------------

// "test" defines one test; "assert" checks that a result is what we expect.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Lambda finds layer packages in /opt/nodejs/node_modules. Locally they are
// in layers/sass/nodejs/node_modules, so we tell Node to look there too.
process.env.NODE_PATH = path.join(__dirname, '..', 'layers', 'sass', 'nodejs', 'node_modules');
// Make Node re-read NODE_PATH (it only reads it once at startup otherwise).
require('module').Module._initPaths();

test('checkInput recognises an array', () => {
  // Load our function's code.
  const { describe } = require('../src/checkInput');
  // [1, 2] is a list, so we expect the answer "array".
  assert.strictEqual(describe([1, 2]), 'array');
});

test('checkInput recognises a date', () => {
  const { describe } = require('../src/checkInput');
  // new Date() is a date, so we expect "date".
  assert.strictEqual(describe(new Date()), 'date');
});

test('renderCss compiles SCSS to CSS', () => {
  const { compile } = require('../src/renderCss');
  // The variable $c should be replaced by its value "red".
  assert.strictEqual(compile('$c: red; a { color: $c; }'), 'a{color:red}');
});
