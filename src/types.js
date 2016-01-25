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

export type Binding = {
  id: Identifier,
  init?: Node,
  accesses: Array<{ key: Node, computed: boolean }>,
  parents: Array<Identifier | Property | ObjectPattern | ArrayPattern | VariableDeclarator | VariableDeclaration>
};

export type Patcher = {
  original: string,
  remove: (start: number, end: number) => Patcher,
  overwrite: (start: number, end: number, content: string) => Patcher,
  slice: (start: number, end: number) => string
};

export type Node =
  {
    type: 'ArrayPattern',
    elements: Array<?(ArrayPattern | ObjectPattern | Identifier)>,
    start: number,
    end: number
  }
    |
    {
      type: 'Identifier',
      name: string,
      start: number,
      end: number
    }
    |
    {
      type: 'Literal',
      raw: string,
      value: ?(string | number),
      start: number,
      end: number
    }
    |
    {
      type: 'ObjectPattern',
      properties: Array<Property>,
      start: number,
      end: number
    }
    |
    {
      type: 'Property',
      key: Node,
      value: Identifier | ObjectPattern | ArrayPattern,
      computed: boolean,
      start: number,
      end: number
    }
    |
    {
      type: 'VariableDeclaration',
      declarations: Array<VariableDeclarator>,
      start: number,
      end: number
    }
    |
    {
      type: 'VariableDeclarator',
      id: Identifier | ObjectPattern | ArrayPattern,
      init: Node,
      start: number,
      end: number
    };

export type Identifier = Node;
export type VariableDeclaration = Node;
export type VariableDeclarator = Node;
export type ObjectPattern = Node;
export type Property = Node;
export type Literal = Node;
export type ArrayPattern = Node;

