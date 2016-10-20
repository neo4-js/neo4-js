# Installation

Install it via npm

    npm install --save neo4-js

# Usage

Use it via models

    var Neo4js = require('Neo4-js');

    const neo4js = new Neo4js('neo4j', 'neo4j');
    const User = neo4js.define('User', {
      guid: {
        index: true,
        defaultValue: Neo4js.uuid4,
      },
      name: {
        unique: true,
        exists: true,
      },
      email: {
        unqiue: true,
      },
    });

    User.create({ name: 'John', email: 'john@example.com' })
      .then((createdUser) => {
        console.log(createdUser);
      })
      .catch((err) => {
        console.log(err);
      });

Use relations

    var Neo4js = require('Neo4-js');

    const neo4js = new Neo4js('neo4j', 'neo4j');
    const User = neo4js.define('User', {
      guid: {
        index: true,
        defaultValue: Neo4js.uuid4,
      },
      name: {
        unique: true,
        exists: true,
      },
      email: {
        unqiue: true,
      },
    });

    const Task = neo4js.define('Task', {
      guid: {
        index: true,
        defaultValue: Neo4js.uuid4,
      },
      title: {
        exists: true,
      },
    });

    User.hasMany(Task, 'tasks');
    Task.belongsTo(User, 'user');

    User.create({ name: 'John' })
      .then((result) => {
        john = result;
        return Task.create({ title: 'Buy milk' });
      })
      .then((newTask) => {
        return john
          .relate('does')
          .to(newTask)
          .then(result => {
            return Person.find();
          })
          .then(persons => {
            persons.forEach(person => {
              console.log(person.p.tasks);
            })
          });
      });

Use it via queries

    var Neo4js = require('Neo4-js');

    const neo4js = new Neo4js('neo4j', 'neo4j');
    const query = neo4js.Query();

    query
      .match('n', ['User'], { name: 'John' })
      .ret('n')
      .limit(1)
      .execute()
      .then((rawResult) => {
        console.log(rawResult);
      })
      .catch((err) => {
        console.log(err);
      });

Run cypher queries directly

    var Neo4js = require('Neo4-js');

    const neo4js = Neo4js('neo4j', 'neo4j');
    neo4js.run("MATCH (a:Person { name: 'John' })-[:KNOWS]-(b:Person) RETURN b")
      .then((rawResult) => {
        console.log(rawResult);
      })
      .catch((err) => {
        console.log(err);
      });

# Roadmap

[Trello Board](https://trello.com/b/wvCHHEcc/roadmap)

# Docs

[Rudimentary docs](https://janpeter.github.io/neo4js/)
