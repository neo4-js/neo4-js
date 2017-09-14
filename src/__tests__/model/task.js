// @flow

import neo4js, {
  Model,
  ModelInstance,
  model,
  dest,
  relation,
  src,
} from "../../index";
import type {
  StringProperty,
  NumberProperty,
  HasManyActions,
  HasOneActions,
} from "../../index";
import { User, UserInstance, TaskCreatorRelation } from "./user";
import type { UserProps } from "./user";

export type TaskProps = {
  title?: StringProperty,
  done?: boolean,
};

export const TaskAssigneeRelation = relation("assigned")
  .src.hasOne(() => User)
  .dest.hasMany(() => Task);

export const Task: Model<TaskProps, TaskInstance> = new Model("Task");

@model(Task)
export class TaskInstance extends ModelInstance<TaskProps> {
  @dest(() => TaskCreatorRelation)
  creator: HasOneActions<UserProps, UserInstance>;

  @src(() => TaskAssigneeRelation)
  assignee: HasOneActions<UserProps, UserInstance>;
}
