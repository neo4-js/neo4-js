import neo4js, {
  Model,
  ModelInstance,
  model,
  relation,
  defaultProps,
  extendModelInstance,
} from "../index";

// @ts-ignore
class PersonModel extends Model {}
// @ts-ignore
const Person = new PersonModel("Person");

// @ts-ignore
class TaskModel extends Model {}
// @ts-ignore
const Task = new TaskModel("Task");

const TaskCreatorRelation = relation
  .from(() => Person)
  .to(Task)
  .via("created");

const TaskAssigneeRelation = relation
  .from(Person)
  .to(() => Task)
  .via("assigned");

  // @ts-ignore
class PersonInstance extends ModelInstance {}
// @ts-ignore
PersonInstance = extendModelInstance(PersonInstance);
// @ts-ignore
PersonInstance.hasMany("assignedTasks", () => Task, TaskCreatorRelation);
// @ts-ignore
PersonInstance.hasMany("tasks", () => Task, TaskAssigneeRelation);
// @ts-ignore
PersonInstance.model(Person);

// @ts-ignore
class TaskInstance extends ModelInstance {
  creator;
}
// @ts-ignore
TaskInstance = extendModelInstance(TaskInstance);
// @ts-ignore
TaskInstance.hasOne("creator", () => Person, () => TaskCreatorRelation);
// @ts-ignore
TaskInstance.defaultProps({
  title: "(empty)",
});
// @ts-ignore
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
