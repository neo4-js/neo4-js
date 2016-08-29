import QueryGenerator from './query-generator';
import QueryPart from './query-part';
import Utils from './Utils';

function _makeArray(a) {
  if (!a.sort) {
    return [ a ];
  }
  return a;
}

export default class Query {
  constructor(neo4js) {
    this.neo4js = neo4js;
    this.parts = [];
  }

  match(key, labels, properties) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'match',
      {
        key,
        labels,
        properties,
      },
    ));

    return this;
  }

  create(key, labels, properties) {
    labels = _makeArray(labels);

    this.parts.push(new QueryPart(
      'create',
      {
        key,
        labels,
        properties,
      }
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
      { key }
    ));
    return this;
  }

  limit(n) {
    this.parts.push(new QueryPart(
      'limit',
      { n },
    ));
    return this;
  }

  execute() {
    const charGenerator = new Utils.CharGenerator('params');
    const cmds = [];
    const params = {};
    let paramsChar;
    for (const part of this.parts) {
      switch (part.type) {
        case 'create':
          paramsChar = charGenerator.next;
          cmds.push(`CREATE (${part.options.key}:${part.options.labels.join(':')} { ${paramsChar} })`);
          params[paramsChar] = part.options.properties;
          break;
        case 'match':
          paramsChar = charGenerator.next;
          cmds.push(`MATCH (${part.options.key}:${part.options.labels.join(':')} { ${paramsChar} })`);
          params[paramsChar] = part.options.properties;
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
          paramsChar = charGenerator.next;
          params[paramsChar] = link.options.properties;
          paramCmd = ` { ${paramsChar} }`;
      }

      switch (this.parts[i].type) {
        case 'linkRight':
          cmds[i] = cmds[i + 1];
          cmds[i + 1] = `CREATE (${a})-[:${link.options.relationName}${paramCmd}]->(${b})`;
          break;
      }
    }

    const returns = this.parts.filter(p => p.type === 'return');
    if (returns.length) {
      cmds.push(`RETURN ${returns.map(r => r.options.key).join(',')}`);
    }

    const limit = this.parts.find(p => p.type === 'limit');
    if (limit) {
      cmds.push(`LIMIT ${limit.options.n}`);
    }

    console.log(cmds.join(' '), params);
    return this.neo4js.run(cmds.join(' '), params);
  }
}
