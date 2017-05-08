// @flow

type HasManyActions<Properties, ModelInstance, Labels/*: string*/> = {
  get: (props?: Properties, label?: Labels) => Promise<ModelInstance[]>,
  update: (props: Properties, where?: Properties, label?: Labels) => Promise<ModelInstance[]>,
  create: (props: Properties[], label?: Labels) => Promise<ModelInstance[]>,
  add: (instances: ModelInstance[], label?: Labels) => Promise<number>,
  remove: (props?: Properties, label?: Labels) => Promise<number>,
  count: (props?: Properties, label?: Labels) => Promise<number>,
};

type HasOneActions<Properties, ModelInstance, Labels/*: string = ''*/> = {
  get: (label?: Labels) => Promise<ModelInstance | null>,
  update: (props: Properties, label?: Labels) => Promise<ModelInstance | null>,
  create: (props: Properties, label?: Labels) => Promise<ModelInstance>,
  add: (instance: ModelInstance, label?: Labels) => Promise<boolean>,
  remove: (label?: Labels) => Promise<Neo4jResultStats>,
  hasOne: (label?: Labels) => Promise<boolean>,
}

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