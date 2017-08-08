# Getting up'n running with Neo4-js

At this point you should already have done the installation guide for your platform. Otherwise I can't promise that your autocomplete results are satisfying. For the purpose of simplicity we are going to create a simple database model for a todo application \(I know, at this point anybody is sick of todo tutorials in the JavaScript world, but bear with me ;\).

To get started you can clone or download the zip of the neo4js git repository with the following commands:

```bash
git clone https://github.com/JanPeter/neo4js
cd neo4js/examples/starter
yarn install
```

If you prefer to use `npm` or any other JavaScript package manager, just go with it instead of `yarn` ;\)

The first thing we need to specify is, which properties our model will have. To keep it simple we just have a `User` and `Todo` entity. The user has the properties name of the type `string` and `age` of the type `number`\(the age is just to have at least one property of the type number, I agree that it wouldn't make a lot of sense to store this information for a todo-app, but anyways\). The properties are stored in the file `./flow/model.js` and looks like the following:

```js
declare type UserProps = {
  name?: string,
  age?: number,
}

declare type TodoProps = {
  description?: string,
  done?: boolean,
}
```

Why do we need to specify each property as an optional value? Because we use this type to validate the parameters when we create, search, update or delete our model. I'm going to explain this later when we actually create an entity, it'll make more sense if you have a look at the code below in a minute. Now that we have defined our property types we can start defining our Model itself. Go into the file `./src/model.js` and paste the following code into it:

```js
// @flow

import { Model, ModelInstance, } from 'neo4-js';

class UserModel extends Model<UserProps, UserInstance> { }
export const User: UserModel = new UserModel("User");
export class UserInstance extends ModelInstance<UserProps> { }

class TodoModel extends Model<TodoProps, TodoInstance> { }
export const Todo: TodoModel = new TodoModel("Todo");
export class TodoInstance extends ModelInstance<TodoProps> { }
```

In `neo4-js` a model consists of two parts. The first part is the `Model` class, which let's you do basic CRUD interactions with the neo4j database and the second one is the `ModelInstance` class. Each time the `Model` returns an instance, it will be an instance of the `ModelInstance`. So if we call `User.findOne({ name: "Olaf" })` we will get an instance of `UserInstance` with the properties of the `UserProps` type \(actually we will get a `Promise` which resolves a `UserInstance`\).

Great, that's actually everything we need to test our small model for the first time! 🙌

To do that we need to go into our `./src/index.js` file and paste the following code into it. At this point you can try out the autocomplete stuff and check if flow is working for you \(to test if flow is working, just try to change the type of the `age` property to a `string` instead of a `number`, flow should report an error\)!

```js
// @flow

import neo4js from "neo4-js";
import { User, Todo } from "./model.js";

neo4js.init({
  boltUri: "localhost",
  boltPort: 10001
});

async function run() {
  const olaf = await User.create({ name: "Olaf", age: 22 });
  console.log(olaf);
  const todo = await Todo.create({
    description: "Create an awesome application with neo4-js!",
    done: false
  });
  console.log(todo);
  neo4js.close();
}

run();
```

Before you start the application, make sure that docker is running and that you are running the `yarn start-db` command in another command line interface. Now go to your command line and run the app with the `yarn start` command.

After running the `start` command you should see that the create function returns instances of our ModelInstance classes whereas the properties are stored in a `props` property within the instance. At this point you should recognize the `guid` property! In typical relational databases you'll almost end up creating an artificial auto incrementing primary key. I chose to use guid's as the primary key for each model instance. So when you create an instance of your model, the `guid` will be created automatically for you. I think that guid's are a great way to identify entities in a database and simplify the communication with other applications a lot!

