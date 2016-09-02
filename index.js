//module.exports = require('./lib/neo4js').default;

const Neo4js = require('./lib/neo4js').default;
const neo4js = new Neo4js('neo4j', 'jan95', {
  port: 32700,
  options: {
    rest: {
      port: 32701,
    },
  },
});

const Person = neo4js.define('Person', {
  guid: {
    index: true,
    defaultValue: Neo4js.uuid4,
  },
  name: {
    unique: true,
    exists: true,
  },
  relations: {
    knows: {
      direction: 'any',
      labels: 'knows',
      properties: {
        since: {
          exists: true
        }
      }
    }
  }
});

Person.sync()
  .then(() => {
    console.log('synced');
  })
  .catch(err => {
    console.log(err);
  });
