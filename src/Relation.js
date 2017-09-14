// @flow

import neo4js, { Model, ModelInstance } from "./index";
import type { relationProperty, lazyModel } from "./Decorators";
import { lazy } from "./utils";
import * as HasMany from "./HasManyRelation";
import * as HasOne from "./HasOneRelation";
import idx from "idx";

export type RelationType = {|
  many: boolean,
  out: ?boolean,
  any: ?boolean,
|};

export class Relation {
  relationType: RelationType;
  src: Model<*, *>;
  dest: lazyModel;
  propertyName: string;
  label: string;
  lazy: relationProperty;

  constructor(src: Model<*, *>, property: relationProperty) {
    this.src = src;
    this.lazy = property;
    if (lazy(property.relation)) {
      this.init();
    }
  }

  /**
   * Initialise all lazy stuff
   */
  init() {
    const property = lazy(this.lazy);
    if (!property) return;

    const relation = lazy(property.relation);
    if (!relation) return;

    const from = lazy(relation.from);
    const to = lazy(relation.to);
    if (!from || !to) return;

    this.relationType = {
      many: property.many,
      out: property.out !== null ? property.out : from === this.src,
      any: property.any,
    };
    this.dest = lazy(from === this.src ? relation.to : relation.from);
    if (!this.dest) return;

    this.propertyName = property.propertyName;
    this.label = relation.via;
    delete this.lazy;
  }

  addFunctionsToInstance<T: ModelInstance<*>>(instance: T): T {
    if (this.lazy) this.init();
    if (this.relationType.many) {
      return this.addHasManyToInstance(instance);
    }
    return this.addHasOneToInstance(instance);
  }

  addHasManyToInstance(instance: ModelInstance<*>): any {
    // $FlowFixMe
    instance[this.propertyName] = {
      get: (props: any, relationProps: any = {}) =>
        HasMany.get.bind(this, instance, this.label, this.relationType)(
          props,
          relationProps
        ),
      update: (
        options: any,
        whereProps: any,
        relationProps: any = {},
        whereRelationProps: any = {}
      ) => {
        const optionsInUse =
          options.props ||
          options.whereProps ||
          options.relationProps ||
          options.whereRelationProps;
        return HasMany.update.bind(
          this,
          instance,
          this.label,
          this.relationType
        )(
          optionsInUse ? options.props : options,
          options.whereProps || whereProps,
          options.relationProps || relationProps,
          options.whereRelationProps || whereRelationProps
        );
      },
      remove: (props: any, relationProps: any = {}) =>
        HasMany.remove.bind(this, instance, this.label, this.relationType)(
          props,
          relationProps
        ),
      create: (props: any, relationProps: any = {}) =>
        HasMany.create.bind(this, instance, this.label, this.relationType)(
          props,
          relationProps
        ),
      add: (instances: any, relationProps: any = {}) =>
        HasMany.add.bind(this, instance, this.label, this.relationType)(
          instances,
          relationProps
        ),
      count: (props: any, relationProps: any = {}) =>
        HasMany.count.bind(this, instance, this.label, this.relationType)(
          props,
          relationProps
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
