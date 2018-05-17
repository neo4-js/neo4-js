import neo4js, {
  Model,
  ModelInstance,
  model,
  relation,
  hasMany,
  hasOne,
  HasManyActions,
  HasOneActions,
  StringProperty,
  NumberProperty,
} from "neo4-js";
import { Task, TaskProps, TaskInstance, TaskAssigneeRelation } from "./task";

export type UserProps = {
  name: StringProperty;
  age?: NumberProperty;
};

export const TaskCreatorRelation = relation
  .from(() => Task)
  .to(() => User)
  .via("creator");

export const User: Model<UserProps, UserInstance> = new Model("User");

@model(User)
export class UserInstance extends ModelInstance<UserProps> {
  @hasMany(() => Task, () => TaskCreatorRelation)
  createdTasks: HasManyActions<TaskProps, TaskInstance>;

  @hasMany(() => Task, () => TaskAssigneeRelation)
  tasks: HasManyActions<TaskProps, TaskInstance>;
}
