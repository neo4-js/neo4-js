// @flow

import neo4js, { Model, ModelInstance } from "../index";

type Props = {
  name?: string;
  age?: number;
};

class PersonInstance extends ModelInstance<Props> {}
class PersonModel extends Model<Props, PersonInstance> {}
let Person = new PersonModel("Person");

type TaskProps = {
  title: string;
  done?: boolean;
};

class TaskInstance extends ModelInstance<TaskProps> {}
class TaskModel extends Model<TaskProps, TaskInstance> {
  afterFind(t: TaskInstance): TaskInstance {
    delete t.props.guid;
    t.props.done = t.props.done || false;
    return t;
  }
}
let Task = new TaskModel("Task");

describe("Hooks", () => {
  beforeAll(() => {
    neo4js.init({
      boltUri: "localhost",
      boltPort: 10001,
    });
  });

  beforeEach(() => {
    Person = new PersonModel("Person");
    Task = new TaskModel("Task");
  });

  afterEach(async () => {
    await neo4js.run("MATCH (n) DETACH DELETE n");
  });

  afterAll(() => {
    neo4js.close();
  });

  describe("create", () => {
    it("should call before create hook once", async () => {
      // @ts-ignore
      Person.beforeCreate = jest.fn().mockImplementationOnce(t => t);
      const paul = await Person.create({ name: "Paul", age: 21 });
      // @ts-ignore
      expect(Person.beforeCreate).toHaveBeenCalledTimes(1);
    });

    it("should call before create hook once and change props", async () => {
      // @ts-ignore
      Person.beforeCreate = (t: Props): Props => ({ ...t, age: t.age + 1 });
      const paul = await Person.create({ name: "Paul", age: 21 });
      expect(paul.props.age).toEqual(22);
    });

    it("should call before create hook once", async () => {
      // @ts-ignore
      Person.afterCreate = jest.fn().mockImplementationOnce(t => t);
      const paul = await Person.create({ name: "Paul", age: 21 });
      // @ts-ignore
      expect(Person.afterCreate).toHaveBeenCalledTimes(1);
    });

    it("should call after create hook once and change props of instance", async () => {
      // @ts-ignore
      Person.afterCreate = (t: PersonInstance) => {
        delete t.props.guid;
        return t;
      };
      const paul = await Person.create({ name: "Paul", age: 21 });
      expect(paul).toMatchSnapshot();
    });
  });

  describe("find", () => {
    it("should call before find hook once", async () => {
      // @ts-ignore
      Person.beforeFind = jest.fn().mockImplementationOnce(t => t);
      await Person.find();
      // @ts-ignore
      expect(Person.beforeFind).toHaveBeenCalledTimes(1);
    });

    it("should call before find hook once and change props", async () => {
      // @ts-ignore
      Task.beforeFind = (p: TaskProps) => ({ ...p, done: true });
      await Task.create({ title: "Buy milk" });
      await Task.create({ title: "Read a book", done: true });
      const tasks = await Task.find();
      expect(tasks).toMatchSnapshot();
    });

    it("should call after find hook twice", async () => {
      // @ts-ignore
      Person.afterFind = jest.fn().mockImplementation(t => t);
      await Person.create({ name: "Hanns" });
      await Person.create({ name: "Olaf" });
      await Person.find();
      // @ts-ignore
      expect(Person.afterFind).toHaveBeenCalledTimes(2);
    });

    it("should call after find hook twice and change props of instances", async () => {
      await Task.create({ title: "Buy milk" });
      await Task.create({ title: "Read a book" });
      const tasks = await Task.find();
      expect(tasks).toMatchSnapshot();
    });
  });

  describe("update", () => {
    it("should call before update hook once", async () => {
      // @ts-ignore
      Person.beforeUpdate = jest
        .fn()
        .mockImplementationOnce((props, newProps) => ({ props, newProps }));
      await Person.create({ name: "Hanns", age: 20 });
      await Person.update({ name: "Hanns" }, { age: 21 });
      // @ts-ignore
      expect(Person.beforeUpdate).toHaveBeenCalledTimes(1);
    });

    it("should call before find hook once and change props", async () => {
      // @ts-ignore
      Person.beforeUpdate = (props: Props, newProps: Props) => {
        newProps.age += 1;
        return { props, newProps };
      };
      await Person.create({ name: "Hanns", age: 20 });
      const p = (await Person.update({ name: "Hanns" }, { age: 21 }))[0];
      expect(p.props.age).toEqual(22);
    });

    it("should call after find hook twice", async () => {
      // @ts-ignore
      Person.afterUpdate = jest.fn().mockImplementation(t => t);
      await Person.create({ name: "Hanns" });
      await Person.create({ name: "Olaf" });
      await Person.update({ name: "Hanns" }, { age: 20 });
      // @ts-ignore
      expect(Person.afterUpdate).toHaveBeenCalledTimes(1);
    });

    // it('should call after find hook twice and change props of instances', async () => {
    //   await Task.create({ title: 'Buy milk' });
    //   await Task.create({ title: 'Read a book' });
    //   const tasks = await Task.find();
    //   expect(tasks).toMatchSnapshot();
    // });
  });
});
