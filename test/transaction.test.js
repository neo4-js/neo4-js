var chai = require('chai');
var expect = chai.expect;

import serverHelper from './server-helper';

import Neo4js from '../src/neo4js';
const Model = Neo4js.Model;

const neo4js = serverHelper.getNeo4jsInstance();

const userSchema = {
  guid: {
    index: true,
    defaultValue: neo4js.uuid4,
  },
  name: {
    unique: true,
    exists: true,
  },
  age: { }
};

describe('Transactions', () => {
  it ('should rollback transaction', () => {
    const User = neo4js.define('Transactions1', userSchema);

    return neo4js.beginTransaction()
      .then(({ run, rollback }) => {
        return User.create({ name: 'Hans' }, run)
          .then((result) => {
            rollback();
          });
      })
      .then(() => {
        User.find({ name: 'Hans' })
          .then((result) => {
            expect(result.length).to.equal(0);
          })
          .catch((err) => {
            expect(err).to.be.null;
          });
      });
  });

  it('should commit transaction', () => {
    const User = neo4js.define('Transactions2', userSchema);

    return neo4js.beginTransaction()
      .then(({ run, commit, rollback }) => {
        return User.create({ name: 'Hans' }, run)
          .then((result) => {
            commit();
          });
      })
      .then(() => {
        User.findOne({ name: 'Hans' })
          .then((result) => {
            expect(result.name).to.equal('Hans');
          })
          .catch((err) => {
            expect(err).to.be.null;
          })
      })
  });
});
