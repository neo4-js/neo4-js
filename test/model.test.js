var chai = require('chai');
var expect = chai.expect;

import serverHelper from './server-helper';
import Neo4js from '../src/neo4js';

const userSchema = {
  guid: {
    index: true,
    defaultValue: Neo4js.uuid4,
  },
  name: {
    unique: true,
    exists: true,
  },
};
let neo4js;
let User;

describe('Model', function() {
  describe('create', function() {
    beforeEach(() => {
      neo4js = serverHelper.getNeo4jsInstance();
      User = neo4js.define('User', userSchema);
      return neo4js.sync({ force: true });
    });

    it('should return a user when create called', function() {
      return User.create({ name: 'Jan' })
        .then(user => {
          expect(user).to.have.keys(['guid', 'name']);
        })
        .catch(err => {
          expect(err).to.be.null;
        })
    });
  });
});
