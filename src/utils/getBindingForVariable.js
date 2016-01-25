import type { ArrayPattern, Binding, Identifier, ObjectPattern, Node, Property, Variable, VariableDeclaration, VariableDeclarator } from '../types';

/**
 * Gets the binding info for a variable, which includes information about
 * destructuring properties and the initial value of the variable.
 */
export default function getBindingForVariable(variable: Variable): Binding {
  if (variable.defs.length > 1) {
    throw new Error(
      `multiple definitions for \`${variable.name}\` found, cannot inline`
    );
  }

  const bindings = getBindings(variable.defs[0].parent);
  const result = bindings.find(binding => variable.identifiers.indexOf(binding.id) >= 0);

  if (!result) {
    throw new Error(`cannot find matching variable for \`${variable.name}\``);
  }

  return result;
}

/**
 * Gets all the bindings defined by a node.
 */
function getBindings(node: Node): Array<Binding> {
  let bindings;

  if (node.type === 'VariableDeclaration') {
    bindings = flatMap(node.declarations, getBindings);
  } else if (node.type === 'VariableDeclarator') {
    const { init } = node;
    bindings = getBindings(node.id)
      .map(value => {
        value.init = init;
        return value;
      });
  } else if (node.type === 'Identifier') {
    return [{ id: node, accesses: [], parents: [node] }];
  } else if (node.type === 'ObjectPattern') {
    bindings = flatMap(node.properties, getBindings);
  } else if (node.type === 'ArrayPattern') {
    bindings = flatMap(node.elements, (element, i): Array<Binding> => {
      if (!element) { return []; }
      const bindings = getBindings(element);
      bindings.forEach(
        ({ accesses }) => accesses.unshift({
          key: {
            type: 'Literal',
            raw: `${i}`,
            value: i,
            start: -1,
            end: -1
          },
          computed: true
        })
      );
      return bindings;
    });
  } else if (node.type === 'Property') {
    const { key, computed } = node;
    bindings = getBindings(node.value)
      .map(value => {
        value.accesses.unshift({ key, computed });
        return value;
      });
  } else {
    throw new Error(`unexpected node type: ${node.type}`);
  }

  bindings.forEach(binding => binding.parents.push(node));
  return bindings;
}

function flatMap<T, U>(list: Array<T>, map: (item: T, index: number) => Array<U>): Array<U> {
  let index = 0;
  return list.reduce((memo, item) => memo.concat(map(item, index++)), []);
}
