import Query from './query';
import Utils from './Utils';

const CharGenerator = Utils.CharGenerator;

export default class ModelObject {
  constructor() { }

  /**
   * @param {Object} properties
   * @param {Model} model
   */
  init(properties, model) {
    this.model = model;
    Object.assign(this, properties);
    this.p = properties;

    for(let i in model.instanceMethods) {
      this[i] = model.instanceMethods[i].bind(this);
    }
  }

  /**
   * @param {String} relationName
   * @param {Object} properties
   * @returns {ModelObject}
   */
  relate(relationName, properties) {
    this.buf = { relationName, properties };
    return this;
  }

  /**
   * @param {ModelObject} to - Object to relate to
   * @returns {Promise<Boolean>} Returns if the db query worked or not
   */
  to(o) {
    const buf = this.buf;
    delete this.buf;
    return this.model.relate(this, buf, o);
  }
}
