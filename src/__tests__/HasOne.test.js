// @flow

import trineo, { Model, ModelInstance, hasMany, model, hasOne } from '../index';
import idx from 'idx';

type PersonProps = {
  name?: string,
};

type TaskProps = {
  title?: string,
  done?: boolean,
};

class PersonModel extends Model<PersonProps, PersonInstance> {}
const Person: PersonModel = new PersonModel('Person');

class TaskModel extends Model<TaskProps, TaskInstance> { }
const Task: TaskModel = new TaskModel('Task');

@model(Person)
class PersonInstance extends ModelInstance<PersonProps> {
  @hasMany(Task)
  tasks: HasManyActions<TaskProps, TaskInstance, 'manager' | 'assignee'>;
  @hasOne(Person, 'supervisor')
  supervisor: HasOneActions<PersonProps, PersonInstance, 'supervisor'>;
}

@model(Task)
class TaskInstance extends ModelInstance<TaskProps> {
  @hasOne(Person)
  manager: HasOneActions<PersonProps, PersonInstance, 'manager'>;
  @hasOne(Person)
  assignee: HasOneActions<PersonProps, PersonInstance, 'supervisor'>;
}

describe('HasOne', () => {
  beforeAll(() => {
    trineo.init({
      boltUri: 'localhost',
      boltPort: 10001
    });
  });

  beforeEach(async () => {
    await Person.create({ name: 'Olaf' });
    await Person.create({ name: 'Ignatz' });
    await Task.create({ title: 'Learn magic', done: true });
    await Task.create({ title: 'Write more test cases', done: false });
    await Task.create({ title: 'Write more test cases', done: false });
  });

  afterEach(async () => {
    await trineo.run('MATCH (n) DETACH DELETE n');
  });

  afterAll(() => {
    trineo.close();
  });

  describe('create', () => {
    it('should create one supervisor', async () => {
      const paul: PersonInstance = await Person.create({ name: 'Paul' });

      const hubert: PersonInstance = await paul.supervisor.create({ name: 'Hubert' });
      delete hubert.props.guid;
      expect(hubert).toMatchSnapshot();
    });

    it('should delete old supervisor when creating new', async () => {
      const paul: PersonInstance = await Person.create({ name: 'Paul' });

      const hubert: PersonInstance = await paul.supervisor.create({ name: 'Hubert' });
      const olaf: PersonInstance = await paul.supervisor.create({ name: 'Olaf' });

      const result = await trineo.run('MATCH (p:Person)-[:supervisor]->(b:Person) RETURN b');

      expect(result.length).toEqual(1);
      expect(result[0].b).toEqual(olaf.props);
    });

    it('should throw an error when creating a relation without a relation label', async () => {
      const task: TaskInstance = await Task.create({ title: 'Buy milk' });

      try {
        const paul: PersonInstance = await task.assignee.create({ name: 'Paul' });
        expect(1).toEqual(0);
      } catch (err) {
        expect(err).toMatchSnapshot();
      }
    });
  });

  describe('get', () => {
    it('should get created supervisor', async () => {
      const paul: PersonInstance = await Person.create({ name: 'Paul' });

      const hubert: PersonInstance = await paul.supervisor.create({ name: 'Hubert' });
      const hubert2: ?PersonInstance = await paul.supervisor.get();
      expect(hubert.props).toEqual(idx(hubert2, _ => _.props));
    });

    it('should return null when no relation exists', async () => {
      const paul: PersonInstance = await Person.create({ name: 'Paul' });

      const nobody: ?PersonInstance = await paul.supervisor.get();
      expect(nobody).toEqual(null);
    });
  });

  describe('remove', () => {
    it('should remove supervisor', async () => {
      const paul: PersonInstance = await Person.create({ name: 'Paul' });

      const hubert: PersonInstance = await paul.supervisor.create({ name: 'Hubert' });

      let result = await paul.supervisor.remove();
      expect(result).toMatchSnapshot();
      result = await trineo.run('MATCH (a:Person {guid:{guid}}) RETURN a', { guid: hubert.props.guid });
      expect(result).toMatchSnapshot();
    });
  });

  describe('add', () => {
    it('should add created supervisor', async () => {
      const paul: PersonInstance = await Person.create({ name: 'Paul' });
      const olaf: PersonInstance = await Person.create({ name: 'Olaf' });

      const result = await paul.supervisor.add(olaf);
      expect(result).toMatchSnapshot();

      expect(olaf.props).toEqual(idx(await paul.supervisor.get(), _ => _.props));
    });
  });

  describe('hasOne', () => {
    it('should return true', async () => {
      const paul: PersonInstance = await Person.create({ name: 'Paul' });
      await paul.supervisor.create({ name: 'Olaf' });

      const result = await paul.supervisor.hasOne();
      expect(result).toMatchSnapshot();
    });

    it('should return false', async () => {
      const paul: PersonInstance = await Person.create({ name: 'Paul' });
      let result = await paul.supervisor.hasOne();
      expect(result).toEqual(false);

      await paul.supervisor.create({ name: 'Olaf' });

      result = await paul.supervisor.hasOne();
      expect(result).toEqual(true);

      await paul.supervisor.remove();
      result = await paul.supervisor.hasOne();
      expect(result).toEqual(false);
    });
  });

  describe('update', () => {
    it('should update supervisor', async () => {
      const paul: PersonInstance = await Person.create({ name: 'Paul' });
      const olaf: PersonInstance = await paul.supervisor.create({ name: 'Olaf' });

      const ignatz: ?PersonInstance = await paul.supervisor.update({ name: 'Ignatz' });
      if (ignatz) {
        expect(olaf.props.guid).toEqual(ignatz.props.guid);
        delete ignatz.props.guid;
        expect(ignatz).toMatchSnapshot();
      } else {
        expect(1).toEqual(0);
      }
    });
  });
});
