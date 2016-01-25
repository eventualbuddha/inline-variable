import type { ArrayPattern, Binding, ObjectPattern, Property, Variable, VariableDeclaration, VariableDeclarator } from '../types';

/**
 * Gets the binding info for a variable, which includes information about
 * destructuring properties and the initial value of the variable.
 */
export default function getBindingForVariable(variable: Variable): ?Binding {
  if (variable.defs.length > 1) {
    throw new Error(
      `multiple definitions for \`${variable.name}\` found, cannot inline`
    );
  }

  const bindings = getBindings(variable.defs[0].parent);
  return bindings.find(binding => variable.identifiers.indexOf(binding.id) >= 0);
}

/**
 * Gets all the bindings defined by a node.
 */
function getBindings(node: Node): Array<Binding> {
  let bindings;

  switch (node.type) {
    case 'VariableDeclaration':
      const variableDeclaration = (node: VariableDeclaration);
      bindings = flatMap(variableDeclaration.declarations, getBindings);
      break;

    case 'VariableDeclarator':
      const variableDeclarator = (node: VariableDeclarator);
      bindings = getBindings(variableDeclarator.id)
        .map(value => {
          value.init = variableDeclarator.init;
          return value;
        });
      break;

    case 'Identifier':
      return [{ id: node, accesses: [], parents: [node] }];

    case 'ObjectPattern':
      const objectPattern = (node: ObjectPattern);
      bindings = flatMap(objectPattern.properties, getBindings);
      break;

    case 'ArrayPattern':
      const arrayPattern = (node: ArrayPattern);
      bindings = flatMap(arrayPattern.elements, (element, i) => {
        if (!element) { return []; }
        const bindings = getBindings(element);
        bindings.forEach(
          ({ accesses }) => accesses.unshift({
            key: { type: 'Literal', raw: `${i}`, value: i },
            computed: true
          })
        );
        return bindings;
      });
      break;

    case 'Property':
      const property = (node: Property);
      bindings = getBindings(property.value)
        .map(value => {
          value.accesses.unshift({ key: property.key, computed: property.computed });
          return value;
        });
      break;

    default:
      throw new Error(`unexpected node type: ${node.type}`);
  }

  bindings.forEach(binding => binding.parents.push(node));
  return bindings;
}

function flatMap<T, U>(list: Array<T>, map: (item: T, index: number) => U): Array<U> {
  let index = 0;
  return list.reduce((memo, item) => memo.concat(map(item, index++)), []);
}
