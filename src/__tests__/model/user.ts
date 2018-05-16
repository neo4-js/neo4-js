// @flow

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
} from "../../index";
import { Task, TaskProps, TaskInstance, TaskAssigneeRelation } from "./task";

export type UserProps = {
  firstname: StringProperty,
  lastname?: StringProperty,
};

export const TaskCreatorRelation = relation
  .from(() => User)
  .to(() => Task)
  .via("creator");

export const User: Model<UserProps, UserInstance> = new Model("User");

@model(User)
export class UserInstance extends ModelInstance<UserProps> {
  @hasMany(() => Task, () => TaskCreatorRelation)
  createdTasks: HasManyActions<TaskProps, TaskInstance>;

  @hasMany(() => Task, () => TaskAssigneeRelation)
  tasks: HasManyActions<TaskProps, TaskInstance>;
}
