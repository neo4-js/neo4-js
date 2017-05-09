// @flow

import trineo, { Model, ModelInstance } from "./index";
import * as HasMany from "./HasManyRelation";
import * as HasOne from "./HasOneRelation";
import idx from "idx";

export type RelationType = "hasMany" | "hasOne";

export const hasOne = (model: Model<*, *>, defaultLabel?: string) => (
  target: any,
  name: string
) => {
  if (!target._hasOne) {
    target._hasOne = [];
  }
  target._hasOne.push({ name, model, defaultLabel });
};

export const hasMany = (model: Model<*, *>, defaultLabel?: string) => (
  target: any,
  name: string
) => {
  if (!target._hasMany) {
    target._hasMany = [];
  }
  target._hasMany.push({ name, model, defaultLabel });
};

export const model = (model: Model<*, *>) => (target: any, name: string) => {
  if (target.prototype._hasMany) {
    for (const t of target.prototype._hasMany) {
      model.hasMany(t.model, t.name, t.defaultLabel);
    }
  }
  if (target.prototype._hasOne) {
    for (const t of target.prototype._hasOne) {
      model.hasOne(t.model, t.name, t.defaultLabel);
    }
  }
  target._model = model;
};

export class Relation {
  type: RelationType;
  src: Model<*, *>;
  dest: Model<*, *>;
  propertyName: string;
  defaultLabel: ?string;

  constructor(
    type: RelationType,
    src: Model<*, *>,
    dest: Model<*, *>,
    propertyName: string,
    defaultLabel?: string
  ) {
    this.type = type;
    this.src = src;
    this.dest = dest;
    this.propertyName = propertyName;
    this.defaultLabel = defaultLabel;
  }

  addFunctionsToInstance<T: ModelInstance<*>>(instance: T): T {
    if (this.type === "hasMany") {
      return this.addHasManyToInstance(instance);
    } else if (this.type === "hasOne") {
      return this.addHasOneToInstance(instance);
    }
    return instance;
  }

  addHasManyToInstance(instance: ModelInstance<*>): any {
    const accessors = {
      [this.propertyName]: {
        get: (props: any, label?: string) =>
          HasMany.get.bind(this, instance, label ? label : this.defaultLabel)(
            props
          ),
        update: (newProps: any, props: any, label?: string) =>
          HasMany.update.bind(
            this,
            instance,
            label ? label : this.defaultLabel
          )(newProps, props),
        create: (props: any, label?: string) =>
          HasMany.create.bind(
            this,
            instance,
            label ? label : this.defaultLabel
          )(props),
        add: (instances: any, label?: string) =>
          HasMany.add.bind(this, instance, label ? label : this.defaultLabel)(
            instances
          ),
        count: (props: any, label?: string) =>
          HasMany.count.bind(this, instance, label ? label : this.defaultLabel)(
            props
          ),
      },
    };

    return { ...instance, ...accessors };
  }

  addHasOneToInstance(instance: ModelInstance<*>): any {
    const accessors = {
      [this.propertyName]: {
        get: (label?: string) =>
          HasOne.get.bind(this, instance, label ? label : this.defaultLabel)(),
        update: (props: any, label?: string) =>
          HasOne.update.bind(this, instance, label ? label : this.defaultLabel)(
            props
          ),
        create: (props: any, label?: string) =>
          HasOne.create.bind(this, instance, label ? label : this.defaultLabel)(
            props
          ),
        add: (destInstance: ModelInstance<*>, label?: string) =>
          HasOne.add.bind(this, instance, label ? label : this.defaultLabel)(
            destInstance
          ),
        remove: (label?: string) =>
          HasOne.remove.bind(
            this,
            instance,
            label ? label : this.defaultLabel
          )(),
        hasOne: (label?: string) =>
          HasOne.hasOne.bind(
            this,
            instance,
            label ? label : this.defaultLabel
          )(),
      },
    };

    return { ...instance, ...accessors };
  }
}
