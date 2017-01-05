import Neo4js from '../src/neo4js';

const helper = {
  boltUrl: () => process.env.BOLT_URL || 'bolt://localhost',
  boltPort: () => process.env.BOLT_PORT || 32768,
  restUrl: () => process.env.REST_URL || 'http://localhost',
  restPort: () => process.env.REST_PORT || 32769,
  getNeo4jsInstance: () => {
    return new Neo4js('neo4j', 'knast', {
      url: helper.boltUrl(),
      port: helper.boltPort(),
      rest: {
        url: helper.restUrl(),
        port: helper.restPort(),
      }
    });
  }
};

export default helper;
