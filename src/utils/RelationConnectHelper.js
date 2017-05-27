// @flow

class RelationConnectHelper {
  models: { [label: string]: any };
  relationsToAdd: {
    src: any,
    destLabel: string,
    propertyName: string,
    defaultLabel: string,
    type: "hasMany" | "hasOne",
  }[];

  constructor() {
    this.models = {};
    this.relationsToAdd = [];
  }
}

export const relationConnectHelper = new RelationConnectHelper();
