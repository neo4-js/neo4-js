# ModelInstance

When querying the database with a [Model](model.md) you'll get almost everytime an object of ModelInstance in return. With this model instance you get the properties and methods for it's [relations](relations.md). By default, each ModelInstance has a props property and a guid which get's generated each time you create a ModelInstance via it's [Model.create](model.md#create) method.

{% method %}

{% sample lang="js" %}
### Example

```js
import { Model } from "neo4-js";

const Task = new Model("Task");
Task.create({ title: "Buy milk" })
  .then(createdTask => {
    ...
  });

```

### Example with class syntax

```js
import { Model, ModelInstance } from "neo4-js";

class TaskModel extends Model { }
const Task: TaskModel = new TaskModel("Task");

class TaskInstance extends ModelInstance { }

Task.create({ title: "Buy milk" })
  .then((createdTask: TaskInstance) => {
    ...
  });

```

{% sample lang="flow-type" %}
### Example

```js
import { Model, ModelInstance } from "neo4-js";

type TaskProps = {
  title?: string,
};

const Task: Model<TaskProps, ModelInstance<TaskProps>> = new Model("Task");
Task.create({ title: "Buy milk" })
  .then((createdTask: ModelInstance<TaskProps>) => {
    ...
  });

```

### Example with class syntax

```js
import { Model, ModelInstance } from "neo4-js";

type TaskProps = {
  title?: string,
};

class TaskModel extends Model<TaskProps, TaskInstance> { }
const Task: TaskModel = new TaskModel("Task");

class TaskInstance extends ModelInstance<TaskProps> { }

Task.create({ title: "Buy milk" })
  .then((createdTask: TaskInstance) => {
    ...
  });

```

{% endmethod %}

{% method %}

## Connecting a ModelInstance to its Model

To be able to add default properties and instance methods to our ModelInstance we need to connect the ModelInstance class to its Model object, otherwise the Model will create a standard ModelInstance object.

{% sample lang="js" %}
### Example

```js
import { Model, ModelInstance, model } from "neo4-js";

class TaskModel extends Model { }
const Task = new TaskModel("Task");

@model(Task)
class TaskInstance extends ModelInstance {
  /**
   * Space to define instance methods
   */
}

```
{% sample lang="flow-type" %}
### Example

```js
import { Model, ModelInstance, model } from "neo4-js";

type TaskProps = {
  title?: string,
};

class TaskModel extends Model<TaskProps, TaskInstance> { }
const Task: TaskModel = new TaskModel("Task");

@model(Task)
class TaskInstance extends ModelInstance<TaskProps> {
  /**
   * Space to define instance methods
   */
}

```

{% endmethod %}

{% method %}

## Default properties

To define default properties when [Model.create](model.md#create) gets called, neo4-js provides a short decorator.

{% sample lang="js" %}
### Example

```js
import { Model, ModelInstance, model, defaultProps } from "neo4-js";

class TaskModel extends Model { }
const Task = new TaskModel("Task");

@defaultProps({
  title: "(empty)",
  done: () => false,
})
@model(Task)
class TaskInstance extends ModelInstance { }

Task.create({ })
  .then(createdTask => {
    ...
  });

```
{% sample lang="flow-type" %}
### Example

```js
import { Model, ModelInstance, model, defaultProps } from "neo4-js";

type TaskProps = {
  title?: string,
};

class TaskModel extends Model<TaskProps, TaskInstance> { }
const Task: TaskModel = new TaskModel("Task");

@defaultProps({
  title: "(empty)",
  done: () => false,
})
@model(Task)
class TaskInstance extends ModelInstance<TaskProps> { }

Task.create({ title: "Buy milk" })
  .then((createdTask: TaskInstance) => {
    ...
  });

```

{% endmethod %}
