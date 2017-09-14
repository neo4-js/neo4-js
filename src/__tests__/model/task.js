// @flow

import neo4js, {
  Model,
  ModelInstance,
  model,
  relation,
  hasOne,
  hasMany,
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

export const TaskAssigneeRelation = relation
  .from(() => Task)
  .to(() => User)
  .via("assigned");

export const Task: Model<TaskProps, TaskInstance> = new Model("Task");

@model(Task)
export class TaskInstance extends ModelInstance<TaskProps> {
  @hasOne(() => User, () => TaskCreatorRelation)
  creator: HasOneActions<UserProps, UserInstance>;

  @hasOne(() => User, () => TaskAssigneeRelation)
  assignee: HasOneActions<UserProps, UserInstance>;
}
