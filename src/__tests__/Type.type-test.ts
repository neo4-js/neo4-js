import neo4js, {
  Model,
  ModelInstance,
  model,
  relation,
  hasMany,
  hasOne,
  StringProperty,
  NumberProperty,
  HasManyActions,
  HasOneActions,
} from "../index";

type PersonProps = {
  name: string;
};

type TaskProps = {
  title: string;
  done?: boolean;
};

class PersonModel extends Model<PersonProps, PersonInstance> {}
const Person = new PersonModel("Person");

class TaskModel extends Model<TaskProps, TaskInstance> {}
const Task = new TaskModel("Task");

const TaskCreatorRelation = relation
  .from(() => Person)
  .to(() => Task)
  .via("created");

const TaskAssigneeRelation = relation
  .from(Person)
  .to(Task)
  .via("assigned");

@model(Person)
class PersonInstance extends ModelInstance<PersonProps> {
  @hasMany(Task, TaskCreatorRelation)
  tasks: HasManyActions<TaskProps, TaskInstance>;

  @hasMany(Task, TaskAssigneeRelation)
  assignedTasks: HasManyActions<TaskProps, TaskInstance>;
}

@model(Task)
class TaskInstance extends ModelInstance<TaskProps> {
  @hasOne(() => Person, () => TaskCreatorRelation)
  creator: HasOneActions<PersonProps, PersonInstance>;
}

(async () => {
  const p1 = await Person.create({ name: "Hubert" });

  // Guid should not be optional!
  console.log(p1.props.guid);

  // Should show error
  await Person.create({ name: "Olaf", age: 22 });

  // Should not throw an error
  await Person.find({ name: { $sw: "O" } });

  // Should throw an error (this was possible before, but really shouldn't)
  await Person.create({ name: { $sw: "O" } });

  // Should throw an error
  p1.tasks.create([{}]);

  // Should not throw an error
  p1.tasks.get({ title: { $sw: "T" } });
  p1.tasks.get();
  p1.tasks.remove({ title: { $sw: "T" } });
  p1.tasks.remove();
  p1.tasks.count({ title: { $sw: "T" } });
  p1.tasks.count();
  p1.tasks.update({ done: false }, { title: { $sw: "T" } });
  p1.tasks.update({}, { done: true });

  const t = await Task.create({ title: "Dummy Task" });

  // Should throw
  t.creator.create({});
  t.creator.update({ name: { $sw: "Huber" } });

  // Should not throw
  t.creator.get();
  t.creator.hasOne();
  t.creator.remove();
  t.creator.update({ name: "Huber" });
})();
