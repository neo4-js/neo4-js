# Neo4-js without Babel

It is totally possible to use Neo4-js without a transpiler as Babel. I recommend you use at least node.js v6.4 since this version almost supports most of [es2015](http://node.green/#ES2015) features.

## Installation

```bash
mkdir new-awesome-project
cd new-awesome-project
yarn init
yarn add neo4-js babel-polyfill
touch index.js
```

Now that you initialized a new project, make sure you have a neo4j database instance running. I recommend you have a look at the [neo4j-startup.sh](https://github.com/JanPeter/neo4js/blob/master/scripts/neo4j-startup.sh) script to see how you can easily start a neo4j instance. Within this example I'm going to assume you are using this script, so the neo4j settings will look like the following:

 * Neo4j Bolt-Uri: http://localhost
 * Neo4j Bolt-Port: 10001
 * Neo4j Authentication: none

```javascript
// File: index.js
require("babel-polyfill");
var neo4js = require("neo4-js").default;
var {
  Model,
  ModelInstance,
  model,
  hasMany,
  hasOne,
  extendModelInstance,
  relation,
  defaultProps,
} = require("neo4-js");

class PersonModel extends Model {}
const Person = new PersonModel("Person");

class TaskModel extends Model {}
const Task = new TaskModel("Task");

const TaskCreatorRelation = relation
  .from(Person)
  .to(Task)
  .via("created");

// Lazy initialisation is also possible, in case you don't want
// to mind the order of your schema declaration.
const TaskAssigneeRelation = relation
  .from(() => Person)
  .to(() => Task)
  .via("assigned");

class PersonInstance extends ModelInstance { }
PersonInstance = extendModelInstance(PersonInstance);
PersonInstance.hasMany("assignedTasks", Task, TaskAssigneeRelation);
// Also a possibility of lazy initialisation
PersonInstance.hasMany("tasks", () => Task, () => TaskCreatorRelation);
PersonInstance.model(Person);

class TaskInstance extends ModelInstance { }
TaskInstance = extendModelInstance(TaskInstance);
TaskInstance.hasOne("creator", Person, TaskCreatorRelation);
TaskInstance.hasOne("assignee", Person, TaskAssigneeRelation);
TaskInstance.defaultProps({ title: "(empty)" });
TaskInstance.model(Task);

neo4js.init({
  boltUri: "localhost",
  boltPort: 10001,
});

Person.create({ name: "Olaf" })
  .then(olaf => {
    console.log(olaf);
    return olaf.tasks.create([
      { title: "Buy milk", due: "tomorrow" },
      // Maybe not the best example for a default property :P
      { due: "never" }
    ]);
  })
  .then(tasks => {
    console.log(tasks);
    neo4js.close();
  });
```

