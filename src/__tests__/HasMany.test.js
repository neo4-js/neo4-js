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
  tasks: HasManyActions<TaskProps, TaskInstance, "created" | "assignedTo">;
  @hasMany("Person", "friend")
  friends: HasManyActions<PersonProps, PersonInstance, "friend">;
}

@model("Task")
class TaskInstance extends ModelInstance<TaskProps> {}

describe("HasMany", () => {
  beforeAll(() => {
    trineo.init({
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
    await trineo.run("MATCH (n) DETACH DELETE n");
  });

  afterAll(() => {
    trineo.close();
  });

  describe("create", () => {
    it("should create a instances of tasks and relate them to person instance", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });

      const propsArray: TaskProps[] = [
        {
          title: "Buy milk",
        },
        {
          title: "Buy beer",
          done: false,
        },
      ];

      const tasks: TaskInstance[] = await paul.tasks.create(propsArray);

      expect(
        tasks.map(t => {
          delete t.props.guid;
          return t;
        })
      ).toMatchSnapshot();
    });
  });

  describe("get", () => {
    let paul: PersonInstance;

    const tasksProps: TaskProps[] = [
      {
        title: "Buy milk",
      },
      {
        title: "Buy beer",
        done: true,
      },
    ];

    beforeEach(async () => {
      paul = await Person.create({ name: "Paul" });
      const hubert: PersonInstance = await Person.create({ name: "Hubert" });
      hubert.tasks.create([{ title: "Learn to drive a car" }]);
    });

    it("should find all tasks to instance", async () => {
      await paul.tasks.create(tasksProps);
      const tasks: TaskInstance[] = await paul.tasks.get();

      expect(
        tasks.map(t => {
          delete t.props.guid;
          return t;
        })
      ).toMatchSnapshot();
    });

    it("should find all tasks to instance where task property done equals true", async () => {
      await paul.tasks.create(tasksProps);
      const tasks: TaskInstance[] = await paul.tasks.get({ done: true });

      expect(
        tasks.map(t => {
          delete t.props.guid;
          return t;
        })
      ).toMatchSnapshot();
    });

    it("should find all tasks to instance", async () => {
      await paul.tasks.create(tasksProps, "assignedTo");
      const tasks: TaskInstance[] = await paul.tasks.get(
        undefined,
        "assignedTo"
      );

      expect(
        tasks.map(t => {
          delete t.props.guid;
          return t;
        })
      ).toMatchSnapshot();
    });

    it("should find nothing", async () => {
      await paul.tasks.create(tasksProps);
      const tasks: TaskInstance[] = await paul.tasks.get(
        undefined,
        "assignedTo"
      );
      expect(tasks).toMatchSnapshot();
    });

    it("should find all tasks starting with character 'B' and are done", async () => {
      await paul.tasks.create(tasksProps);
      const tasks: TaskInstance[] = await paul.tasks.get({
        title: { $sw: "B" },
        done: true,
      });
      expect(
        tasks.map(t => {
          delete t.props.guid;
          return t;
        })
      ).toMatchSnapshot();
    });
  });

  describe("count", () => {
    let paul: PersonInstance;

    const tasksProps: TaskProps[] = [
      {
        title: "Buy milk",
      },
      {
        title: "Buy beer",
        done: true,
      },
    ];

    beforeEach(async () => {
      paul = await Person.create({ name: "Paul" });
      const hubert: PersonInstance = await Person.create({ name: "Hubert" });
      hubert.tasks.create([{ title: "Learn to drive a car" }]);
    });

    it("should count all tasks to instance", async () => {
      await paul.tasks.create(tasksProps);
      const tasks: number = await paul.tasks.count();
      expect(tasks).toMatchSnapshot();
    });

    it("should count all tasks with property done equals true to instance", async () => {
      await paul.tasks.create(tasksProps, "assignedTo");
      const tasks: number = await paul.tasks.count(
        { done: true },
        "assignedTo"
      );
      expect(tasks).toMatchSnapshot();
    });
  });

  describe("add", () => {
    const tasksProps: TaskProps[] = [
      {
        title: "Buy milk",
      },
      {
        title: "Buy beer",
        done: true,
      },
    ];

    it("should add only a relation of instances to instance", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });
      const tasks: TaskInstance[] = [];
      for (const props of tasksProps) {
        tasks.push(await Task.create(props));
      }
      const t: number = await paul.tasks.add(tasks, "assignedTo");
      expect(t).toMatchSnapshot();

      const relatedTasks = await paul.tasks.get(undefined, "assignedTo");

      const mapSort = t =>
        // $FlowFixMe
        t.map(a => a.props).sort((a, b) => a.title.localeCompare(b.title));
      expect(mapSort(relatedTasks)).toEqual(mapSort(tasks));
    });
  });

  describe("update", () => {
    const tasksProps: TaskProps[] = [
      {
        title: "Buy milk",
        done: false,
      },
      {
        title: "Buy beer",
        done: true,
      },
    ];

    it("should set tasks to done", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });
      const tasks: TaskInstance[] = await paul.tasks.create(
        tasksProps,
        "assignedTo"
      );
      const result: TaskInstance[] = await paul.tasks.update(
        { done: true },
        { done: false },
        "assignedTo"
      );

      expect(
        result.map(r => {
          delete r.props.guid;
          return r;
        })
      ).toMatchSnapshot();
    });
  });
});
