import { Model, ModelInstance, StringProperty, NumberProperty } from "neo4-js";

export type UserProps = {
  name: StringProperty;
  age?: NumberProperty;
};

class UserModel extends Model<UserProps, UserInstance> {}
export const User = new UserModel("User");
export class UserInstance extends ModelInstance<UserProps> {}

export type TodoProps = {
  description: StringProperty;
  done?: boolean;
};

class TodoModel extends Model<TodoProps, TodoInstance> {}
export const Todo = new TodoModel("Todo");
export class TodoInstance extends ModelInstance<TodoProps> {}
