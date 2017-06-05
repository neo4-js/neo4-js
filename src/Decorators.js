// @flow

import neo4js, { Model, ModelInstance } from "./index";
import idx from "idx";
import { relationConnectHelper } from "./utils";
import type { RelationType } from "./Relation";

export type RelationMetaData = {|
  data: {
    relationLabel: string,
    src?: { model: string, type: RelationType },
    dest?: { model: string, type: RelationType },
  },
  src: {
    hasMany: (model: string) => RelationMetaData,
    hasOne: (model: string) => RelationMetaData,
  },
  dest: {
    hasMany: (model: string) => RelationMetaData,
    hasOne: (model: string) => RelationMetaData,
  },
|};

export const relation = (relationLabel: string): RelationMetaData => {
  const addData = (model, direction, type): RelationMetaData => {
    chain.data[direction] = { model, type };
    return chain;
  };

  const chain: RelationMetaData = {
    data: {
      relationLabel,
    },
    src: {
      hasMany: (model: string): RelationMetaData =>
        addData(model, "src", { type: "hasMany", reverse: false }),
      hasOne: (model: string): RelationMetaData =>
        addData(model, "src", { type: "hasOne", reverse: false }),
    },
    dest: {
      hasMany: (model: string): RelationMetaData =>
        addData(model, "dest", { type: "hasMany", reverse: true }),
      hasOne: (model: string): RelationMetaData =>
        addData(model, "dest", { type: "hasOne", reverse: true }),
    },
  };

  return chain;
};

function addDirectedRelation(
  direction: "src" | "dest",
  target: any,
  name: any,
  relation: RelationMetaData | (() => RelationMetaData)
) {
  let rel = relation;
  if (typeof relation === "function") {
    rel = relation();

    if (!rel) {
      relationConnectHelper.lazy.push({
        fn: relation,
        target,
        name,
        dir: direction,
      });
      return;
    }
  }

  if (rel.data[direction]) {
    const { relationLabel } = rel.data;
    const { model, type } = rel.data[direction];
    addRelation(target, model, name, type, relationLabel);
  } else {
    // TODO: link to guide
    throw new Error("Source not set on relation see");
  }
}

export const src = (relation: RelationMetaData | (() => RelationMetaData)) => (
  target: any,
  name: string,
  descriptor: any
) => {
  descriptor.writable = true;
  addDirectedRelation("src", target, name, relation);
};

export const dest = (relation: RelationMetaData | (() => RelationMetaData)) => (
  target: any,
  name: string,
  descriptor: any
) => {
  descriptor.writable = true;
  addDirectedRelation("dest", target, name, relation);
};

function tryLazyRelations() {
  for (const r of relationConnectHelper.lazy) {
    const relation = r.fn();
    if (relation) {
      // Please don't judge me...
      const srcModel =
        relationConnectHelper.models[
          relation.data[r.dir === "src" ? "dest" : "src"].model
        ];
      const destModel =
        relationConnectHelper.models[relation.data[r.dir].model];
      if (srcModel && destModel) {
        srcModel.addRelation(
          destModel,
          r.name,
          relation.relationLabel,
          relation.data[r.dir].type
        );
        r.added = true;
      } else {
        // You should never be here!
        throw new Error(
          "No idea how you did this :( Please create an issue at https://github.com/JanPeter/neo4js/issues thanks!"
        );
      }
    }
  }
  relationConnectHelper.lazy = relationConnectHelper.lazy.filter(r => !r.added);
}

function addRelation(
  target: any,
  destLabel: string,
  name: string,
  relationType: RelationType,
  relationLabel: string,
  tryLazy: boolean = true
) {
  if (!target._relations) {
    target._relations = [];
  }
  target._relations.push({ destLabel, name, relationType, relationLabel });

  if (tryLazy) {
    tryLazyRelations();
  }
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

export const model = (model: Model<*, *>) => (target: any, name: string) => {
  if (model) {
    model.modelInstanceClass = target;
    if (target.prototype._relations) {
      for (const t of target.prototype._relations) {
        const destModel = relationConnectHelper.models[t.destLabel];
        if (destModel) {
          model.addRelation(destModel, t.name, t.relationLabel, t.relationType);
        } else {
          relationConnectHelper.relationsToAdd.push({
            src: model,
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
     * TODO: Add link to guide
     */
    throw new Error(
      "Can't define ModelInstance before Model itself, please reorder your code"
    );
  }
};
