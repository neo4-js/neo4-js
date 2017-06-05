// @flow

type HasManyActions<Properties, ModelInstance> = {
  get: (props?: Properties) => Promise<ModelInstance[]>,
  update: (props: Properties, where?: Properties) => Promise<ModelInstance[]>,
  create: (props: Properties[]) => Promise<ModelInstance[]>,
  add: (instances: ModelInstance[]) => Promise<number>,
  remove: (props?: Properties) => Promise<number>,
  count: (props?: Properties) => Promise<number>,
};

type HasOneActions<Properties, ModelInstance> = {
  get: () => Promise<ModelInstance | null>,
  update: (props: Properties) => Promise<ModelInstance | null>,
  create: (props: Properties) => Promise<ModelInstance>,
  add: (instance: ModelInstance) => Promise<boolean>,
  remove: () => Promise<Neo4jResultStats>,
  hasOne: () => Promise<boolean>,
}

type StringProperty =
  { $sw: string }
| { $ew: string }
| { $contains: string }
| { $reg: string }
| { $eq: string }
| { $in: string[] }
| { $not: StringProperty }
| string;

type NumberProperty =
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

type Neo4jResultStats = {
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