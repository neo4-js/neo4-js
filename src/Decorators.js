// @flow

import neo4js, { Model, ModelInstance } from "./index";
import idx from "idx";
import { connectHelper } from "./utils";
import type { RelationType } from "./Relation";

export type lazyModel = Model<*, *> | (() => Model<*, *>);

export type metaRelation = {
  from: lazyModel,
  to: lazyModel,
  via: string,
};

export type lazyMetaRelation = metaRelation | (() => metaRelation);

export type relationProperty = {
  dest: lazyModel,
  relation: lazyMetaRelation,
  out: ?boolean,
  any: ?boolean,
  propertyName: string,
  many: boolean,
};

export const relation = {
  from: (from: lazyModel) => {
    return {
      to: (to: lazyModel) => {
        return {
          via: (via: string): metaRelation => {
            return {
              from,
              to,
              via,
            };
          },
        };
      },
    };
  },
};

function connectRelationToProp(many: boolean) {
  return (
    model: lazyModel,
    relation: lazyMetaRelation,
    direction?: "in" | "out" | "any"
  ) => (target: any, name: string, descriptor: any) => {
    if (descriptor) descriptor.writable = true;

    if (!target._relations) target._relations = [];
    target._relations.push({
      dest: model,
      relation,
      out: direction ? direction === "out" : null,
      any: direction ? direction === "any" : null,
      propertyName: name,
      many,
    });
  };
}

export const hasMany = connectRelationToProp(true);
export const hasOne = connectRelationToProp(false);

export const model = (model: lazyModel) => (target: any, name: string) => {
  connectHelper.models.push({
    model,
    relations: target.prototype._relations,
    modelInstance: target,
  });
  connectHelper.tryInject();
};

export const defaultProps = (props: any) => {
  return (target: any, name: string) => {
    if (props) {
      target.prototype._defaultProps = props;
    }
  };
};

// Trust me flow, I know that's now optimal...I'm not happy either...
export function extendModelInstance<T: ModelInstance<*>>(
  instance: Class<T>
): Class<T> {
  // $FlowFixMe
  instance.hasMany = (propertyName, ...args) =>
    hasMany(...args)(instance.prototype, propertyName, null);
  // $FlowFixMe
  instance.hasOne = (propertyName, ...args) =>
    hasOne(...args)(instance.prototype, propertyName, null);
  // $FlowFixMe
  instance.model = (...args) => model(...args)(instance, "");
  // $FlowFixMe
  instance.defaultProps = (...args) => defaultProps(...args)(instance, "");

  // $FlowFixMe
  return instance;
}
