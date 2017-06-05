// @flow

import neo4js, { Model, ModelInstance, model, hasMany } from "../../index";
import { TaskInstance } from "./index";
import type { TaskProps } from "./index";

export type UserProps = {
  firstname?: StringProperty,
  lastname?: StringProperty,
};

export const User: Model<UserProps, UserInstance> = new Model("User");

@model("User")
export class UserInstance extends ModelInstance<UserProps> {
  @hasMany("Task", "created")
  tasks: HasManyActions<TaskProps, TaskInstance>;
}
