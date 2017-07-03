// @flow

import neo4js, { Model, ModelInstance } from "./index";
import idx from "idx";
import { relationConnectHelper } from "./utils";
import type { RelationType } from "./Relation";

export type RelationMetaData = {|
  data: {
    relationLabel: string,
    src?: { model: Model<*, *> | (() => Model<*, *>), type: RelationType },
    dest?: { model: Model<*, *> | (() => Model<*, *>), type: RelationType },
  },
  src: {
    hasMany: (model: Model<*, *> | (() => Model<*, *>)) => RelationMetaData,
    hasOne: (model: Model<*, *> | (() => Model<*, *>)) => RelationMetaData,
  },
  dest: {
    hasMany: (model: Model<*, *> | (() => Model<*, *>)) => RelationMetaData,
    hasOne: (model: Model<*, *> | (() => Model<*, *>)) => RelationMetaData,
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
      hasMany: (model: Model<*, *> | (() => Model<*, *>)): RelationMetaData =>
        addData(model, "src", { type: "hasMany", reverse: false }),
      hasOne: (model: Model<*, *> | (() => Model<*, *>)): RelationMetaData =>
        addData(model, "src", { type: "hasOne", reverse: false }),
    },
    dest: {
      hasMany: (model: Model<*, *> | (() => Model<*, *>)): RelationMetaData =>
        addData(model, "dest", { type: "hasMany", reverse: true }),
      hasOne: (model: Model<*, *> | (() => Model<*, *>)): RelationMetaData =>
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
      let srcModel = relation.data[r.dir === "src" ? "dest" : "src"].model;
      if (!(srcModel instanceof Model)) {
        srcModel = srcModel();
      }

      let destModel = relation.data[r.dir].model;
      if (!(destModel instanceof Model)) {
        destModel = destModel();
      }

      if (srcModel && destModel) {
        srcModel.addRelation(
          destModel,
          r.name,
          relation.data.relationLabel,
          relation.data[r.dir].type
        );
      } else {
        relationConnectHelper.relationsToAdd.push({
          srcModel: relation.data[r.dir === "src" ? "dest" : "src"].model,
          destModel: relation.data[r.dir].model,
          propertyName: r.name,
          relationLabel: relation.data.relationLabel,
          relationType: relation.relationType,
        });
      }
      r.added = true;
    }
  }
  relationConnectHelper.lazy = relationConnectHelper.lazy.filter(r => !r.added);
}

function addRelation(
  target: any,
  destModel: Model<*, *> | (() => Model<*, *>),
  name: string,
  relationType: RelationType,
  relationLabel: string,
  tryLazy: boolean = true
) {
  if (!target._relations) {
    target._relations = [];
  }
  target._relations.push({ destModel, name, relationType, relationLabel });

  if (tryLazy) {
    tryLazyRelations();
  }
}

export const hasOne = (
  destModel: Model<*, *> | (() => Model<*, *>),
  relationLabel: string
) => (target: any, name: string, descriptor: any) => {
  descriptor.writable = true;
  addRelation(
    target,
    destModel,
    name,
    { type: "hasOne", any: true },
    relationLabel
  );
};

export const hasMany = (
  destModel: Model<*, *> | (() => Model<*, *>),
  relationLabel: string
) => (target: any, name: string, descriptor: any) => {
  descriptor.writable = true;
  addRelation(
    target,
    destModel,
    name,
    { type: "hasMany", any: true },
    relationLabel
  );
};

function tryLazyModels() {
  for (const r of relationConnectHelper.relationsToAdd) {
    let srcModel = r.srcModel;
    if (!(srcModel instanceof Model)) {
      srcModel = srcModel();
    }

    let destModel = r.destModel;
    if (!(destModel instanceof Model)) {
      destModel = destModel();
    }

    if (srcModel && destModel) {
      srcModel.addRelation(
        destModel,
        r.propertyName,
        r.relationLabel,
        r.relationType
      );
      r.added = true;
    }
  }

  relationConnectHelper.relationsToAdd = relationConnectHelper.relationsToAdd.filter(
    r => !r.added
  );
}

export const model = (model: Model<*, *>) => (target: any, name: string) => {
  if (model) {
    model.modelInstanceClass = target;
    if (target.prototype._relations) {
      for (const t of target.prototype._relations) {
        let destModel = t.destModel;
        if (!(destModel instanceof Model)) {
          destModel = destModel();
        }

        if (destModel) {
          model.addRelation(destModel, t.name, t.relationLabel, t.relationType);
        } else {
          relationConnectHelper.relationsToAdd.push({
            srcModel: model,
            destModel: t.destModel,
            propertyName: t.name,
            relationLabel: t.relationLabel,
            relationType: t.relationType,
          });
        }
      }
    }

    tryLazyModels();
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

export const defaultProps = (props: any) => (target: any, name: string) => {
  if (props) {
    target.prototype._defaultProps = props;
  }
};
