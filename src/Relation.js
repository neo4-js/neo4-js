// @flow

import trineo, { Model, ModelInstance } from "./index";
import * as HasMany from "./HasManyRelation";
import * as HasOne from "./HasOneRelation";
import idx from "idx";
import { relationConnectHelper } from "./utils";

export type RelationType = "hasMany" | "hasOne";

function addRelation(
  target: any,
  destLabel: string,
  name: string,
  type: RelationType,
  defaultLabel?: string
) {
  if (!target._relations) {
    target._relations = [];
  }
  target._relations.push({ destLabel, name, type, defaultLabel });
}

export const hasOne = (destLabel: string, defaultLabel?: string) => (
  target: any,
  name: string
) => {
  addRelation(target, destLabel, name, "hasOne", defaultLabel);
};

export const hasMany = (destLabel: string, defaultLabel?: string) => (
  target: any,
  name: string
) => {
  addRelation(target, destLabel, name, "hasMany", defaultLabel);
};

export const model = (label: string) => (target: any, name: string) => {
  const m = relationConnectHelper.models[label];
  if (m) {
    if (target.prototype._relations) {
      for (const t of target.prototype._relations) {
        const destModel = relationConnectHelper.models[t.destLabel];
        if (destModel) {
          m[t.type](destModel, t.name, t.defaultLabel);
        } else {
          relationConnectHelper.relationsToAdd.push({
            src: m,
            destLabel: t.destLabel,
            propertyName: t.name,
            defaultLabel: t.defaultLabel,
            type: t.type,
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
