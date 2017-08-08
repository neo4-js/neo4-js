import neo4js from "neo4-js";
import { User, Task } from "./model";

neo4js.init({
  boltUri: "localhost",
  boltPort: 10001
});

async function run() {
  const olaf = await User.create({ name: "Olaf", age: 22 });
  console.log(olaf);

  const tasks = await olaf.createdTasks.create([{
    name: "Read a book",
  }]);
  
  console.log(tasks);

  neo4js.close();
}

run();
