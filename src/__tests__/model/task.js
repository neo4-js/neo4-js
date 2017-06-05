// @flow

import neo4js, { Model, ModelInstance, model, hasOne } from "../../index";
import { UserInstance } from "./index";
import type { UserProps } from "./index";

export type TaskProps = {
  title?: StringProperty,
  done?: boolean,
};

export const Task: Model<TaskProps, TaskInstance> = new Model("Task");

@model("Task")
export class TaskInstance extends ModelInstance<TaskProps> {
  @hasOne("User", "created")
  creator: HasOneActions<UserProps, UserInstance>;
}
