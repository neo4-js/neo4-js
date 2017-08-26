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
import neo4js, {
  Model,
  ModelInstance,
  src,
  model,
  dest,
  relation,
  defaultProps,
} from "../index";

class PersonModel extends Model {}
const Person = new PersonModel("Person");

class TaskModel extends Model {}
const Task = new TaskModel("Task");

const TaskCreatorRelation = relation("created").src
  .hasMany(Task)
  .dest.hasOne(Person);

const TaskAssigneeRelation = relation("assigned").src
  .hasMany(Task)
  .dest.hasOne(Person);

class PersonInstance extends ModelInstance {}
src(TaskAssigneeRelation, PersonInstance, "assignedTasks");
src(TaskCreatorRelation, PersonInstance, "tasks");
model(Person, PersonInstance);

class TaskInstance extends ModelInstance {
  creator;
}
dest(TaskCreatorRelation, TaskInstance.creator);
defaultProps({ title: "(empty)" }, TaskInstance);
model(Task, TaskInstance);

neo4js.init({
  boltUri: "localhost",
  boltPort: 10001,
});

User.create({ name: "Olaf" })
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
  });
```

