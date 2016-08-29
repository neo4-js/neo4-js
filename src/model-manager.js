export default class ModelManager {
  constructor(neo4js) {
    this.models = [];
    this.neo4js = neo4js;
  }

  add(model) {
    this.models.push(model);
    this.neo4js.models[model.name] = model;
    return model;
  }

  remove(model) {
    this.models = this.models.filter(m => m.name !== model.name);

    delete this.neo4js.models[model.name];
  }

  getModel(against, attribute) {
    const model = this.models.find(m => m[attribute] === against);

    return model;
  }

  get all() {
    return this.models;
  }
}
