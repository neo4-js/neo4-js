import QueryGenerator from './query-generator';
import QueryPart from './query-part';
import Utils from './Utils';

const CharGenerator = Utils.CharGenerator;

function _makeArray(a) {
  if (!a) {
    return [];
  }

  if (!a.sort) {
    return [ a ];
  }

  return a;
}

function _createMatchCmd(cmds, params, part) {
  const char = CharGenerator.next();
  const { key, labels, properties } = part.options;
  let propCmd = '';
  if (properties) {
    const propKeys = Object.keys(properties);
    propCmd = propKeys.map((p) => `${p}: {${char}}.${p}`).join(', ');
    propCmd = `{${propCmd}}`;
    params[char] = properties;
  }

  let labelsPart = '';
  if (labels.length) {
    labelsPart = `:${labels.join(':')}`;
  }

  cmds.push(`MATCH (${part.options.key}${labelsPart} ${propCmd})`);
}

function _runSequenceRecursive(cmds, resolve, i = 0, results = []) {
  if (i < cmds.length) {
    cmds[i].execute()
      .then(result => {
        results.push({ result });
        _runSequenceRecursive(cmds, resolve, ++i, results);
      })
      .catch(err => {
        results.push({ err });
        _runSequenceRecursive(cmds, resolve, ++i, results);
      });
  } else {
    resolve(results);
  }
}

export default class Query {
  /**
   * @param {Neo4js} neo4js - Instance of Neo4js class
   */
  constructor(neo4js) {
    this.neo4js = neo4js;
    this.parts = [];
  }

  static runSequence(cmds) {
    return new Promise((resolve, reject) => {
      _runSequenceRecursive(cmds, resolve);
    });
  }

