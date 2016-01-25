import type { Binding, Patcher } from '../types';

/**
 * Remove the binding identifier and all its parents that can be removed. For
 * example, if `a` is removed in `let a = 0;` then the entire declaration will
 * be removed.
 */
export default function removeBinding(binding: Binding, patcher: Patcher) {
  for (let i = 0; i < binding.parents.length; i++) {
    const node = binding.parents[i];

    switch (node.type) {
      case 'Identifier':
      case 'Property':
      case 'VariableDeclarator':
        // Just let these go since they're handled elsewhere.
        break;

      case 'ObjectPattern':
        const property = binding.parents[i - 1];
        removeListElement(node.properties, property, patcher);
        if (node.properties.length > 0) {
          return;
        }
        break;

      case 'ArrayPattern':
        const element = binding.parents[i - 1];
        nullifyListElement(node.elements, element, patcher);
        if (node.elements.some(e => e !== null)) {
          return;
        }
        break;

      case 'VariableDeclaration':
        const declarator = binding.parents[i - 1];
        removeListElement(node.declarations, declarator, patcher);
        if (node.declarations.length > 0) {
          return;
        }
        removeStatement(node, patcher);
        break;

      default:
        throw new Error(`unexpected parent type: ${node.type}`);
    }
  }
}

/**
 * Remove a node from a list and its representation in the source code.
 */
function removeListElement<T>(list: Array<T>, element: T, patcher: Patcher) {
  const index = list.indexOf(element);
  if (index === 0) {
    const next = list[index + 1];
    if (next) {
      patcher.remove(element.start, next.start);
    }
  } else {
    const last = list[index - 1];
    patcher.remove(last.end, element.end);
  }
  list.splice(index, 1);
}

/**
 * Replace a node in a list with null.
 */
function nullifyListElement<T>(list: Array<T>, element: T, patcher: Patcher) {
  const index = list.indexOf(element);
  patcher.remove(element.start, element.end);
  list[index] = null;
}

/**
 * Remove an entire statement and, if it was the only non-whitespace on the
 * line, the whole line.
 */
function removeStatement(node: Object, patcher: Patcher) {
  let { start, end } = node;

  const { original } = patcher;
  let startOfLine = startOfLinePrecedingIndexWithOnlySpaces(original, start);
  let endOfLine = endOfLineSucceedingIndexWithOnlySpaces(original, end);

  if (startOfLine !== null && endOfLine !== null) {
    // There's nothing else on the line, so remove the whole line.
    start = startOfLine;
    end = endOfLine;
  }

  patcher.remove(start, end);

  // FIXME: Somehow remove `node` from its parent to make the AST correct.
  Object.keys(node).forEach(key => delete node[key]);
  node.type = 'EmptyStatement';
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
