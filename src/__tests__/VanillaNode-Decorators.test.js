import neo4js, {
  Model,
  ModelInstance,
  src,
  model,
  dest,
  relation,
  defaultProps,
  extendModelInstance,
} from "../index";
import idx from "idx";

class PersonModel extends Model {}
const Person = new PersonModel("Person");

class TaskModel extends Model {}
const Task = new TaskModel("Task");

const TaskCreatorRelation = relation
  .from(() => Person)
  .to(Task)
  .via("created");

const TaskAssigneeRelation = relation
  .from(Person)
  .to(() => Task)
  .via("assigned");

class PersonInstance extends ModelInstance {}
PersonInstance = extendModelInstance(PersonInstance);
PersonInstance.hasMany("assignedTasks", () => Task, TaskCreatorRelation);
PersonInstance.hasMany("tasks", () => Task, TaskAssigneeRelation);
PersonInstance.model(Person);

class TaskInstance extends ModelInstance {
  creator;
}
TaskInstance = extendModelInstance(TaskInstance);
TaskInstance.hasOne("creator", () => Person, () => TaskCreatorRelation);
TaskInstance.defaultProps({
  title: "(empty)",
});
TaskInstance.model(() => Task);

describe("VanillaNodeDecorators", () => {
  beforeAll(() => {
    neo4js.init({
      boltUri: "localhost",
      boltPort: 10001,
    });
  });

  beforeEach(async () => {
    await Person.create({ name: "Olaf" });
    await Person.create({ name: "Ignatz" });
    await Task.create({ title: "Learn magic", done: true });
    await Task.create({ title: "Write more test cases", done: false });
    await Task.create({ title: "Write more test cases", done: false });
  });

  afterEach(async () => {
    await neo4js.run("MATCH (n) DETACH DELETE n");
  });

  afterAll(() => {
    neo4js.close();
  });

  describe("create", () => {
    it("should create instances of tasks and relate them to a person instance", async () => {
      const paul = await Person.create({ name: "Paul" });

      const propsArray = [
        {
          title: "Buy milk",
        },
        {
          title: "Buy beer",
          done: false,
        },
      ];

      const tasks = await paul.tasks.create(propsArray);

      expect(
        tasks.map(t => {
          delete t.props.guid;
          return t;
        })
      ).toMatchSnapshot();
    });
  });

  describe("defaultProps", () => {
    it("should define default props for the task", async () => {
      const paul = await Person.create({ name: "Paul" });

      const tasks = await paul.tasks.create([{}]);

      expect(
        tasks.map(t => {
          delete t.props.guid;
          return t;
        })
      ).toMatchSnapshot();
    });
  });
});
