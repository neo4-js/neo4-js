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
  constructor(neo4js) {
    this.neo4js = neo4js;
    this.parts = [];
  }

  static runSequence(cmds) {
    return new Promise((resolve, reject) => {
      _runSequenceRecursive(cmds, resolve);
    });
  }

  match(key, labels, properties) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'match',
      { key, labels, properties, },
    ));

    return this;
  }

  createIndex(labels, property) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'create-index',
      { labels, property, },
    ));

    return this;
  }

  dropIndex(labels, property) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'drop-index',
      { labels, property, },
    ));

    return this;
  }

  createConstraint(labels, property, type) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'create-constraint',
      { labels, property, type, },
    ));

    return this;
  }

  dropConstraint(labels, property, type) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'drop-constraint',
      { labels, property, type, },
    ));

    return this;
  }

  create(key, labels, properties) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'create',
      { key, labels, properties, },
    ));

    return this;
  }

  link(relationName, properties) {
    return this.linkRight(relationName, properties);
  }

  linkRight(relationName, properties) {
    this.parts.push(new QueryPart(
      'linkRight',
      { relationName, properties },
    ));

    return this;
  }

  linkLeft(relationName, properties) {
    this.parts.push(new QueryPart(
      'linkLeft',
      { relationName, properties },
    ));

    return this;
  }

  ret(key) {
    this.parts.push(new QueryPart(
      'return',
      { key, },
    ));

    return this;
  }

  limit(n) {
    this.parts.push(new QueryPart(
      'limit',
      { n, },
    ));

    return this;
  }

  delete(key) {
    this.parts.push(new QueryPart(
      'delete',
      { key, },
    ));

    return this;
  }

  detach(key) {
    this.parts.push(new QueryPart(
      'detach',
      { key, },
    ));

    return this;
  }

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
        case 'linkRight':
          cmds.push(`link`);
          break;
        case 'linkLeft':
          cmds.push(`link`);
          break;
      }
    }

    for (let i = 0; i < this.parts.length - 1; i++) {
      if (cmds[i] !== 'link') { continue; }

      const a = this.parts[i - 1].options.key;
      const b = this.parts[i + 1].options.key;
      const link = this.parts[i];

      let paramCmd = '';
      if (link.options.properties) {
        char = CharGenerator.next();
        params[char] = link.options.properties;
        paramCmd = ` { ${char} }`;
      }

      switch (this.parts[i].type) {
        case 'linkRight':
          cmds[i] = cmds[i + 1];
          cmds[i + 1] = `CREATE (${a})-[:${link.options.relationName}${paramCmd}]->(${b})`;
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
    return  this.neo4js.run(cmds.join(' '), params);
  }
}
