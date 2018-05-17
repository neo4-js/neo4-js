// @flow

import neo4js, { Model, ModelInstance } from "./index";
import { connectHelper } from "./utils";
import { RelationType } from "./Relation";
import { HasManyActions, HasOneActions } from "./types";

export type lazyModel<P, M extends ModelInstance<P>> =
  | Model<P, M>
  | (() => Model<P, M> | null);

export type metaRelation = {
  from: lazyModel<any, any>;
  to: lazyModel<any, any>;
  via: string;
};

export type lazyMetaRelation = metaRelation | (() => metaRelation | null);

export type relationProperty = {
  dest: lazyModel<any, any>;
  relation: lazyMetaRelation;
  out?: boolean;
  any?: boolean;
  propertyName: string;
  many: boolean;
};

export const relation = {
  from: <P1, M1 extends ModelInstance<P1>>(from: lazyModel<P1, M1>) => {
    return {
      to: <P2, M2 extends ModelInstance<P2>>(to: lazyModel<P2, M2>) => {
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
  return <P, M extends ModelInstance<P>>(
    model: lazyModel<P, M>,
    relation: lazyMetaRelation,
    direction?: "in" | "out" | "any"
  ) => (target: any, key: string) => {
    //if (descriptor) descriptor.writable = true;

    if (!target._relations) target._relations = [];
    target._relations.push({
      dest: model,
      relation,
      out: direction ? direction === "out" : null,
      any: direction ? direction === "any" : null,
      propertyName: key,
      many,
    });
  };
}

export const hasMany = connectRelationToProp(true);
export const hasOne = connectRelationToProp(false);

export const model = <P, M extends ModelInstance<P>>(
  model: lazyModel<P, M>
) => (target: any) => {
  connectHelper.models.push({
    model,
    relations: target.prototype._relations,
    modelInstance: target,
  });
  connectHelper.tryInject();
};

export const defaultProps = (props: any) => {
  return (target: any) => {
    if (props) {
      target.prototype._defaultProps = props;
    }
  };
};

export function extendModelInstance<P, M extends ModelInstance<P>>(
  instance: new () => M
): new () => M {
  const i: any = instance;
  i.hasMany = (propertyName, ...args) =>
    // @ts-ignore
    hasMany(...args)(instance.prototype, propertyName, null);
  i.hasOne = (propertyName, ...args) =>
    // @ts-ignore
    hasOne(...args)(instance.prototype, propertyName, null);
  // @ts-ignore
  i.model = (...args) => model(...args)(instance, "");
  // @ts-ignore
  i.defaultProps = (...args) => defaultProps(...args)(instance, "");

  return i;
}
