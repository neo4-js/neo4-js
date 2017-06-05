// @flow

import neo4js, {
  Model,
  ModelInstance,
  model,
  relation,
  src,
  dest,
} from "../../index";
import { TaskInstance, TaskAssigneeRelation } from "./task";
import type { TaskProps } from "./task";

export type UserProps = {
  firstname?: StringProperty,
  lastname?: StringProperty,
};

export const User: Model<UserProps, UserInstance> = new Model("User");

export const TaskCreatorRelation = relation("creator").src
  .hasMany("Task")
  .dest.hasOne("User");

@model(User)
export class UserInstance extends ModelInstance<UserProps> {
  @src(() => TaskCreatorRelation)
  createdTasks: HasManyActions<TaskProps, TaskInstance>;

  @dest(() => TaskAssigneeRelation)
  tasks: HasManyActions<TaskProps, TaskInstance>;
}
