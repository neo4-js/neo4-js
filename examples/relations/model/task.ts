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
import { User, UserProps, UserInstance, TaskCreatorRelation } from "./user";

export type TaskProps = {
  title?: StringProperty;
  done?: boolean;
};

export const TaskAssigneeRelation = relation
  .from(() => User)
  .to(() => Task)
  .via("assigned");

export const Task: Model<TaskProps, TaskInstance> = new Model("Task");

@model(Task)
export class TaskInstance extends ModelInstance<TaskProps> {
  @hasOne(() => User, () => TaskCreatorRelation)
  creator: HasOneActions<UserProps, UserInstance>;

  @hasMany(() => User, () => TaskAssigneeRelation)
  assignee: HasOneActions<UserProps, UserInstance>;
}
