import neo4js from "neo4-js";
import { User, UserInstance, Task, TaskInstance } from "./model";

neo4js.init({
  boltUri: "localhost",
  boltPort: 10001,
});

async function run() {
  const olaf: UserInstance = await User.create({ name: "Olaf", age: 22 });
  console.log(olaf);

  const tasks: TaskInstance[] = await olaf.createdTasks.create([
    {
      title: "Read a book",
    },
  ]);

  console.log(tasks);

  neo4js.close();
}

run();
