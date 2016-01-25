import type { Binding, Literal, Node, Patcher } from '../types';

/**
 * Build a replacement string for a binding.
 */
export default function buildReplacement({ init, accesses }: Binding, patcher: Patcher): string {
  const initString = init ? patcher.slice(init.start, init.end) : 'undefined';
  return accesses.reduce((replacement, { key, computed }) => {
    const keyString = sourceOf(key, patcher);
    if (computed) {
      return `${replacement}[${keyString}]`;
    } else {
      return `${replacement}.${keyString}`;
    }
  }, needsParens(init) ? `(${initString})` : initString);
}

/**
 * Determines whether a node might need parentheses.
 */
function needsParens(node: ?Node): boolean {
  switch (node && node.type) {
    case 'BinaryExpression':
    case 'SequenceExpression':
      return true;

    default:
      return false;
  }
}

/**
 * Get the source of the given node.
 */
function sourceOf(node: Node, patcher: Patcher): string {
  if (node.start >= 0) {
    return patcher.slice(node.start, node.end);
  } else if (node.type === 'Literal') {
    return node.raw;
  } else {
    throw new Error(`unable to get source of ${node.type} node`);
  }
}
