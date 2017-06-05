// @flow

import neo4js, { Model, ModelInstance } from "./index";
import * as HasMany from "./HasManyRelation";
import * as HasOne from "./HasOneRelation";
import idx from "idx";

export type RelationType = {|
  type: "hasMany" | "hasOne",
  reverse?: boolean,
  any?: boolean,
|};

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
