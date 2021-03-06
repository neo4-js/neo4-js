import { Model } from "../Model";
import { ModelInstance } from "../ModelInstance";
import { lazyModel, relationProperty } from "../Decorators";
import { Relation } from "../Relation";
import { lazy } from "./index";

export class ConnectHelper {
  models: {
    model: lazyModel<any, any>;
    modelInstance: new () => ModelInstance<any>;
    relations: relationProperty[];
  }[];

  constructor() {
    this.models = [];
  }

  tryInject() {
    const buf = [];

    this.models.forEach(m => {
      const model: Model<any, any> = lazy(m.model);
      if (model) {
        // @ts-ignore
        model.modelInstanceClass = m.modelInstance;
        if (m.relations) {
          // @ts-ignore
          model.relations = m.relations.map(r => new Relation(model, r));
        }
      } else {
        buf.push(m);
      }
    });

    this.models = buf;
  }
}

export const connectHelper = new ConnectHelper();
