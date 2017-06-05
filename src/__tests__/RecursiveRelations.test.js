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

type ProjectProps = {
  name?: StringProperty,
  level?: NumberProperty,
  parentGuid?: StringProperty,
};

class ProjectModel extends Model<ProjectProps, ProjectInstance> {}
const Project = new ProjectModel("Project");

const ProjectChildRelation = relation("child").src
  .hasMany("Project")
  .dest.hasOne("Project");

@model(Project)
class ProjectInstance extends ModelInstance<ProjectProps> {
  @src(ProjectChildRelation)
  children: HasManyActions<ProjectProps, ProjectInstance>;

  @dest(ProjectChildRelation)
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
    const root = await Project.create({ level: 0 });
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
