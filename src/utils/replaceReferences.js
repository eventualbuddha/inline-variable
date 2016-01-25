import type { Patcher, Variable } from '../types';

/**
 * Replace all references to a variable with a particular string.
 */
export default function replaceReferences(variable: Variable, replacement: string, patcher: Patcher) {
  variable.references.forEach(reference => {
    if (reference.init) {
      return;
    }

    if (reference.isWrite()) {
      throw new Error(
        `variable \`${variable.name}\` is written to, cannot inline`
      );
    }

    patcher.overwrite(
      reference.identifier.start,
      reference.identifier.end,
      replacement
    );
  });
}
