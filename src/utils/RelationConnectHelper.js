// @flow

import type { RelationType } from "../relation";

class RelationConnectHelper {
  models: { [label: string]: any };
  relationsToAdd: {
    src: any,
    destLabel: string,
    propertyName: string,
    relationLabel: string,
    relationType: RelationType,
  }[];

  lazy: () => any[];

  constructor() {
    this.models = {};
    this.relationsToAdd = [];
    this.lazy = [];
  }
}

export const relationConnectHelper = new RelationConnectHelper();
