// @flow

import neo4js, {
  Model,
  ModelInstance,
  model,
  relation,
  src,
  dest,
} from "neo4-js";
import { Task, TaskInstance, TaskAssigneeRelation } from "./task";
import type { TaskProps } from "./task";

export type UserProps = {
  firstname?: StringProperty,
  lastname?: StringProperty,
};

export const TaskCreatorRelation = relation("creator").src
  .hasMany(() => Task)
  .dest.hasOne(() => User);

export const User: Model<UserProps, UserInstance> = new Model("User");

@model(User)
export class UserInstance extends ModelInstance<UserProps> {
  @src(() => TaskCreatorRelation)
  createdTasks: HasManyActions<TaskProps, TaskInstance>;

  @dest(() => TaskAssigneeRelation)
  tasks: HasManyActions<TaskProps, TaskInstance>;
}
