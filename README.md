# Neo4-js

[![Build Status](https://travis-ci.org/neo4-js/neo4-js.svg?branch=master)](https://travis-ci.org/neo4-js/neo4-js) [![dependencies Status](https://david-dm.org/neo4-js/neo4-js/status.svg)](https://david-dm.org/janpeter/neo4js) [![devDependencies Status](https://david-dm.org/neo4-js/neo4-js/dev-status.svg)](https://david-dm.org/neo4-js/neo4-js?type=dev) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Neo4-js is a object-graph mapper for JavaScript and neo4j with full TypeScript support. Neo4-js hides repetitive queries such as the basic CRUD operations to the developer. For best development experience use TypeScript to obtain good autocomplete results.

## Usage

With neo4-js you are able to quickly define your data model but maintain complete control over your models. The following code snipped shows how you can work with neo4-js.

```
type PersonProps = {
  name?: StringProperty;
};

type TaskProps = {
  title?: StringProperty;
  done?: boolean;
};

class PersonModel extends Model<PersonProps, PersonInstance> {}
const Person: PersonModel = new PersonModel("Person");

class TaskModel extends Model<TaskProps, TaskInstance> {}
const Task: TaskModel = new TaskModel("Task");

const TaskCreatorRelation = relation
  .from(() => Person)
  .to(() => Task)
  .via("created");

const TaskAssigneeRelation = relation
  .from(Person)
  .to(Task)
  .via("assigned");

@model(Person)
class PersonInstance extends ModelInstance<PersonProps> {
  @hasMany(Task, TaskCreatorRelation)
  tasks: HasManyActions<TaskProps, TaskInstance>;

  @hasMany(Task, TaskAssigneeRelation)
  assignedTasks: HasManyActions<TaskProps, TaskInstance>;
}

@model(Task)
class TaskInstance extends ModelInstance<TaskProps> {
  @hasOne(() => Person, () => TaskCreatorRelation)
  creator: HasOneActions<PersonProps, PersonInstance>;
}

(async () => {
  const paul: PersonInstance = await Person.create({ name: "Paul" });

  const propsArray: TaskProps[] = [
    {
      title: "Buy milk",
    },
    {
      title: "Buy beer",
      done: false,
    },
  ];

  const tasks: TaskInstance[] = await paul.tasks.create(propsArray);
})();
```

## Documentation

The documentation is not completed yet but you'll find the basics on [neo4.js.org](https://neo4.js.org). Any help is very much appreciated!

## Installing

To use neo4-js properly you need to add TypeScript to your project. For now we also install `ts-node` so that we are able to run our code without compiling it manually before running.

```
yarn add -D typescript ts-node
```

I recommend using the following `tsconfig.json` configuration.

```
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "ES6",
    "experimentalDecorators": true,
  }
}
```

You might also install Docker to quickly create a neo4j database without any further installations. For neo4-js I used the following bash script to start a neo4j instance in docker. To run it you might create a scripts directory and add the following to `neo4j-startup.sh`, make sure you can execute the script with `chmod 777 neo4j-startup.sh` (because why not 777 on my local machine :P).

```
# REST PORT: 10000
# BOLT PORT: 10001
echo "docker run -p 10000:7474 -p 10001:7687 --rm --env=NEO4J_AUTH=none neo4j"
docker run -p 10000:7474 -p 10001:7687 --rm --env=NEO4J_AUTH=none neo4j
```

The only runtime dependency you need to start using neo4-js is neo4-js itself.

```
yarn add neo4-js
```

## Built With

* [TypeScript](https://www.typescriptlang.org/) - TypeScript is a typed superset of Javascript that compiles to plain Javascript. 

## Contributing

Feel free to send a pull request or create an issue for bugs or feature requests.

## Authors

* **Jan Schlacher** - *Initial work*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
