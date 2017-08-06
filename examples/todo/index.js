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
