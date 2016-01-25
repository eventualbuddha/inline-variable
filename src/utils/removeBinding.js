import type { ArrayPattern, Binding, Node, Patcher, Property, VariableDeclaration, VariableDeclarator } from '../types';

/**
 * Remove the binding identifier and all its parents that can be removed. For
 * example, if `a` is removed in `let a = 0;` then the entire declaration will
 * be removed.
 */
export default function removeBinding(binding: Binding, patcher: Patcher) {
  for (let i = 0; i < binding.parents.length; i++) {
    const node = binding.parents[i];

    if (node.type === 'ObjectPattern') {
      const property = binding.parents[i - 1];
      if (property.type === 'Property') {
        removeListElement(node.properties, property, patcher);
      } else {
        throw new Error(`BUG: parent before ${node.type} must be \`Property\`, but got \'${property.type}\``);
      }
      if (node.properties.length > 0) {
        break;
      }
    } else if (node.type === 'ArrayPattern') {
      const element = binding.parents[i - 1];
      nullifyListElement(node.elements, element, patcher);
      if (node.elements.some(e => e !== null)) {
        break;
      }
    } else if (node.type === 'VariableDeclaration') {
      const declarator = binding.parents[i - 1];
      if (declarator.type === 'VariableDeclarator') {
        removeListElement(node.declarations, declarator, patcher);
      } else {
        throw new Error(`BUG: parent before ${node.type} must be \`VariableDeclarator\`, but got \'${declarator.type}\``);
      }
      if (node.declarations.length > 0) {
        break;
      }
      removeStatement(node, patcher);
    } else if (node.type !== 'Identifier' && node.type !== 'Property' && node.type !== 'VariableDeclarator') {
      throw new Error(`unexpected parent type: ${node.type}`);
    }
  }
}

/**
 * Remove a node from a list and its representation in the source code.
 */
function removeListElement(list: Array<Node>, element: Node, patcher: Patcher) {
  const index = list.indexOf(element);
  if (index === 0) {
    const next = list[index + 1];
    if (next) {
      patcher.remove(element.start, next.start);
    }
  } else {
    const last = list[index - 1];
    if (last) {
      patcher.remove(last.end, element.end);
    }
  }
  list.splice(index, 1);
}

/**
 * Replace a node in a list with null.
 */
function nullifyListElement(list: Array<?Node>, element: Node, patcher: Patcher) {
  const index = list.indexOf(element);
  patcher.remove(element.start, element.end);
  list[index] = null;
}

/**
 * Remove an entire statement and, if it was the only non-whitespace on the
 * line, the whole line.
 */
function removeStatement(node: Node, patcher: Patcher) {
  const { start, end } = removableRangeForStatement(node, patcher.original);
  patcher.remove(start, end);

  // FIXME: Somehow remove `node` from its parent to make the AST correct.
  replace(node, { type: 'EmptyStatement' });
}

/**
 * Replace the contents of `destination` with `source`.
 */
function replace(destination: Object, source: Object) {
  Object.keys(destination).forEach(key => delete destination[key]);
  Object.keys(source).forEach(key => destination[key] = source[key]);
}

/**
 * Determine what part of the source to remove when removing `node`.
 */
function removableRangeForStatement(node: Node, source: string): { start: number, end: number } {
  const { start, end } = node;

  // See whether we can remove the whole line.
  const startOfLine = startOfLinePrecedingIndexWithOnlySpaces(source, start);
  const endOfLine = endOfLineSucceedingIndexWithOnlySpaces(source, end);

  if (startOfLine != null && endOfLine != null) {
    return { start: startOfLine, end: endOfLine };
  } else {
    return { start, end };
  }
}

/**
 * Find the start of the line where the text before `index` is only whitespace.
 */
function startOfLinePrecedingIndexWithOnlySpaces(source: string, index: number): ?number {
  for (let i = index - 1; i >= 0; i--) {
    switch (source[i]) {
      case ' ':
      case '\t':
        break;

      case '\n':
      case '\r':
        return i + 1;

      default:
        return null;
    }
  }

  return 0;
}

/**
 * Find the end of the line where the text from `index` on is only whitespace.
 */
function endOfLineSucceedingIndexWithOnlySpaces(source: string, index: number): ?number {
  for (let i = index; i < source.length; i++) {
    switch (source[i]) {
      case ' ':
      case '\t':
        break;

      case '\r':
        i++;
        if (source[i] === '\n') {
          i++;
        }
        return i;

      case '\n':
        return i + 1;

      default:
        return null;
    }
  }

  return source.length;
}
