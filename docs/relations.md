# Relations

In this section we'll have a look at how to define relations and how to use them in our applications. In neo4-js exist two types of relations, HasMany and HasOne relations. With those two relation types you'll be able to create [`m:n`](#mton) and [`1:n`](#oneton) relations.

## HasMany functions

* [`create(props[], relationProps?)`](#hmcreate)
* [`add(instances[], relationProps?)`](#hmadd)
* [`update(props, where?, relationProps?)`](#hmupdate)
* [`get(props?, relationProps?)`](#hmget)
* [`remove(props?, relationProps?)`](#hmremove)
* [`count(props?, relationProps?)`](#hmcount)

## HasOne functions

* [`create(props)`](#hocreate)
* [`add(instance)`](#hoadd)
* [`update(props)`](#houpdate)
* [`get()`](#hoget)
* [`remove()`](#horemove)
* [`hasOne()`](#hocount)

## Defining m:n relations {#mton}

### Example

```js
import { Model, ModelInstance, model, relation, hasMany, hasOne } from "neo4-js";

type UserProps = {
  name?: string,
};

type ProjectProps = {
  title?: string,
};

/**
 * Creating Models
 */
class UserModel extends Model<UserProps, UserInstance> { }
const User: UserModel = new UserModel("User");

class ProjectModel extends Model<ProjectProps, ProjectInstance> { }
const Project: ProjectModel = new ProjectModel("Project");

/**
 * Creating relations
 * Reads like "User assigned to Project"
 */
const UserProjectRelation = relation
  .from(User)
  .to(Project)
  .via("member");

/**
 * Creating the ModelInstances and connecting the properties
 * to the relation. At this point we need to specify if the
 * relation is 1:n or n:m with the hasOne and hasMany decorators.
 */
@model(User)
class UserInstance extends ModelInstance<UserProps> {
  @hasMany(Project, UserProjectRelation)
  projects: HasManyActions<ProjectProps, ProjectInstance>;
}

@model(Project)
class ProjectInstance extends ModelInstance<ProjectProps> {
  @hasMany(User, UserProjectRelation)
  members: HasManyActions<UserProps, UserInstance>;
}

User.create({ name: "Pippi Langstrumpf" })
  .then((user: UserInstance) => {
    return user.projects.create([{ title: "Pippi on the Run" }])
  })
  .then((projects: ProjectInstance[]) => {
    ...
  });
```

## Defining 1:n relations {#oneton}

### Example

```js
import { Model, ModelInstance, model, relation, hasMany, hasOne } from "neo4-js";

type UserProps = {
  name?: string,
};

type ProjectProps = {
  title?: string,
};

/**
 * Creating Models
 */
class UserModel extends Model<UserProps, UserInstance> { }
const User: UserModel = new UserModel("User");

class ProjectModel extends Model<ProjectProps, ProjectInstance> { }
const Project: ProjectModel = new ProjectModel("Project");

/**
 * Creating relations, reads like "User created Project"
 * Whereas the source (User) is able to create many (Project)
 * and the destination (Project) has one creator (User)
 */
const UserProjectRelation = relation
  .from(User)
  .to(Project)
  .via("creator");

/**
 * Creating the ModelInstances and connecting the properties
 * to its relation.
 */
@model(User)
class UserInstance extends ModelInstance<UserProps> {
  @hasMany(() => Project, () => UserProjectRelation)
  createdProjects: HasManyActions<ProjectProps, ProjectInstance>;
}

@model(Project)
class ProjectInstance extends ModelInstance<ProjectProps> {
  @hasOne(User, UserProjectRelation)
  creator: HasOneAction<UserProps, UserInstance>;
}

User.create({ name: "Pippi Langstrumpf" })
  .then((user: UserInstance) => {
    return user.createdProjects.create([{ title: "Pippi on the Run" }])
  })
  .then((project: ProjectInstance) => {
    return project.creator.get();
  })
  .then((pippi: UserInstance) => {
    ...
  });
```

## Working with relation properties {#relationProps}

### Example

```js
import { Model, ModelInstance, model, relation, hasMany, hasOne } from "neo4-js";

type UserProps = {
  name?: string,
};

type ProjectProps = {
  title?: string,
};

/**
 * Creating Models
 */
class UserModel extends Model<UserProps, UserInstance> { }
const User: UserModel = new UserModel("User");

class ProjectModel extends Model<ProjectProps, ProjectInstance> { }
const Project: ProjectModel = new ProjectModel("Project");

/**
 * Creating relations
 */
const UserProjectRelation = relation
  .from(User)
  .to(Project)
  .via("creator");

/**
 * Creating ModelInstances
 */
@model(User)
class UserInstance extends ModelInstance<UserProps> {
  @hasMany(Project, UserProjectRelation)
  createdProjects: HasManyActions<ProjectProps, ProjectInstance>;
}

@model(Project)
class ProjectInstance extends ModelInstance<ProjectProps> {
  @hasOne(User, UserProjectRelation)
  creator: HasOneAction<UserProps, UserInstance>;
}

User.create({ name: "Pippi Langstrumpf" })
  .then((user: UserInstance) => {
    return user.createdProjects.create([{ title: "Pippi on the Run" }], { creationDate: Date.now() })
      .then(() => {
        return user.createdProjects.get({}, { creationDate: { $between: [ Date.now() - 10000, Date.now() ] } });
      });
  })
  .then((projects: ProjectInstance[]) => {
    ...
  });
```
