import ModelObject from './model-object';
import Query from './query';
import Utils from './Utils';
import Immutable from 'immutable';

const CharGenerator = Utils.CharGenerator;

export default class Model {
  /*
   * For now this function only checks for the exists() constraint.
   * We need to check this manually because the neo4j exists()
   * function only works with the enterprise version.
   *
   * In future purpose maybe I'll add a type system like Sequelize
   */
  _checkProperties(properties) {
    const invalid = this.properties.filter(p => this.schema[p].exists && !properties[p]);

    if (invalid.length) {
      return new Error(`Exists constraint error (NOT NULL for SQL-people).` +
                       `The following fields are not given: ${invalid.join(', ')}`);
    }
  }

  _addDefaultProperties(properties) {
    const newProperties = { ...properties };
    const defaultProperties = this.properties.filter(p => this.schema[p].defaultValue && !properties[p]);

    for (const p of defaultProperties) {
      newProperties[p] = this.schema[p].defaultValue();
    }
    return newProperties;
  }

  _extractProperties(rawResult) {
    return rawResult.records.map(r => r._fields[0].properties);
  }

  _getRelation(o, rel) {
    const query = new Query(this.neo4js);
    const m = CharGenerator.next();
    const n = CharGenerator.next();

    return query
      .match(m, this.labels, { guid: o.guid })
      .relates(rel.relationLabel)
      .match(n, rel.model.labels)
      .ret(n)
      .execute()
      .then((rawResult) => {
        if (rawResult.signature === 127) {
          throw new Error(rawResult);
        }

        const properties = this._extractProperties(rawResult);
        return properties.map(r => this._createModelObject(r, rel.model));
      });
  }

  _getAllRelations(result) {
    const o = Utils._.cloneDeep(result);
    const relations = {};
    const promises = [];

    for (const rel of this.relations) {
      promises.push(this._getRelation(o, rel)
        .then((result) => {
          Utils._.assign(relations, { [rel.propName]: result });
        }));
    }

    return Promise.all(promises)
      .then(() => {
        Utils._.assign(o, relations);
        return this._createModelObject(o);
      });
  }

  _createModelObject(properties, model) {
    model = model || this;
    const o = new ModelObject();
    o.init(properties, this);
    return o;
  }

  /**
   * @param {String | String[]} labels
   * @param {Object} schema
   * @param {Neo4js} neo4js
   */
  constructor(labels, schema, neo4js) {
    if (!labels.sort) {
      labels = [ labels ];
    }
    this.name = labels.sort().join(',');
    this.labels = labels;
    this.schema = Utils._.cloneDeep(schema);

    this.instanceMethods = this.schema.instanceMethods || {};
    delete schema.instanceMethods;

    this.properties = Object.keys(schema);
    this.neo4js = neo4js;
    this.relations = [];
  }

  /**
   * @returns {Promise}
   */
  sync() {
    return Promise.start()
      .then(() => {
        const cmds = [];
        for (const p of this.properties) {
          const prop = this.schema[p];
          if (prop.index) {
            const query = new Query(this.neo4js);
            cmds.push(query.createIndex(this.labels, p));
          }
          if (prop.unique) {
            const query = new Query(this.neo4js);
            cmds.push(query.createConstraint(this.labels, p, 'unique'));
          }
        }

        return Query.runSequence(cmds);
      });
  }

  /**
   * @param {Object} properties
   * @returns {Promise<ModelObject[]>}
   */
  find(properties) {
    return new Promise((resolve, reject) => {
      const m = CharGenerator.next();
      const query = new Query(this.neo4js);

      query
        .match(m, this.labels, properties)
        .ret(m)
        .execute()
        .then(rawResult => {
          if (rawResult.signature === 127) {
            throw new Error(rawResult);
          }

          let properties = this._extractProperties(rawResult);
          return Promise.all(properties.map(p => this._getAllRelations(p)));
        })
        .then((properties) => {
          resolve(properties.map(r => this._createModelObject(r)));
        })
        .catch(err => {
          reject(err);
        });
    })
  }

  /**
   * @param {Model} model
   * @param {String} propertyName
   * @param {String} relationLabel
   */
  hasMany(model, propName, relationLabel) {
    this.relations.push({
      model,
      propName,
      relationLabel,
      type: 'hasMany',
    });
  }

  /**
   * @param {Model} model
   * @param {String} propertyName
   * @param {String} relationLabel
   */
  belongsTo(model, propName, relationLabel) {
    this.relations.push({
      model,
      propName,
      relationLabel,
      type: 'belongsTo',
    });
  }

  /**
   * @param {Object} properties
   * @returns {Promise<ModelObject>}
   */
  findOne(properties) {
    return new Promise((resolve, reject) => {
      const m = CharGenerator.next();
      const query = new Query(this.neo4js);

      query
        .match(m, this.labels, properties)
        .ret(m)
        .limit(1)
        .execute()
        .then(rawResult => {
          if (rawResult.signature === 127) {
            return reject(rawResult);
          }

          const result = this._extractProperties(rawResult);
          if (result.length > 0) {
            resolve(this._getAllRelations(result[0]));
          } else {
            reject(new Error('No node found'));
          }
        })
        .catch(err => {
          reject(err);
        });
    })
  }

  /**
   * @param {Object} properties
   * @returns {Promise}
   */
  count(properties) {
    return new Promise((resolve, reject) => {
      const m = CharGenerator.next();
      const query = new Query(this.neo4js);

      query
        .match(m, this.labels, properties)
        .ret(`count(${m})`)
        .execute()
        .then(rawResult => {
          resolve(rawResult.records[0]._fields[0].low);
        });
    });
  }

  /**
   * @param {ModelObject} from
   * @param {Object} relation
   * @param {String} relation.relationName
   * @param {Object} relation.properties
   * @param {ModelObject} to
   */
  relate(from, rel, to) {
    return new Promise((resolve, reject) => {
      const a = CharGenerator.next();
      const b = CharGenerator.next();
      const query = new Query(this.neo4js);

      query
        .match(a, this.labels, { guid: from.p.guid })
        .relateRight(rel.relationName, rel.properties)
        .match(b, to.model.labels, { guid: to.p.guid })
        .execute()
        .then(rawResult => {
          if (rawResult.signature === 127) {
            return reject(rawResult);
          }
          return resolve(true);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  /**
   * @param {Object} properties
   * @returns {Promise<ModelObject>}
   */
  create(properties) {
    return new Promise((resolve, reject) => {
      const errors = this._checkProperties(properties);
      if (errors) reject(errors);

      properties = this._addDefaultProperties(properties);

      const m = CharGenerator.next();
      const query = new Query(this.neo4js);

      query
        .create(m, this.labels, properties)
        .ret(m)
        .execute()
        .then(rawResult => {
          if (rawResult.signature === 127) {
            return reject(rawResult);
          }

          const result = this._extractProperties(rawResult);
          if (result.length > 0) {
            resolve(this._createModelObject(result[0]));
          } else {
            reject(new Error('No user inserted'));
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }
}
