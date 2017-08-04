// @flow

declare type HasManyActions<Properties, ModelInstance> = {
  get: (props?: Properties, relationProps?: { [key: string]: string | number }) => Promise<ModelInstance[]>,
  update: (props: Properties, where?: Properties, relationProps?: { [key: string]: string | number }) => Promise<ModelInstance[]>,
  create: (props: Properties[], relationProps?: { [key: string]: string | number }) => Promise<ModelInstance[]>,
  add: (instances: ModelInstance[], relationProps?: { [key: string]: string | number }) => Promise<number>,
  remove: (props?: Properties, relationProps?: { [key: string]: string | number }) => Promise<number>,
  count: (props?: Properties, relationProps?: { [key: string]: string | number }) => Promise<number>,
};

declare type HasOneActions<Properties, ModelInstance> = {
  get: () => Promise<ModelInstance | null>,
  update: (props: Properties) => Promise<ModelInstance | null>,
  create: (props: Properties) => Promise<ModelInstance>,
  add: (instance: ModelInstance) => Promise<boolean>,
  remove: () => Promise<Neo4jResultStats>,
  hasOne: () => Promise<boolean>,
}

declare type StringProperty =
  { $sw: string }
| { $ew: string }
| { $contains: string }
| { $reg: string }
| { $eq: string }
| { $or: StringProperty[] }
| { $and: StringProperty[] }
| { $in: string[] }
| { $not: StringProperty }
| string;

declare type NumberProperty =
  { $gt: number }
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

declare type Neo4jResultStats = {
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
}