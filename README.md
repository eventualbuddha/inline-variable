# inline-variable

Inline variables in JavaScript programs.

## Install

```
$ npm install [--save-dev] inline-variable
```

## Usage

Though this library has no listed dependencies, it expects to work with objects
from [`espree`][espree], [`escope`][escope], and [`magic-string`][ms]. Here's
an example:

[espree]: https://github.com/eslint/espree
[escope]: https://github.com/estools/escope
[ms]: https://github.com/Rich-Harris/magic-string

```js
import MagicString from 'magic-string';
import inline from 'inline-variable';
import { analyze } from 'escope';
import { parse } from 'espree';

const source = `
const PI = 3.14;
let radius = 8;
let circumference = 2 * PI * radius;
`;

const patcher = new MagicString(source);
const ast = parse(source, { sourceType: 'module' });
const scopeManager = analyze(ast, { sourceType: 'module', ecmaVersion: 6 });
const moduleScope = scopeManager.globalScope.childScopes[0];
const PIVariable = moduleScope.variables[0];

inline(PIVariable, patcher);
console.log(patcher.toString());
// let radius = 8;
// let circumference = 2 * 3.14 * radius;
```

### Custom API

This example still uses espree, but hardcodes objects needed for `inline` based
on the AST.

```js
import inline from 'inline-variable';
import { parse } from 'espree';

const source = 'const YES = true, NO = !YES;';
const ast = parse(source, { sourceType: 'module' });
const variable = {
  name: 'YES',
  defs: [{ parent: ast.body[0] }],
  identifiers: [
    ast.body[0].declarations[0].id,
    ast.body[0].declarations[1].init.argument
  ],
  references: [
    {
      init: true,
      identifier: ast.body[0].declarations[0].id,
      isWrite() { return false; }
    },
    {
      init: false,
      identifier: ast.body[0].declarations[1].init.argument,
      isWrite() { return false; }
    }
  ]
};

const patcher = {
  slice(start, end) {
    return source.slice(start, end);
  },
  
  remove(start, end) {
    console.log('REMOVE', start, '..', end);
  },
  
  overwrite(start, end, content) {
    console.log(
      'OVERWRITE',
      start, '..', end,
      JSON.stringify(this.slice(start, end)), '->', JSON.stringify(content)
    );
  }
};

inline(variable, patcher);
// REMOVE 6 .. 18
// OVERWRITE 24 .. 27 "YES" -> "true"
```

## License

MIT
