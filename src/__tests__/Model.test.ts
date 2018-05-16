// @flow

import neo4js, { Model, ModelInstance } from "../index";
import {
  StringProperty,
  NumberProperty,
  HasManyActions,
  HasOneActions,
} from "../index";

type Props = {
  name: StringProperty,
  age?: NumberProperty,
};

class PersonInstance extends ModelInstance<Props> {}
class PersonModel extends Model<Props, PersonInstance> {}
const Person = new PersonModel("Person");

describe("Model", () => {
  beforeAll(() => {
    neo4js.init({
      boltUri: "localhost",
      boltPort: 10001,
    });
  });

  afterEach(async () => {
    await neo4js.run("MATCH (n) DETACH DELETE n");
  });

  afterAll(() => {
    neo4js.close();
  });

  describe("create", () => {
    it("should create a instance of specific model", async () => {
      const paul: PersonInstance = await Person.create({
        name: "Paul",
        age: 21,
      });
      delete paul.props.guid;
      expect(paul).toMatchSnapshot();
    });
  });

  describe("findByGuid", () => {
    it("should get a instance with specific guid", async () => {
      let p1 = await Person.create({ name: "Paul" });
      const guid = p1.props.guid;
      if (guid) {
        const p2 = await Person.findByGuid(guid);
        expect(p1).toEqual(p2);
      } else {
        expect(true).toBeFalsy();
      }
    });

    it("should not get any instance by wrong guid", async () => {
      const p = await Person.findByGuid("asdf");
      expect(p).toBeNull();
    });
  });

  describe("delete", () => {
    it("should return number of deleted persons", async () => {
      await Person.create({ name: "Olaf" });
      const n = await Person.delete({ name: "Olaf" });
      expect(n).toMatchSnapshot();
    });

    it("should return number of deleted olafs", async () => {
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Hubert" });
      await Person.create({ name: "Olaf" });
      const n = await Person.delete({ name: "Olaf" });
      expect(n).toMatchSnapshot();

      let persons = await Person.find();
      persons = persons.map(p => {
        delete p.props.guid;
        return p;
      });
      expect(persons).toMatchSnapshot();
    });
  });

  describe("find", () => {
    it("should find all persons by name", async () => {
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Hubert" });
      await Person.create({ name: "Olaf" });
      let persons = await Person.find({ name: "Olaf" });
      persons = persons.map(p => {
        delete p.props.guid;
        return p;
      });
      expect(persons).toMatchSnapshot();
    });

    it("should find all persons", async () => {
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Hubert" });
      await Person.create({ name: "Olaf" });
      let persons = await Person.find();
      persons = persons.map(p => {
        delete p.props.guid;
        return p;
      });
      expect(persons).toMatchSnapshot();
    });

    it("should find no persons", async () => {
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Hubert" });
      await Person.create({ name: "Olaf" });
      let persons = await Person.find({ name: "Hanns" });
      expect(persons).toMatchSnapshot();
    });

    it("should find all persons starting with 'O'", async () => {
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Ignatz" });
      await Person.create({ name: "Hubert" });
      await Person.create({ name: "Olga" });
      let persons = await Person.find({ name: { $sw: "O" } });
      expect(persons.length).toEqual(2);
      expect(
        persons.map(p => {
          delete p.props.guid;
          return p;
        })
      ).toMatchSnapshot();
    });
  });

  describe("findOne", () => {
    it("should find first person with name", async () => {
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Hubert" });
      await Person.create({ name: "Olaf" });
      let person = await Person.findOne({ name: "Hubert" });
      if (person) {
        delete person.props.guid;
        expect(person).toMatchSnapshot();
      } else {
        expect(1).toEqual(0);
      }
    });

    it("should find no persons", async () => {
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Hubert" });
      await Person.create({ name: "Olaf" });
      let person = await Person.findOne({ name: "Hanns" });
      expect(person).toMatchSnapshot();
    });

    it("should find all persons starting with 'O'", async () => {
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Ignatz" });
      await Person.create({ name: "Hubert" });
      await Person.create({ name: "Olga" });
      let person = await Person.findOne({ name: { $sw: "Olg" } });
      if (person) {
        delete person.props.guid;
        expect(person).toMatchSnapshot();
      } else {
        expect(1).toEqual(0);
      }
    });
  });

  describe("update", () => {
    it("should update person with name olaf", async () => {
      let p = await Person.create({ name: "Olaf" });
      let persons = await Person.update(p.props, { name: "Hanns" });
      persons = persons.map(p => {
        delete p.props.guid;
        return p;
      });
      expect(persons).toMatchSnapshot();
    });

    it("should update all persons with name olaf", async () => {
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Olaf" });
      await Person.create({ name: "Hubert" });
      await Person.create({ name: "Ignatz" });
      await Person.create({ name: "Olaf" });
      let p = await Person.update({ name: "Olaf" }, { name: "Hanns" });
      p = p.map(p => {
        delete p.props.guid;
        return p;
      });
      expect(p).toMatchSnapshot();
      let persons = await Person.find();
      persons = persons.map(p => {
        delete p.props.guid;
        return p;
      });
      expect(persons).toMatchSnapshot();
    });

    it("should update person with name olaf", async () => {
      let p = await Person.create({ name: "Olaf", age: 20 });
      let persons = await Person.update(p.props, { name: "Hanns", age: 22 });
      persons = persons.map(p => {
        delete p.props.guid;
        return p;
      });
      expect(persons).toMatchSnapshot();
    });
  });
});
