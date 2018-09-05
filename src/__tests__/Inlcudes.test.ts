import neo4js, {
  Model,
  ModelInstance,
  model,
  relation,
  hasMany,
  hasOne,
  StringProperty,
  NumberProperty,
  HasManyActions,
  HasOneActions,
  IncludesQuery,
} from "../index";

type PersonProps = {
  name: string;
  active?: boolean;
};

type TaskProps = {
  title: string;
  done?: boolean;
};

class PersonModel extends Model<PersonProps, PersonInstance> {}
const Person: PersonModel = new PersonModel("Person");

class TaskModel extends Model<TaskProps, TaskInstance> {}
const Task: TaskModel = new TaskModel("Task");

const TaskCreatorRelation = relation
  .from(() => Person)
  .to(() => Task)
  .via("created");

const TaskAssigneeRelation = relation
  .from(Person)
  .to(Task)
  .via("assigned");

@model(Person)
class PersonInstance extends ModelInstance<PersonProps> {
  @hasMany(Task, TaskCreatorRelation)
  tasks: HasManyActions<TaskProps, TaskInstance>;

  @hasMany(Task, TaskAssigneeRelation)
  assignedTasks: HasManyActions<TaskProps, TaskInstance>;
}

@model(Task)
class TaskInstance extends ModelInstance<TaskProps> {
  @hasOne(() => Person, () => TaskCreatorRelation)
  creator: HasOneActions<PersonProps, PersonInstance>;
}

describe("Includes", () => {
  beforeAll(() => {
    neo4js.init({
      boltUri: "localhost",
      boltPort: 10001,
    });
  });

  beforeEach(async () => {
    const olaf = await Person.create({ name: "Olaf", active: true });
    let tasks = await olaf.assignedTasks.create(
      [
        { title: "Learn magic", done: true },
        { title: "Write more test cases 1", done: false },
        { title: "Write more test cases 2", done: true },
      ],
      { favorite: true }
    );
    for (const task of tasks) {
      await task.creator.add(olaf);
    }

    const ignatz = await Person.create({ name: "Ignatz", active: true });
    await ignatz.assignedTasks.create([
      { title: "Learn magic 2", done: true },
      { title: "Write more test cases 3", done: false },
      { title: "Write more test cases 4", done: true },
    ]);
  });

  afterEach(async () => {
    await neo4js.run("MATCH (n) DETACH DELETE n");
  });

  afterAll(() => {
    neo4js.close();
  });

  describe("find with include", () => {
    it("should return olaf with all assigned tasks and the creators", async () => {
      let query = Person.findOneAndInclude({ name: "Olaf" });
      expect(query).toBeInstanceOf(IncludesQuery);

      if (query instanceof IncludesQuery) {
        let result = await query
          .include(o => o.assignedTasks.get({ done: true }))
          .include(r => r.creator.get())
          .run();

        expect(result).toBeInstanceOf(PersonInstance);
        expect(result.assignedTasks.length).toEqual(2);
        expect(result.assignedTasks[0]).toBeInstanceOf(TaskInstance);

        delete result.props.guid;
        result.assignedTasks = result.assignedTasks.map(t => {
          delete t.props.guid;
          if (t.creator) {
            delete t.creator.props.guid;
          }
          return t;
        });

        expect(result).toMatchSnapshot();
      } else {
        expect(true).toBeFalsy();
      }
    });

    it("should return all active users with done assigned tasks and the creators", async () => {
      let query = Person.findAndInclude({ active: true });
      expect(query).toBeInstanceOf(IncludesQuery);

      if (query instanceof IncludesQuery) {
        let result = await query
          .include(o => o.assignedTasks.get({ done: true }))
          .include(r => r.creator.get())
          .run();

        expect(result.length).toEqual(2);
        expect(result[0]).toBeInstanceOf(PersonInstance);
        expect(result[0].assignedTasks.length).toEqual(2);
        expect(result[0].assignedTasks[0]).toBeInstanceOf(TaskInstance);

        result = result
          .map(r => {
            delete r.props.guid;
            r.assignedTasks = r.assignedTasks.map(t => {
              delete t.props.guid;
              if (t.creator) {
                delete t.creator.props.guid;
              }
              return t;
            });
            return r;
          })
          .sort((a, b) => a.props.name.localeCompare(b.props.name));

        expect(result).toMatchSnapshot();
      } else {
        expect(true).toBeFalsy();
      }
    });
  });
});
