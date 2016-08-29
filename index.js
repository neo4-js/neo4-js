import Neo4js from './src/neo4js';

const neo4js = new Neo4js('neo4j', 'jan95', {
  port: 32700,
  rest: {
    port: 32701,
  }
});

neo4js.getSchemaInfo()
  .then(schemaInfo => {
    //console.log(schemaInfo);
  });

const User = neo4js.define('User', {
  guid: {
    defaultValue: Neo4js.uuid4,
    index: true,
  },
  name: {
    unique: true,
    exists: true,
  },
  password: {
    exists: true,
  },
  email: {
    unique: true,
    exists: true,
  }
});

User.create({
    name: 'Jan',
    password: 'jan95',
    email: 'j.schlacher@trisoft.at',
  })
  .then(newUser => {
    console.log(newUser);
  })
  .catch(err => {
    console.log(err);
  });

User.findOne({
    name: 'Jan',
  })
  .then(user => {
    console.log(user);
  })
  .catch(err => {
    console.log(err);
  });
