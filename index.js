import type { Patcher, Variable } from './types';

import buildReplacement from './utils/buildReplacement';
import getBindingForVariable from './utils/getBindingForVariable';
import removeBinding from './utils/removeBinding';
import replaceReferences from './utils/replaceReferences';

/**
 * Inline all references to a variable by replacing them with its initial value.
 */
export default function inline(variable: Variable, patcher: Patcher) {
  const binding = getBindingForVariable(variable);
  const replacement = buildReplacement(binding, patcher);
  removeBinding(binding, patcher);
  replaceReferences(variable, replacement, patcher);
}

