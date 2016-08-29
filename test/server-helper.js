import Neo4js from '../src/neo4js';

const helper = {
  boltPort: () => {
    return process.env.BOLT_PORT || 32700;
  },
  restPort: () => {
    return process.env.REST_PORT || 32701;
  },
  getNeo4jsInstance: () => {
    return new Neo4js('neo4j', 'jan95', {
      port: helper.boltPort(),
      rest: {
        port: helper.restPort(),
      }
    });
  }
};

export default helper;