  /**
   * @param {String} key - Cypher key to use in statement
   * @param {String | String[]} labels - The label(s) to use
   * @param {Object} properties
   * @returns {Query} The same query instance is returned to chain commands
   */
  match(key, labels, properties) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'match',
      { key, labels, properties, },
    ));

    return this;
  }

  /**
   *
   * @param {String | String[]} labels - The label(s) to user
   * @param {Object} property
   * @returns {Query} The same query instance is returned to chain commands
   */
  createIndex(labels, property) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'create-index',
      { labels, property, },
    ));

    return this;
  }

  /**
   * @param {String | String[]} labels
   * @param {Object} property
   * @returns {Query} The same query instance is returned to chain commands
   */
  dropIndex(labels, property) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'drop-index',
      { labels, property, },
    ));

    return this;
  }

  /**
   * @param {String | String[]} labels
   * @param {Object} property
   * @param {"unique" | "exists"} type
   * @returns {Query} The same query instance is returned to chain commands
   */
  createConstraint(labels, property, type) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'create-constraint',
      { labels, property, type, },
    ));

    return this;
  }

  /**
   * @param {String | String[]} labels
   * @param {Object} property
   * @param {"unique" | "exists"} type
   * @returns {Query} The same query instance is returned to chain commands
   */
  dropConstraint(labels, property, type) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'drop-constraint',
      { labels, property, type, },
    ));

    return this;
  }

  /**
   * @param {String} key
   * @param {String | String[]} labels
   * @param {Object} property
   * @returns {Query} The same query instance is returned to chain commands
   */
  create(key, labels, properties) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'create',
      { key, labels, properties, },
    ));

    return this;
  }

  /**
   * Generates (a)-[:relationName]-(b). TODO: Also generate (a)--(b) if no params given
   * @param {String} relationName
   * @param {Object} properties
   */
  relates(relationName, properties) {
    this.parts.push(new QueryPart(
      'relates',
      { relationName, properties, },
    ));

    return this;
  }

  /**
   * Generates (a)-[:relationName]->(b). TODO: Also generate (a)-->(b) if no params given
   * @param {String} relationName
   * @param {Object} properties
   */
  relatesRight(relationName, properties) {
    this.parts.push(new QueryPart(
      'relates-right',
      { relationName, properties, },
    ));

    return this;
  }

  /**
   * Generates (a)<-[:relationName]-(b). TODO: Also generate (a)<--(b) if no params given
   * @param {String} relationName
   * @param {Object} properties
   */
  relatesLeft(relationName, properties) {
    this.parts.push(new QueryPart(
      'relates-left',
      { relationName, properties, },
    ));

    return this;
  }

  /**
   * Creates a new relation within two nodes. Alias for relateRight().
   * @param {String} relationName
   * @param {Object} properties
   */
  relate(relationName, properties) {
    return this.relateRight(relationName, properties);
  }

  /**
   * Creates a new relation within two nodes. (a)-[:relationName]->(b)
   * @param {String} relationName
   * @param {Object} properties
   */
  relateRight(relationName, properties) {
    this.parts.push(new QueryPart(
      'relate-right',
      { relationName, properties, },
    ));

    return this;
  }

  /**
   * Creates a new relation within two nodes. (a)<-[:relationName]-(b)
   * @param {String} relationName
   * @param {Object} properties
   */
  relateLeft(relationName, properties) {
    this.parts.push(new QueryPart(
      'relate-left',
      { relationName, properties, },
    ));

    return this;
  }

  /**
   * @param {String} key
   * @returns {Query} The same query instance is returned to chain commands
   */
  ret(key) {
    this.parts.push(new QueryPart(
      'return',
      { key, },
    ));

    return this;
  }

  /**
   * @param {Int} n
   * @returns {Query} The same query instance is returned to chain commands
   */
  limit(n) {
    this.parts.push(new QueryPart(
      'limit',
      { n, },
    ));

    return this;
  }

  /**
   * @param {String} key
   * @returns {Query} The same query instance is returned to chain commands
   */
  delete(key) {
    this.parts.push(new QueryPart(
      'delete',
      { key, },
    ));

    return this;
  }

  /**
   * @param {String} key
   * @returns {Query} The same query instance is returned to chain commands
   */
  detach(key) {
    this.parts.push(new QueryPart(
      'detach',
      { key, },
    ));

    return this;
  }

  /**
   * @returns {Promise}
   */
  execute() {
    const cmds = [];
    const params = {};
    let char;
    for (const part of this.parts) {
      switch (part.type) {
        case 'create':
          char = CharGenerator.next();
          cmds.push(`CREATE (${part.options.key}:${part.options.labels.join(':')} { ${char} })`);
          params[char] = part.options.properties;
          break;
        case 'create-index':
          cmds.push(`CREATE INDEX ON :${part.options.labels.join(':')}(${part.options.property})`);
          break;
        case 'create-constraint':
          char = CharGenerator.next();
          if (part.options.type === 'unique') {
            cmds.push(`CREATE CONSTRAINT ON (${char}:${part.options.labels.join(':')}) ASSERT ${char}.${part.options.property} IS UNIQUE`);
          }
          break;
        case 'drop-index':
          cmds.push(`DROP INDEX ON :${part.options.labels.join(':')}(${part.options.property})`);
          break;
        case 'drop-constraint':
          char = CharGenerator.next();
          if (part.options.type === 'unique') {
            cmds.push(`DROP CONSTRAINT ON (${char}:${part.options.labels.join(':')}) ASSERT ${char}.${part.options.property} IS UNIQUE`);
          }
          break;
        case 'match':
          _createMatchCmd(cmds, params, part);
          break;
        case 'relate-right':
        case 'relate-left':
        case 'relates':
        case 'relates-right':
        case 'relates-left':
          cmds.push(`relation`);
          break;
      }
    }

    for (let i = 0; i < this.parts.length - 1; i++) {
      if (cmds[i] !== 'relation') { continue; }

      const a = this.parts[i - 1].options.key;
      const b = this.parts[i + 1].options.key;
      const relation = this.parts[i];

      let paramCmd = '';
      if (relation.options.properties) {
        char = CharGenerator.next();
        params[char] = relation.options.properties;
        paramCmd = ` { ${char} }`;
      }

      switch (this.parts[i].type) {
        case 'relate-right':
          cmds[i] = cmds[i + 1];
          cmds[i + 1] = `CREATE (${a})-[:${relation.options.relationName}${paramCmd}]->(${b})`;
          break;
        case 'relate-left':
          cmds[i] = cmds[i + 1];
          cmds[i + 1] = `CREATE (${a})<-[:${relation.options.relationName}${paramCmd}]-(${b})`;
          break;
        case 'relates':
          cmds[i] = cmds[i + 1];
          cmds[i + 1] = `MATCH (${a})-[:${relation.options.relationName}${paramCmd}]-(${b})`;
          break;
        case 'relates-right':
          cmds[i] = cmds[i + 1];
          cmds[i + 1] = `MATCH (${a})-[:${relation.options.relationName}${paramCmd}]->(${b})`;
          break;
        case 'relates-left':
          cmds[i] = cmds[i + 1];
          cmds[i + 1] = `MATCH (${a})<-[:${relation.options.relationName}${paramCmd}]-(${b})`;
          break;
      }
    }

    const del = this.parts.find(p => p.type === 'delete');
    const detach = this.parts.find(p => p.type === 'detach');
    if (detach) {
      cmds.push(`DETACH DELETE ${detach.options.key}`);
    } else if (del) {
      cmds.push(`DELETE ${del.options.key}`);
    }

    const returns = this.parts.filter(p => p.type === 'return');
    if (returns.length) {
      cmds.push(`RETURN ${returns.map(r => r.options.key).join(',')}`);
    }

    const limit = this.parts.find(p => p.type === 'limit');
    if (limit) {
      cmds.push(`LIMIT ${limit.options.n}`);
    }

    this.parts = [];
    return this.neo4js.run(cmds.join(' '), params);
  }
}
