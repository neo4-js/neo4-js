import { ModelInstance, BaseProps } from "./ModelInstance";

export type Optional<T> = T extends object ? { [P in keyof T]+?: T[P] } : T;

export type Property<T> = T extends string
  ? StringProperty
  : (T extends number ? NumberProperty : T);

export type PropertiesType<T> = T extends object
  ? { [P in keyof T]: Property<T[P]> }
  : T;

export type HasManyActions<P, M extends ModelInstance<P, R>, R = {}> = {
  get: (
    props?: Optional<PropertiesType<P & BaseProps>>,
    relationProps?: Optional<PropertiesType<R>>
  ) => Promise<M[]>;
  update: (
    props?: Optional<P>,
    where?: Optional<PropertiesType<P & BaseProps>>,
    relationProps?: PropertiesType<Optional<R>>,
    whereRelationProps?: Optional<PropertiesType<PropertiesType<R>>>
  ) => Promise<M[]>;
  create: (props: P[] | P, relationProps?: R) => Promise<M[]>;
  add: (instances: M[] | M, relationProps?: R) => Promise<number>;
  remove: (
    props?: Optional<PropertiesType<P & BaseProps>>,
    relationProps?: Optional<PropertiesType<R>>
  ) => Promise<Neo4jResultStats>;
  count: (
    props?: Optional<PropertiesType<P & BaseProps>>,
    relationProps?: Optional<PropertiesType<R>>
  ) => Promise<number>;
};

export type HasOneActions<P, M extends ModelInstance<P>> = {
  get: () => Promise<M | null>;
  update: (props: Optional<P>) => Promise<M | null>;
  create: (props: P) => Promise<M>;
  add: (instance: M) => Promise<boolean>;
  remove: () => Promise<Neo4jResultStats>;
  hasOne: () => Promise<boolean>;
};

export type StringProperty =
  | { $sw: string }
  | { $ew: string }
  | { $contains: string }
  | { $reg: string }
  | { $eq: string }
  | { $or: StringProperty[] }
  | { $and: StringProperty[] }
  | { $in: string[] }
  | { $not: StringProperty }
  | string;

export type NumberProperty =
  | { $gt: number }
  | { $gte: number }
  | { $lt: number }
  | { $lte: number }
  | { $eq: number }
  | { $or: NumberProperty[] }
  | { $and: NumberProperty[] }
  | { $between: [number, number] }
  | { $in: number[] }
  | { $not: NumberProperty }
  | number;

export type Neo4jResultStats = {
  nodesCreated: number;
  nodesDeleted: number;
  relationshipsCreated: number;
  relationshipsDeleted: number;
  propertiesSet: number;
  labelsAdded: number;
  labelsRemoved: number;
  indexesAdded: number;
  indexesRemoved: number;
  constraintsAdded: number;
  constraintsRemoved: number;
};
