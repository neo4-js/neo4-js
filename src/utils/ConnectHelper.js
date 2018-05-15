// @flow

import { Model } from "../Model";
import { ModelInstance } from "../ModelInstance";
import type { lazyModel, relationProperty } from "../Decorators";
import { Relation } from "../Relation";
import { lazy } from "./index";

class ConnectHelper {
  models: {
    model: lazyModel,
    modelInstance: Class<ModelInstance<*>>,
    relations: relationProperty[],
  }[];

  constructor() {
    this.models = [];
  }

  tryInject() {
    const buf = [];

    this.models.forEach(m => {
      // $FlowFixMe
      const model: Model<*, *> = lazy(m.model);
      if (model) {
        model.modelInstanceClass = m.modelInstance;
        if (m.relations) {
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
