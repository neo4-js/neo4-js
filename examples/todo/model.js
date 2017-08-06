// @flow

import { Model, ModelInstance, } from 'neo4-js';

class UserModel extends Model<UserProps, UserInstance> { }
export const User: UserModel = new UserModel("User");
export class UserInstance extends ModelInstance<UserProps> { }

class TodoModel extends Model<TodoProps, TodoInstance> { }
export const Todo: TodoModel = new TodoModel("Todo");
export class TodoInstance extends ModelInstance<TodoProps> { }
