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

neo4js.sync({ force: true })
  .catch(err => {
    console.log(err);
  })
  .then(result => {
    return User.create({
        name: 'Jan',
        password: 'jan95',
        email: 'j.schlacher@trisoft.at',
      });
  })
  .then(() => {
    return User.create({
        name: 'Hubert',
        password: 'ubzrbhj',
        email: 'h.alfonsos@trisoft.at',
      });
  })
  .catch(err => {
    console.log(err);
  })
  .then(() => {
    const query = neo4js.Query();
    return query.match('n', 'User')
      .ret('n')
      .execute();
  })
  .then(users => {
    console.log(users.records.map(r => r._fields[0].properties));
  })
  .then(() => {
    const query = neo4js.Query();
    return query.match('n')
      .detach('n')
      .execute();
  })
  .catch(err => {
    console.log(err);
  })
  .then(results => {
    query.match('n')
      .ret('n')
      .execute()
  });

/*
User.findOne({
    name: 'Jan',
  })
  .then(user => {
    console.log(user);
  })
  .catch(err => {
    console.log(err);
  });

User.find({})
  .then(users => {
    console.log(users);
  })
  .catch(err => {
    console.log(err);
  });
*/
