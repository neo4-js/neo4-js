import neo4js, {
  Model,
  ModelInstance,
  model,
  dest,
  relation,
  src,
} from "neo4-js";
import { User, UserInstance, TaskCreatorRelation } from "./user";

export const TaskAssigneeRelation = relation("assigned").src
  .hasOne(() => User)
  .dest.hasMany(() => Task);

export const Task = new Model("Task");

@model(Task)
export class TaskInstance extends ModelInstance {
  @dest(() => TaskCreatorRelation)
  creator;

  @src(() => TaskAssigneeRelation)
  assignee;
}
