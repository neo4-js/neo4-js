// @flow

import neo4js, {
  Model,
  ModelInstance,
  src,
  model,
  dest,
  relation,
} from "../index";
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

const TaskCreatorRelation = relation("created").src
  .hasMany(Task)
  .dest.hasOne(Person);

const TaskAssigneeRelation = relation("assigned").src
  .hasMany(Task)
  .dest.hasOne(Person);

@model(Person)
class PersonInstance extends ModelInstance<PersonProps> {
  @src(TaskCreatorRelation) tasks: HasManyActions<TaskProps, TaskInstance>;

  @src(TaskAssigneeRelation)
  assignedTasks: HasManyActions<TaskProps, TaskInstance>;
}

@model(Task)
class TaskInstance extends ModelInstance<TaskProps> {
  @dest(TaskCreatorRelation)
  creator: HasOneActions<PersonProps, PersonInstance>;
}

describe("HasMany", () => {
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

    it("should create instances of tasks and relate them to a person instance with relation properties", async () => {
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

      const tasks: TaskInstance[] = await paul.tasks.create(propsArray, {
        relationCreated: "today",
      });

      const db = await neo4js.run("MATCH (a)-[b]->(c) RETURN a, b, c");
      const data = db.map(item => {
        delete item.a.guid;
        delete item.c.guid;
        return { from: item.a, to: item.c, props: item.b };
      });

      expect(data).toMatchSnapshot();
    });

    it("should create instances of tasks and relate them to a person instance with multiple relation properties", async () => {
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

      const tasks: TaskInstance[] = await paul.tasks.create(propsArray, {
        relationCreated: "today",
        type: "todo",
      });

      const db = await neo4js.run("MATCH (a)-[b]->(c) RETURN a, b, c");
      const data = db.map(item => {
        delete item.a.guid;
        delete item.c.guid;
        return { from: item.a, to: item.c, props: item.b };
      });

      expect(data).toMatchSnapshot();
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
      hubert.tasks.create([{ title: "Learn to drive a car" }], {
        since: "today",
        type: "todo",
      });
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
      await paul.tasks.create(tasksProps);
      const tasks: TaskInstance[] = await paul.tasks.get();

      expect(
        tasks.map(t => {
          delete t.props.guid;
          return t;
        })
      ).toMatchSnapshot();
    });

    it("should find nothing", async () => {
      await paul.tasks.create(tasksProps);
      const tasks: TaskInstance[] = await paul.assignedTasks.get();
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

    it("should find all tasks starting with character 'B' and are done with relationProp type todo", async () => {
      await paul.tasks.create(tasksProps);
      await paul.tasks.create([{ title: "Buy milk", done: true }], {
        type: "todo",
      });
      const tasks: TaskInstance[] = await paul.tasks.get(
        {
          title: { $sw: "B" },
          done: true,
        },
        { type: "todo" }
      );

      expect(
        tasks.map(t => {
          delete t.props.guid;
          return t;
        })
      ).toMatchSnapshot();
    });

    it("should find all tasks assigned 10 seconds ago", async () => {
      await paul.tasks.create(tasksProps);
      await paul.tasks.create([{ title: "Buy milk" }], {
        assigned: 1502022002035,
      });

      const tasks: TaskInstance[] = await paul.tasks.get(
        {},
        { assigned: { $gt: 1502022002035 - 10000 } }
      );

      expect(
        tasks.map(t => {
          delete t.props.guid;
          return t;
        })
      ).toMatchSnapshot();
    });

    it("should find all tasks assigned 10 seconds ago, type of todo and starts with 'B'", async () => {
      await paul.tasks.create(tasksProps);
      await paul.tasks.create(
        [{ title: "Buy milk" }, { title: "Read a book" }],
        {
          assigned: 1502022002035,
          type: "todo",
        }
      );

      const tasks: TaskInstance[] = await paul.tasks.get(
        { title: { $sw: "B" } },
        { assigned: { $gt: 1502022002035 - 10000 }, type: { $eq: "todo" } }
      );

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
      await paul.tasks.create(tasksProps);
      const tasks: number = await paul.tasks.count({ done: true });
      expect(tasks).toMatchSnapshot();
    });

    it("should count all tasks which are assigned", async () => {
      await paul.tasks.create(tasksProps);
      await paul.tasks.create([{ title: "Buy milk" }], {
        assigned: 1502022002035,
      });
      const tasks: number = await paul.tasks.count(
        {},
        { assigned: { $gt: 0 } }
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
      const t: number = await paul.assignedTasks.add(tasks);
      expect(t).toMatchSnapshot();

      const relatedTasks = await paul.assignedTasks.get();

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
      const tasks: TaskInstance[] = await paul.tasks.create(tasksProps);
      const result: TaskInstance[] = await paul.tasks.update(
        { done: true },
        { done: false }
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
