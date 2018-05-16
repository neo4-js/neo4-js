import { ModelInstance } from "./ModelInstance";

type Optional<T> =
  T extends object
  ? { [P in keyof T]+?: T[P]; }
  : T;
  

export type PropertiesType = {
  [key: string]: StringProperty | NumberProperty | boolean,
};

export type HasManyActions<P, M extends ModelInstance<P>> = {
  get: (
    props?: Optional<P>,
    relationProps?: PropertiesType
  ) => Promise<M[]>,
  update: (
    props?: Optional<P>,
    where?: Optional<P>,
    relationProps?: PropertiesType,
    whereRelationProps?: PropertiesType
  ) => Promise<M[]>,
  create: (
    props: P[],
    relationProps?: PropertiesType
  ) => Promise<M[]>,
  add: (
    instances: M[],
    relationProps?: PropertiesType
  ) => Promise<number>,
  remove: (
    props?: Optional<P>,
    relationProps?: PropertiesType
  ) => Promise<Neo4jResultStats>,
  count: (
    props?: Optional<P>,
    relationProps?: PropertiesType
  ) => Promise<number>,
};

export type HasOneActions<P, M extends ModelInstance<P>> = {
  get: () => Promise<M | null>,
  update: (props: Optional<P>) => Promise<M | null>,
  create: (props: P) => Promise<M>,
  add: (instance: M) => Promise<boolean>,
  remove: () => Promise<Neo4jResultStats>,
  hasOne: () => Promise<boolean>,
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
  nodesCreated: number,
  nodesDeleted: number,
  relationshipsCreated: number,
  relationshipsDeleted: number,
  propertiesSet: number,
  labelsAdded: number,
  labelsRemoved: number,
  indexesAdded: number,
  indexesRemoved: number,
  constraintsAdded: number,
  constraintsRemoved: number,
};
