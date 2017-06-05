// @flow

import trineo, { Model, ModelInstance, hasMany, model, hasOne } from "../index";
import idx from "idx";

type PersonProps = {
  name?: StringProperty,
};

type TaskProps = {
  title?: StringProperty,
  done?: boolean,
};

class PersonModel extends Model<PersonProps, PersonInstance> {}
const Person: PersonModel = new PersonModel("Person");

class TaskModel extends Model<TaskProps, TaskInstance> {}
const Task: TaskModel = new TaskModel("Task");

@model("Person")
class PersonInstance extends ModelInstance<PersonProps> {
  @hasMany("Task", "created")
  tasks: HasManyActions<TaskProps, TaskInstance>;
  @hasMany("Person", "friend")
  friends: HasManyActions<PersonProps, PersonInstance>;

  getFriendsWithName = async (name: string) => {
    return await this.friends.get({ name: { $sw: name } });
  };
}

@model("Task")
class TaskInstance extends ModelInstance<TaskProps> {}

describe("ModelInstance", () => {
  beforeAll(() => {
    trineo.init({
      boltUri: "localhost",
      boltPort: 10001,
    });
  });

  beforeEach(async () => {
    const paul = await Person.create({ name: "Olaf" });
    await paul.friends.create([{ name: "Olga" }, { name: "Hannes" }]);
    await Task.create({ title: "Learn magic", done: true });
    await Task.create({ title: "Write more test cases", done: false });
    await Task.create({ title: "Write more test cases", done: false });
  });

  afterEach(async () => {
    await trineo.run("MATCH (n) DETACH DELETE n");
  });

  afterAll(() => {
    trineo.close();
  });

  it("should return an instance of PersonInstance", async () => {
    const paul: PersonInstance = await Person.create({ name: "Paul" });

    expect(paul).toBeInstanceOf(PersonInstance);
  });

  describe("ModelInstance functions", () => {
    it("should return friends with starting name 'O'", async () => {
      const paul: ?PersonInstance = await Person.findOne({ name: "Olaf" });
      if (!paul) {
        expect(1).toEqual(0);
        return;
      }
      let friends = await paul.getFriendsWithName("O");
      friends = friends.map(f => {
        delete f.props.guid;
        return f;
      });
      expect(friends).toMatchSnapshot();
    });
  });
});
