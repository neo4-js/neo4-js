// @flow

import trineo, { Model, ModelInstance, hasMany, model, hasOne } from "../index";
import idx from "idx";

import { User, UserInstance, Task, TaskInstance } from "./model";
import type { UserProps, TaskProps } from "./model";

describe("Models in different files", () => {
  beforeAll(() => {
    trineo.init({
      boltUri: "localhost",
      boltPort: 10001,
    });
  });

  beforeEach(async () => {
    await User.create({ name: "Olaf" });
    await User.create({ name: "Ignatz" });
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
      const paul: UserInstance = await User.create({ name: "Paul" });

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
});
