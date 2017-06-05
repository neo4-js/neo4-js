// @flow

import trineo, { Model, ModelInstance } from "./index";
import * as HasMany from "./HasManyRelation";
import * as HasOne from "./HasOneRelation";
import idx from "idx";
import { relationConnectHelper } from "./utils";

export type RelationType = {|
  type: "hasMany" | "hasOne",
  reverse?: boolean,
  any?: boolean,
|};

export const relation = (relationLabel: string) => {
  const addData = (model, direction, type) => {
    chain.data[direction] = { model, type };
    return chain;
  };

  const chain = {
    data: {},
    relationLabel,
    src: {
      hasMany: (model: string) =>
        addData(model, "src", { type: "hasMany", reverse: false }),
      hasOne: (model: string) =>
        addData(model, "src", { type: "hasOne", reverse: false }),
    },
    dest: {
      hasMany: (model: string) =>
        addData(model, "dest", { type: "hasMany", reverse: true }),
      hasOne: (model: string) =>
        addData(model, "dest", { type: "hasOne", reverse: true }),
    },
  };

  return chain;
};

export const src = (relation: any) => (
  target: any,
  name: string,
  descriptor: any
) => {
  descriptor.writable = true;
  const { model, type } = relation.data.src;
  addRelation(target, model, name, type, relation.relationLabel);
};

export const dest = (relation: any) => (
  target: any,
  name: string,
  descriptor: any
) => {
  descriptor.writable = true;
  const { model, type } = relation.data.dest;
  addRelation(target, model, name, type, relation.relationLabel);
};

function addRelation(
  target: any,
  destLabel: string,
  name: string,
  relationType: RelationType,
  relationLabel: string
) {
  if (!target._relations) {
    target._relations = [];
  }
  target._relations.push({ destLabel, name, relationType, relationLabel });
}

export const hasOne = (destLabel: string, relationLabel: string) => (
  target: any,
  name: string,
  descriptor: any
) => {
  descriptor.writable = true;
  addRelation(
    target,
    destLabel,
    name,
    { type: "hasOne", any: true },
    relationLabel
  );
};

export const hasMany = (destLabel: string, relationLabel: string) => (
  target: any,
  name: string,
  descriptor: any
) => {
  descriptor.writable = true;
  addRelation(
    target,
    destLabel,
    name,
    { type: "hasMany", any: true },
    relationLabel
  );
};

export const model = (label: string) => (target: any, name: string) => {
  const m = relationConnectHelper.models[label];
  m.modelInstanceClass = target;
  if (m) {
    if (target.prototype._relations) {
      for (const t of target.prototype._relations) {
        const destModel = relationConnectHelper.models[t.destLabel];
        if (destModel) {
          m.addRelation(destModel, t.name, t.relationLabel, t.relationType);
        } else {
          relationConnectHelper.relationsToAdd.push({
            src: m,
            destLabel: t.destLabel,
            propertyName: t.name,
            relationLabel: t.relationLabel,
            relationType: t.relationType,
          });
        }
      }
    }
  } else {
    /**
     * The ModelInstance got called before the model was defined!
     */
    throw new Error("Can't define ModelInstance before Model itself");
  }
};

export class Relation {
  relationType: RelationType;
  src: Model<*, *>;
  dest: Model<*, *>;
  propertyName: string;
  label: string;

  constructor(
    relationType: RelationType,
    src: Model<*, *>,
    dest: Model<*, *>,
    propertyName: string,
    label: string
  ) {
    this.relationType = relationType;
    this.src = src;
    this.dest = dest;
    this.propertyName = propertyName;
    this.label = label;
  }

  addFunctionsToInstance<T: ModelInstance<*>>(instance: T): T {
    if (this.relationType.type === "hasMany") {
      return this.addHasManyToInstance(instance);
    } else if (this.relationType.type === "hasOne") {
      return this.addHasOneToInstance(instance);
    }
    return instance;
  }

  addHasManyToInstance(instance: ModelInstance<*>): any {
    // $FlowFixMe
    instance[this.propertyName] = {
      get: (props: any) =>
        HasMany.get.bind(this, instance, this.label, this.relationType)(props),
      update: (newProps: any, props: any) =>
        HasMany.update.bind(this, instance, this.label, this.relationType)(
          newProps,
          props
        ),
      create: (props: any) =>
        HasMany.create.bind(this, instance, this.label, this.relationType)(
          props
        ),
      add: (instances: any) =>
        HasMany.add.bind(this, instance, this.label, this.relationType)(
          instances
        ),
      count: (props: any) =>
        HasMany.count.bind(this, instance, this.label, this.relationType)(
          props
        ),
    };

    return instance;
  }

  addHasOneToInstance(instance: ModelInstance<*>): any {
    // $FlowFixMe
    instance[this.propertyName] = {
      get: () =>
        HasOne.get.bind(this, instance, this.label, this.relationType)(),
      update: (props: any, label?: string) =>
        HasOne.update.bind(this, instance, this.label, this.relationType)(
          props
        ),
      create: (props: any, label?: string) =>
        HasOne.create.bind(this, instance, this.label, this.relationType)(
          props
        ),
      add: (destInstance: ModelInstance<*>, label?: string) =>
        HasOne.add.bind(this, instance, this.label, this.relationType)(
          destInstance
        ),
      remove: (label?: string) =>
        HasOne.remove.bind(this, instance, this.label, this.relationType)(),
      hasOne: (label?: string) =>
        HasOne.hasOne.bind(this, instance, this.label, this.relationType)(),
    };

    return instance;
  }
}
