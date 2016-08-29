import Query from './query';
import Utils from './Utils';

const CharGenerator = Utils.CharGenerator;

/**
 * For now this function only checks for the exists() constraint.
 * We need to check this manually because the neo4j exists()
 * function only works with the enterprise version.
 *
 * In future purpose maybe I'll add a type system like Sequelize
 */
function _checkProperties(properties) {
  const invalid = this.properties.filter(p => this.schema[p].exists && !properties[p]);

  if (invalid.length) {
    return new Error(`Exists constraint error (NOT NULL for SQL-people).` +
                     `The following fields are not given: ${invalid.join(', ')}`);
  }
}

function _addDefaultProperties(properties) {
  const newProperties = { ...properties };
  const defaultProperties = this.properties.filter(p => this.schema[p].defaultValue && !properties[p]);

  for (const p of defaultProperties) {
    newProperties[p] = this.schema[p].defaultValue();
  }
  return newProperties;
}

function _extractProperties(rawResult) {
  return rawResult.records.map(r => r._fields[0].properties);
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
    _checkProperties = _checkProperties.bind(this);
    _addDefaultProperties = _addDefaultProperties.bind(this);
    _extractProperties = _extractProperties.bind(this);
  }

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

  find(properties) {
    return new Promise((resolve, reject) => {
      const m = CharGenerator.next();
      const query = new Query(this.neo4js);

      query
        .match(m, this.labels, properties)
        .ret(m)
        .execute()
        .then(result => {
          resolve(_extractProperties(result));
        })
        .catch(err => {
          reject(err);
        });
    })
  }

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
          const result = _extractProperties(rawResult);
          if (result.length > 0) {
            resolve(result[0]);
          } else {
            reject(new Error('No node found'));
          }
        })
        .catch(err => {
          reject(err);
        });
    })
  }

  create(properties) {
    return new Promise((resolve, reject) => {
      const errors = _checkProperties(properties);
      if (errors) reject(errors);

      properties = _addDefaultProperties(properties);

      const m = CharGenerator.next();
      const query = new Query(this.neo4js);

      query
        .create(m, this.labels, properties)
        .ret(m)
        .execute()
        .then(rawResult => {
          const result = _extractProperties(rawResult);
          if (result.length > 0) {
            resolve(result[0]);
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
