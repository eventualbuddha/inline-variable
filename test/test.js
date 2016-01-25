import MagicString from 'magic-string';
import inline from '..';
import test from 'ava';
import { analyze } from 'escope';
import { join } from 'path';
import { parse } from 'espree';
import { readFileSync, writeFileSync } from 'fs';

test('inlines multiple references given by variable', t =>
  checkFixture('multiple-references')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('removes a variable and its initializer if there are no references', t =>
  checkFixture('no-references')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('throws when trying to inline a variable with multiple definitions', t =>
  t.throws(
    checkFixture('multiple-definitions'),
    'multiple definitions for `a` found, cannot inline'
  )
);

test('throws when trying to inline a variable with write references', t =>
  t.throws(
    checkFixture('write-references'),
    'variable `a` is written to, cannot inline'
  )
);

test('removes a declarator from the start of a declaration', t =>
  checkFixture('multiple-declarators-first', 'a')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('removes a declarator from the middle of a declaration', t =>
  checkFixture('multiple-declarators-middle', 'b')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('removes a declarator from the end of a declaration', t =>
  checkFixture('multiple-declarators-last', 'c')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('removes a declarator and the comment line above it from the middle of a declaration', t =>
  checkFixture('multiple-declarators-middle-multiline', 'PI')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('allows inlining multiple times', t =>
  checkFixture('multiple-inline', ['a', 'b'])
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('removes a variable declaration removed a piece at a time', t =>
  checkFixture('multiple-declarators-inline-all', ['a', 'b'])
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('adds parens to inlined binary expressions', t =>
  checkFixture('needs-parens', ['a', 'b'])
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('uses `undefined` when there is no initial value', t =>
  checkFixture('no-init')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('generates a member expression for object destructuring', t =>
  checkFixture('object-destructuring-simple')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('generates a member expression for aliased object destructuring', t =>
  checkFixture('object-destructuring-alias')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('generates a nested member expression for nested object destructuring', t =>
  checkFixture('object-destructuring-nested')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('generates a computed member expression for object destructuring with computed keys', t =>
  checkFixture('object-destructuring-computed')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('removes just the inlined property from a destructuring object pattern', t =>
  checkFixture('object-destructuring-remove-property')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('removes nested inlined property from a destructuring object pattern', t =>
  checkFixture('object-destructuring-remove-nested-property')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('inlines array destructured bindings', t =>
  checkFixture('array-destructuring-simple')
    .then(({ actual, expected }) => t.is(actual, expected))
);

test('inlines mixed array and object destructured bindings', t =>
  checkFixture('mixed-array-object-destructuring', ['b', 'd'])
    .then(({ actual, expected }) => t.is(actual, expected))
);


function checkFixture(name, vars=null) {
  return new Promise(resolve => {
    const dir = join(__dirname, 'fixtures', name);
    const main = join(dir, 'main.js');
    const expected = join(dir, '_expected.js');
    const actual = join(dir, '_actual.js');

    const source = readFileSync(main, { encoding: 'utf8' });
    const magicString = new MagicString(source);
    const ast = parse(source, { sourceType: 'module' });
    const scopeManager = analyze(ast, { sourceType: 'module', ecmaVersion: 6 });
    const moduleScope = scopeManager.globalScope.childScopes[0];

    let variables;

    if (vars) {
      if (!Array.isArray(vars)) {
        vars = [vars];
      }
      variables = vars.map(v => moduleScope.variables.find(({ name }) => name === v));
    } else {
      variables = [moduleScope.variables[0]];
    }

    variables.forEach(variable => inline(variable, magicString));
    writeFileSync(actual, magicString.toString(), { encoding: 'utf8' });

    resolve({
      actual: magicString.toString(),
      expected: readFileSync(expected, { encoding: 'utf8' })
    });
  });
}
