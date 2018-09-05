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
} from "../index";

type PersonProps = {
  name: string;
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
  .from(Person)
  .to(Task)
  .via("created");

const TaskAssigneeRelation = relation
  .from(Person)
  .to(Task)
  .via("assigned");

const SupervisorRelation = relation
  .from(Person)
  .to(Person)
  .via("supervisor");

@model(Person)
class PersonInstance extends ModelInstance<PersonProps> {
  static model = Person;

  @hasMany(() => Task, TaskCreatorRelation)
  createdTasks: HasManyActions<TaskProps, TaskInstance>;

  @hasMany(() => Task, TaskAssigneeRelation)
  assignedTasks: HasManyActions<TaskProps, TaskInstance>;

  @hasMany(() => Person, SupervisorRelation, "in")
  epmloyees: HasManyActions<PersonProps, PersonInstance>;
  @hasOne(() => Person, SupervisorRelation, "out")
  supervisor: HasOneActions<PersonProps, PersonInstance>;
}

@model(Task)
class TaskInstance extends ModelInstance<TaskProps> {
  static model = Task;

  @hasOne(() => Task, TaskCreatorRelation)
  creator: HasOneActions<PersonProps, PersonInstance>;

  @hasOne(() => Task, TaskAssigneeRelation)
  assignee: HasOneActions<PersonProps, PersonInstance>;
}

describe("HasOne", () => {
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
    it("should create one supervisor", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });

      const hubert: PersonInstance = await paul.supervisor.create({
        name: "Hubert",
      });
      delete hubert.props.guid;
      expect(hubert).toMatchSnapshot();
    });

    it("should delete old supervisor when creating new", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });

      const hubert: PersonInstance = await paul.supervisor.create({
        name: "Hubert",
      });
      const olaf: PersonInstance = await paul.supervisor.create({
        name: "Olaf",
      });

      const result = await neo4js.run(
        "MATCH (p:Person)-[:supervisor]->(b:Person) RETURN b"
      );

      expect(result.length).toEqual(1);
      expect(result[0].b).toEqual(olaf.props);
    });
  });

  describe("get", () => {
    it("should get created supervisor", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });

      const hubert: PersonInstance = await paul.supervisor.create({
        name: "Hubert",
      });
      const hubert2: PersonInstance = await paul.supervisor.get();
      expect(hubert.props).toEqual(hubert2.props);
    });

    it("should return null when no relation exists", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });

      const nobody: PersonInstance = await paul.supervisor.get();
      expect(nobody).toEqual(null);
    });
  });

  describe("remove", () => {
    it("should remove supervisor relation without deleting supervisor", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });

      const hubert: PersonInstance = await paul.supervisor.create({
        name: "Hubert",
      });

      let r = await paul.supervisor.remove();
      expect(r).toMatchSnapshot();
      let result: any[] = await neo4js.run("MATCH (m) RETURN m");
      result = result
        .map(node => {
          delete node.m.guid;
          node.m.val = node.m.name ? node.m.name : node.m.title;
          return node;
        })
        .sort((a, b) => a.m.val.localeCompare(b.m.val));
      expect(result).toMatchSnapshot();
    });
  });

  describe("add", () => {
    it("should add created supervisor", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });
      const olaf: PersonInstance = await Person.create({ name: "Olaf" });

      const result = await paul.supervisor.add(olaf);
      expect(result).toMatchSnapshot();

      expect(olaf.props).toEqual((await paul.supervisor.get()).props);
    });
  });

  describe("hasOne", () => {
    it("should return true", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });
      await paul.supervisor.create({ name: "Olaf" });

      const result = await paul.supervisor.hasOne();
      expect(result).toMatchSnapshot();
    });

    it("should return false", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });
      let result = await paul.supervisor.hasOne();
      expect(result).toEqual(false);

      await paul.supervisor.create({ name: "Olaf" });

      result = await paul.supervisor.hasOne();
      expect(result).toEqual(true);

      await paul.supervisor.remove();
      result = await paul.supervisor.hasOne();
      expect(result).toEqual(false);
    });
  });

  describe("update", () => {
    it("should update supervisor", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });
      const olaf: PersonInstance = await paul.supervisor.create({
        name: "Olaf",
      });

      const ignatz: PersonInstance = await paul.supervisor.update({
        name: "Ignatz",
      });
      if (ignatz) {
        expect(olaf.props.guid).toEqual(ignatz.props.guid);
        delete ignatz.props.guid;
        expect(ignatz).toMatchSnapshot();
      } else {
        expect(1).toEqual(0);
      }
    });

    it("should return true if no supervisor can be updated", async () => {
      const paul: PersonInstance = await Person.create({ name: "Paul" });

      const ignatz: PersonInstance = await paul.supervisor.update({
        name: "Ignatz",
      });
      expect(ignatz).toEqual(true);
    });
  });
});
