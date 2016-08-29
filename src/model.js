import Query from './query';
import Utils from './Utils';

/**
 * For now this function only checks for the exists() constraint.
 * We need to check this manually because the neo4j exists()
 * function only works with the enterprise version.
 *
 * In future purpose maybe I'll add a type system like Sequelize
 */
function _checkValues(values) {
  const invalid = this.properties.filter(p => this.schema[p].exists && !values[p]);

  if (invalid.length) {
    return new Error(`Exists constraint error (NOT NULL for SQL-people).
The following fields are not given: ${invalid.join(', ')}`);
  }
}

export default class Model {
  constructor(labels, schema, neo4js) {
    if (!labels.sort) {
      labels = [ labels ];
    }
    this.name = labels.sort().join(',');
    this.labels = labels;
    this.schema = schema;
    this.properties = Object.keys(schema);
    this.neo4js = neo4js;

    // Private functions
    // TODO: find better solution for private functions?
    _checkValues = _checkValues.bind(this);
  }

  sync() {

  }

  findOne(properties) {
    return new Promise((resolve, reject) => {
      const m = (new Utils.CharGenerator()).next;
      const query = new Query(this.neo4js);

      query
        .match(m, this.labels, properties)
        .ret(m)
        .limit(1)
        .execute()
        .then(result => {
          console.log(result);
          resolve(result);
        })
        .catch(err => {
          reject(err);
        });
    })
  }

  create(values) {
    return new Promise((resolve, reject) => {
      const errors = _checkValues(values);
      if (errors) reject(errors);

      const m = (new Utils.CharGenerator()).next;
      const query = new Query(this.neo4js);

      query
        .create(m, this.labels, values)
        .ret(m)
        .execute()
        .then(result => {
          resolve(result.records[0]._fields[0].properties);
        })
        .catch(err => {
          reject(err);
        });
    });
  }
}
