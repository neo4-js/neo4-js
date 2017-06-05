// @flow

import { Model } from "../Model";
import type { RelationType } from "../relation";

class RelationConnectHelper {
  relationsToAdd: {
    srcModel: Model<*, *> | (() => Model<*, *>),
    destModel: Model<*, *> | (() => Model<*, *>),
    propertyName: string,
    relationLabel: string,
    relationType: RelationType,
    added?: boolean,
  }[];

  lazy: any[];

  constructor() {
    this.relationsToAdd = [];
    this.lazy = [];
  }
}

export const relationConnectHelper = new RelationConnectHelper();
