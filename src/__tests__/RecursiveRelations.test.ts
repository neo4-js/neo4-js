import neo4js, {
  Model,
  ModelInstance,
  model,
  relation,
  hasOne,
  hasMany,
  StringProperty,
  NumberProperty,
  HasManyActions,
  HasOneActions,
} from "../index";

type ProjectProps = {
  name: StringProperty;
  level?: NumberProperty;
  parentGuid?: StringProperty;
};

class ProjectModel extends Model<ProjectProps, ProjectInstance> {}
const Project = new ProjectModel("Project");

const ProjectChildRelation = relation
  .from(() => Project)
  .to(() => Project)
  .via("child");

@model(Project)
class ProjectInstance extends ModelInstance<ProjectProps> {
  @hasMany(Project, ProjectChildRelation, "in")
  children: HasManyActions<ProjectProps, ProjectInstance>;

  @hasOne(Project, ProjectChildRelation, "out")
  parent: HasOneActions<ProjectProps, ProjectInstance>;
}

describe("Recursive relations", () => {
  beforeAll(() => {
    neo4js.init({
      boltUri: "localhost",
      boltPort: 10001,
    });
  });

  async function createChildren(projects: ProjectInstance[], level: number) {
    if (level < 5) {
      for (const project of projects) {
        const children = await project.children.create([
          { name: "a", level: level + 1, parentGuid: project.props.guid },
          { name: "b", level: level + 1, parentGuid: project.props.guid },
        ]);

        await createChildren(children, level + 1);
      }
    }
  }

  afterEach(async () => {
    await neo4js.run("MATCH (n) DETACH DELETE n");
  });

  afterAll(() => {
    neo4js.close();
  });

  it("should return only parent", async () => {
    const root = await Project.create({ name: "root", level: 0 });
    await createChildren([root], 0);
    const all = await Project.find();

    for (const p of all) {
      if (p.props.parentGuid) {
        const parent = await p.parent.get();
        if (parent) {
          expect(parent.props.guid).toEqual(p.props.parentGuid);
        } else {
          expect(1).toEqual(0);
        }
      }
    }
  });
});
