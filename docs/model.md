# Model

The model creates the basic CRUD operations for you. With custom Model classes you can add hooks to the model, e.g. if you want to hash the password of a user before creating one, you can create a `beforeCreate` method on your custom Model as explained in the [hooks](#hooks) section.

## Model methods

* [`create(props)`](#create)
* [`findByGuid(guid)`](#findbyguid)
* [`delete(props)`](#delete)
* [`find(props)`](#find)
* [`findOne(props)`](#findOne)
* [`update(props, newProps)`](#update)

## Hook methods

* [`beforeCreate(props)`](#beforecreate)
* [`afterCreate(instance)`](#aftercreate)
* [`beforeFind(props)`](#beforefind)
* [`afterFind(instance)`](#afterfind)
* [`beforeUpdate(props, newProps)`](#beforeupdate)
* [`afterUpdate(instance)`](#afterupdate)

## `Model<Properties, ModelInstance<Properties>>(label: string)`

To create a new Model you need to create a new instance of Model with a given label. The label is used for the neo4j database. If you are not familiar with the concept of a label in neo4j, it's like the name of a table in a relational database. For better flow support you can add the type for the Properties and the ModelInstance with the Properties of your model.

### Example

```js
import { Model, ModelInstance } from "neo4-js";

type TaskProps = {
    title?: string,
    done?: boolean,
};

const Task: Model<TaskProps, ModelInstance<TaskProps>> = new Model("Task");

```

## `create(props: Properties): Promise<ModelInstance<Properties>>` {#create}

Creates a new instance with the given properties. The properties need to be an object consisting only of primitive types. The `create` function automatically generates an uuidv4 and appends it to the properties of your instance via the `guid` property. It returns a Promise of a `ModelInstance` with your properties.

### Example

```js
import { Model, ModelInstance } from "neo4-js";

type TaskProps = {
    title?: StringProperty,
    done?: boolean,
};

const Task = new Model<TaskProps, ModelInstance<TaskProps>>("Task");
Task.create({ title: "Learn how to drive a bike", done: false })
    .then((task: ModelInstance<TaskProps>) => {
        ...
    });
```

## `findByGuid(guid: string): Promise<ModelInstance<Properties>>` {#findbyguid}

Searches for an entity with the given guid. But only for the specific _label_. It returns a Promise which resolves an ModelInstance.

### Example

```js
import { Model, ModelInstance } from "neo4-js";

type TaskProps = {
    title?: StringProperty,
    done?: boolean,
};

const Task = new Model<TaskProps, ModelInstance<TaskProps>>("Task");
Task.create({ title: "Learn how to drive a bike", done: false })
    .then((task: ModelInstance<TaskProps>) => {
        return Task.findByGuid(task.props.guid);
    })
    .then((task: ModelInstance<TaskProps>) => {
        ...
    });
```

## `delete(props: Properties, detach: boolean = false): Promise<number>` {#delete}

Deletes all entities which matches the given Properties. If you set detach to true, it will delete all entities with it's relations. If this is set to false and you want to delete a entity which has a relation to another entity, neo4j will throw an error. It returns a Promise which resolves the number of deleted entities.

### Example

```js
import { Model, ModelInstance } from "neo4-js";

type TaskProps = {
    title?: StringProperty,
    done?: boolean,
};

const Task = new Model<TaskProps, ModelInstance<TaskProps>>("Task");
Task.create({ title: "Learn how to drive a bike", done: false })
    .then((task: ModelInstance<TaskProps>) => {
        return Task.delete({ guid: task.props.guid });
    })
    .then(numberOfDeletedTasks => {
        ...
    });
Task.delete({ title: { $sw: "Buy" }})
    .then((numberOfDeletedTasks: number) => {
        ...
    });
```

## `find(props: Properties): Promise<Array<ModelInstance<Properties>>>` {#find}

Used to search for entities in the neo4j database. The Properties are typically key value types, whereas the value types are primitives such as string, number or boolean. But to create rich queries you can use the following keywords as a key. It returns a Promise which resolves an array of ModelInstances.

```
String operations:
$sw: string - starts with
$ew: string - ends with
$contains: string - string contains
$reg: string - regular expression

Number operations:
$gt: number - greater than
$gte: number - greater than equal
$lt: number - less than
$lte: number - less than equal
$between: number[] - number between two given numbers

Common:
$eq: string | number | boolean - equals (actually the default, so this is not really a useful operation...)
$in: string[] | number[] - value in list of values
$not: any - not...
$or: any[] - concatenates operations with a logical or
$and: any[] - concatenates operations with a logical and
```

### Example

```js
import { Model, ModelInstance } from "neo4-js";

type TaskProps = {
    title?: StringProperty,
    done?: boolean,
};

const Task = new Model<TaskProps, ModelInstance<TaskProps>>("Task");
Task.find({ title: { $or: [ { $sw: "Buy" }, { $sw: "Learn" } ] } })
    .then((tasks: ModelInstance<TaskProps>[]) => {
        ...
    });
Task.find({ title: "Buy milk" })
    .then((tasks: ModelInstance<TaskProps>[]) => {
        ...
    });
```

## `findOne(props: Properties): Promise<ModelInstance<Properties>>` {#findone}

FindOne works the same way as find, but the Promise resolves only one ModelInstance instead of an array of ModelInstances. For more details please have a look at [`find(props: Properties)`](#find).

## `update(props: Properties, newProps: Properties): Promise<Array<ModelInstance<Properties>>>` {#update}

The update method is used to update all entities which match for the first parameter of properties. The matched entities will then be updated with the newProps properties, which merges with the existing ones.

### Example

```js
import { Model, ModelInstance } from "neo4-js";

type TaskProps = {
    title?: StringProperty,
    done?: boolean,
};

const Task = new Model<TaskProps, ModelInstance<TaskProps>>("Task");
Task.update({ title: { $or: [ { $sw: "Buy" }, { $sw: "Learn" } ] } }, { done: true })
    .then((tasks: ModelInstance<TaskProps>[]) => {
        ...
    });
Task.find({ title: "Buy milk" }, { done: true })
    .then((tasks: ModelInstance<TaskProps>[]) => {
        ...
    });
```

## Hooks

### `beforeCreate(props: Properties): Properties` {#beforecreate}

### `afterCreate(instance: ModelInstance<Properties>): ModelInstance<Properties>` {#aftercreate}

### `beforeFind(props: Properties): Properties` {#beforefind}

### `afterFind(instance: ModelInstance<Properties>): ModelInstance<Properties>` {#afterfind}

### `beforeUpdate(props: Properties, newProps: Properties): Properties` {#beforeupdate}

### `afterUpdate(instance: ModelInstance<Properties>): ModelInstance<Properties>` {#afterupdate}
