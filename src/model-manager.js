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

  getModel(against, attribute = 'name') {
    return this.models.find(m => {

      let values = m[attribute];
      if (attribute === 'name') {
        values = values.split(',');
      }

      if (Array.isArray(values)) {
        if (Array.isArray(against)) {
          return values.filter(a => against.find(p => p === a)).length === against.length; 
        }
        return values.find(a => a === against);
      }
      return values === against;
    });
  }

  get all() {
    return this.models;
  }
}
