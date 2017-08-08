import neo4js, {
  Model,
  ModelInstance,
  model,
  relation,
  src,
  dest,
} from "neo4-js";
import { Task, TaskInstance, TaskAssigneeRelation } from "./task";

export const TaskCreatorRelation = relation("creator").src
  .hasMany(() => Task)
  .dest.hasOne(() => User);

export const User = new Model("User");

@model(User)
export class UserInstance extends ModelInstance {
  @src(() => TaskCreatorRelation)
  createdTasks;

  @dest(() => TaskAssigneeRelation)
  tasks;
}
