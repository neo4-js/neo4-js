// @flow

import trineo from "../index";

describe("trineo", () => {
  beforeAll(() => {
    trineo.init({
      boltUri: "localhost",
      boltPort: 10001,
    });
  });

  afterEach(async () => {
    await trineo.run("MATCH (n) DETACH DELETE n");
  });

  afterAll(() => {
    trineo.close();
  });

  it("should create a person", async () => {
    const result = await trineo.run(
      'CREATE (n:Person {name:"Hanns"}) RETURN n'
    );
    expect(result).toMatchSnapshot();
  });

  it("should create a bunch of persons and select them", async () => {
    await trineo.run(
      'CREATE (n:Person {name:"Hanns"}), (p:Person {name:"Huber"})'
    );
    const result = await trineo.run("MATCH (n:Person) RETURN n");
    expect(result).toMatchSnapshot();
  });

  it("should create a person with params", async () => {
    const result = await trineo.run("CREATE (n:Person {p}) RETURN n", {
      p: { name: "Hanns" },
    });
    expect(result).toMatchSnapshot();
  });

  it("should produce an error", async () => {
    try {
      await trineo.run("CREATE");
      expect(1).toEqual(0);
    } catch (err) {
      expect(err).toMatchSnapshot();
    }
  });
});
