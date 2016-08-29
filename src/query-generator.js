import Utils from './Utils';

export default class QueryGenerator {
  static createIndex(label, property) {
    return `CREATE INDEX ON :${label}(${property})`;
  }

  static dropIndex(label, property) {
    return `DROP INDEX ON :${label}(${property})`;
  }

  static createUnique(label, property) {
    const charGenerator = new Utils.CharGenerator();
    let l = charGenerator.next;
    return `CREATE CONSTRAINT ON (${l}:${label}) ASSERT ${l}.${property} IS UNIQUE`;
  }

  static dropUnique(label, property) {
    const charGenerator = new Utils.CharGenerator();
    let l = charGenerator.next;
    return `DROP CONSTRAINT ON (${l}:${label}) ASSERT ${l}.${property} IS UNIQUE`;
  }

  static createExists(label, property) {
    const charGenerator = new Utils.CharGenerator();
    let l = charGenerator.next;
    return `CREATE CONSTRAINT ON (${l}:${label}) ASSERT exists(${l}.${property})`;
  }

  static dropExists(label, property) {
    const charGenerator = new Utils.CharGenerator();
    let l = charGenerator.next;
    return `DROP CONSTRAINT ON (${l}:${label}) ASSERT exists(${l}.${property})`;
  }

  static deleteAll() {
    return `MATCH (n) DETACH DELETE n`;
  }

  static match(n, labels) {
    return ` MATCH (${n}:${label}, { props }) `;
  }

  static create(n, labels) {
    return `CREATE (${n}:${labels.join(':')}, { props })`;
  }

  static ret(n) {
    return `RETURN ${n}`;
  }
}
