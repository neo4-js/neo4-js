// @flow

type HasManyActions<Properties, ModelInstance, Labels/*: string*/> = {
  get: (label: Labels, props?: Properties) => Promise<ModelInstance[]>,
  update: (label: Labels, props: Properties, where?: Properties) => Promise<ModelInstance[]>,
  create: (label: Labels, props: Properties[]) => Promise<ModelInstance[]>,
  add: (label: Labels, instances: ModelInstance[]) => Promise<number>,
  remove: (label: Labels, props?: Properties) => Promise<number>,
  count: (label: Labels, props?: Properties) => Promise<number>,
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