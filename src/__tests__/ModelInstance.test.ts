// @flow

import neo4js, {
  Model,
  ModelInstance,
  hasMany,
  model,
  relation,
  hasOne,
  defaultProps,
  StringProperty,
  NumberProperty,
  HasManyActions,
  HasOneActions,
} from "../index";

type PersonProps = {
  name: StringProperty;
};

type TaskProps = {
  title: StringProperty;
  done?: boolean;
};

type TodoProps = TaskProps;

const PersonTaskRelation = relation
  .from(() => Person)
  .to(() => Task)
  .via("created");

const FriendRelation = relation
  .from(() => Person)
  .to(() => Person)
  .via("friend");

class PersonModel extends Model<PersonProps, PersonInstance> {}
const Person: PersonModel = new PersonModel("Person");

class TaskModel extends Model<TaskProps, TaskInstance> {}
const Task: TaskModel = new TaskModel("Task");

@model(Person)
class PersonInstance extends ModelInstance<PersonProps> {
  @hasMany(Task, PersonTaskRelation)
  tasks: HasManyActions<TaskProps, TaskInstance>;
  @hasMany(Person, FriendRelation, "any")
  friends: HasManyActions<PersonProps, PersonInstance>;

  getFriendsWithName = async (name: string) => {
    return await this.friends.get({ name: { $sw: name } });
  };
}

@defaultProps({
  title: "(empty)",
  done: () => true,
})
@model(Task)
class TaskInstance extends ModelInstance<TaskProps> {}

const Todo = new Model("Todo");
@defaultProps({
  title: "(empty)",
  done: () => false,
})
@model(Todo)
class TodoInstance extends ModelInstance<TodoProps> {}

describe("ModelInstance", () => {
  beforeAll(() => {
    neo4js.init({
      boltUri: "localhost",
      boltPort: 10001,
    });
  });

  beforeEach(async () => {
    const paul = await Person.create({ name: "Olaf" });
    await paul.friends.create([{ name: "Olga" }, { name: "Hannes" }], {
      since: "yesterday",
      location: "Graz",
    });
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

  it("should return an instance of PersonInstance", async () => {
    const paul: PersonInstance = await Person.create({ name: "Paul" });

    expect(paul).toBeInstanceOf(PersonInstance);
  });

  describe("ModelInstance functions", () => {
    it("should return friends with starting name 'O'", async () => {
      const olaf: PersonInstance = await Person.findOne({ name: "Olaf" });
      if (!olaf) {
        expect(1).toEqual(0);
        return;
      }
      let friends = await olaf.getFriendsWithName("O");
      friends = friends.map(f => {
        delete f.props.guid;
        return f;
      });
      expect(friends).toMatchSnapshot();
    });
  });

  describe("Default Properties", () => {
    it("should initialize with default properties", async () => {
      let task: TaskInstance = await Task.create({
        title: "Write more tests boi!",
      });
      const guid = task.props.guid;

      if (task && task.props.guid) delete task.props.guid;
      expect(task).toMatchSnapshot();

      task = await Task.findByGuid(guid);
      if (task && task.props.guid) delete task.props.guid;
      expect(task).toMatchSnapshot();
    });

    it("should initialize with minimal configuration default properties", async () => {
      let todo = await Todo.create({});
      delete todo.props.guid;
      expect(todo).toMatchSnapshot();
    });
  });
});
