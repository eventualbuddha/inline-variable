export type Variable = {
  name: string,
  defs: Array<Definition>,
  identifiers: Array<Identifier>,
  references: Array<Reference>
};

export type Reference = {
  init: boolean,
  identifier: Identifier,
  isWrite: () => boolean
};

export type Definition = {
  parent: VariableDeclaration
};

export type Node = Object;

export type VariableDeclaration = {
  type: 'VariableDeclaration',
  declarations: Array<VariableDeclarator>,
  start: number,
  end: number
};

export type VariableDeclarator = {
  type: 'VariableDeclarator',
  id: Identifier | ObjectPattern | ArrayPattern,
  init: ?Node,
  start: number,
  end: number
};

export type Identifier = {
  type: 'Identifier',
  name: string,
  start: number,
  end: number
};

export type ObjectPattern = {
  type: 'ObjectPattern',
  properties: Array<Property>,
  start: number,
  end: number
};

export type Property = {
  type: 'Property',
  key: Identifier,
  value: Identifier | ObjectPattern | ArrayPattern,
  computed: boolean,
  start: number,
  end: number
};

export type ArrayPattern = {
  type: 'ArrayPattern',
  elements: Array<?(Identifier | ObjectPattern | ArrayPattern)>,
  start: number,
  end: number
};

export type Binding = {
  id: Identifier,
  accesses: Array<Node>,
  parents: Array<Identifier | Property | ObjectPattern | ArrayPattern | VariableDeclarator | VariableDeclaration>
};

export type Patcher = {
  remove: (start: number, end: number) => Patcher,
  overwrite: (start: number, end: number, content: string) => Patcher,
  slice: (start: number, end: number) => string
};
