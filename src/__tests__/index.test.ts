import neo4js from "../index";

describe("neo4js", () => {
  beforeAll(() => {
    neo4js.init({
      boltUri: "localhost",
      boltPort: 10006,
    });
  });

  afterEach(async () => {
    await neo4js.run("MATCH (n) DETACH DELETE n");
  });

  afterAll(() => {
    neo4js.close();
  });

  it("should create a person", async () => {
    const result = await neo4js.run(
      'CREATE (n:Person {name:"Hanns"}) RETURN n'
    );
    expect(result).toMatchSnapshot();
  });

  it("should create a bunch of persons and select them", async () => {
    await neo4js.run(
      'CREATE (n:Person {name:"Hanns"}), (p:Person {name:"Huber"})'
    );
    const result = await neo4js.run("MATCH (n:Person) RETURN n");
    expect(result).toMatchSnapshot();
  });

  it("should create a person with params", async () => {
    const result = await neo4js.run("CREATE (n:Person {p}) RETURN n", {
      p: { name: "Hanns" },
    });
    expect(result).toMatchSnapshot();
  });

  it("should produce an error", async () => {
    try {
      await neo4js.run("CREATE");
      expect(1).toEqual(0);
    } catch (err) {
      expect(err).toMatchSnapshot();
    }
  });
});
