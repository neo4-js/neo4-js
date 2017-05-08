// @flow

import trineo, { Model, ModelInstance } from '../index';
import idx from 'idx';

type Props = {
  name?: string,
  age?: number,
};

class PersonInstance extends ModelInstance<Props> { }
class PersonModel extends Model<Props, PersonInstance> { }
let Person = new PersonModel('Person');

type TaskProps = {
  title: string,
  done?: boolean,
};

class TaskInstance extends ModelInstance<TaskProps> { }
class TaskModel extends Model<TaskProps, TaskInstance> {
  afterFind(t: TaskInstance): TaskInstance {
    delete t.props.guid;
    t.props.done = t.props.done || false;
    return t;
  }
}
let Task = new TaskModel('Task');

describe('Hooks', () => {
  beforeAll(() => {
    trineo.init({
      boltUri: 'localhost',
      boltPort: 10001
    });
  });

  beforeEach(() => {
    Person = new PersonModel('Person');
    Task = new TaskModel('Task');
  });

  afterEach(async () => {
    await trineo.run('MATCH (n) DETACH DELETE n');
  });

  afterAll(() => {
    trineo.close();
  });

  describe('create', () => {
    it('should call before create hook once', async () => {
      // $FlowFixMe
      Person.beforeCreate = jest.fn().mockImplementationOnce((t) => t);
      const paul = await Person.create({ name: 'Paul', age: 21 });
      expect(Person.beforeCreate).toHaveBeenCalledTimes(1);
    });

    it('should call before create hook once and change props', async () => {
      // $FlowFixMe
      Person.beforeCreate = (t: Props): Props => ({ ...t, age: t.age + 1 });
      const paul = await Person.create({ name: 'Paul', age: 21 });
      expect(paul.props.age).toEqual(22);
    });

    it('should call before create hook once', async () => {
      // $FlowFixMe
      Person.afterCreate = jest.fn().mockImplementationOnce((t) => t);
      const paul = await Person.create({ name: 'Paul', age: 21 });
      expect(Person.afterCreate).toHaveBeenCalledTimes(1);
    });

    it('should call after create hook once and change props of instance', async () => {
      // $FlowFixMe
      Person.afterCreate = (t: PersonInstance) => {
        delete t.props.guid;
        return t;
      };
      const paul = await Person.create({ name: 'Paul', age: 21 });
      expect(paul).toMatchSnapshot();
    });
  });

  describe('find', () => {
    it('should call before find hook once', async () => {
      // $FlowFixMe
      Person.beforeFind = jest.fn().mockImplementationOnce((t) => t);
      await Person.find();
      expect(Person.beforeFind).toHaveBeenCalledTimes(1);
    });

    it('should call before find hook once and change props', async () => {
      // $FlowFixMe
      Task.beforeFind = (p: TaskProps) => ({ ...p, done: true });
      await Task.create({ title: 'Buy milk' });
      await Task.create({ title: 'Read a book', done: true });
      const tasks = await Task.find();
      expect(tasks).toMatchSnapshot();
    });

    it('should call after find hook twice', async () => {
      // $FlowFixMe
      Person.afterFind = jest.fn().mockImplementation((t) => t);
      await Person.create({ name: 'Hanns' });
      await Person.create({ name: 'Olaf' });
      await Person.find();
      expect(Person.afterFind).toHaveBeenCalledTimes(2);
    });

    it('should call after find hook twice and change props of instances', async () => {
      await Task.create({ title: 'Buy milk' });
      await Task.create({ title: 'Read a book' });
      const tasks = await Task.find();
      expect(tasks).toMatchSnapshot();
    });
  });

  describe('update', () => {
    it('should call before update hook once', async () => {
      // $FlowFixMe
      Person.beforeUpdate = jest.fn().mockImplementationOnce((props, newProps) => ({ props, newProps }));
      await Person.create({ name: 'Hanns', age: 20 });
      await Person.update({ name: 'Hanns' }, { age: 21 });
      expect(Person.beforeUpdate).toHaveBeenCalledTimes(1);
    });

    it('should call before find hook once and change props', async () => {
      // $FlowFixMe
      Person.beforeUpdate = (props: Props, newProps: Props) => {
        newProps.age += 1;
        return { props, newProps };
      };
      await Person.create({ name: 'Hanns', age: 20 });
      const p = (await Person.update({ name: 'Hanns' }, { age: 21 }))[0];
      expect(idx(p, _ => _.props.age)).toEqual(22);
    });

    it('should call after find hook twice', async () => {
      // $FlowFixMe
      Person.afterUpdate = jest.fn().mockImplementation((t) => t);
      await Person.create({ name: 'Hanns' });
      await Person.create({ name: 'Olaf' });
      await Person.update({ name: 'Hanns' }, { age: 20 });
      expect(Person.afterUpdate).toHaveBeenCalledTimes(1);
    });

    // it('should call after find hook twice and change props of instances', async () => {
    //   await Task.create({ title: 'Buy milk' });
    //   await Task.create({ title: 'Read a book' });
    //   const tasks = await Task.find();
    //   expect(tasks).toMatchSnapshot();
    // });
  });
});
