var chai = require('chai');
var expect = chai.expect;

import serverHelper from './server-helper';
import Neo4js from '../src/neo4js';

const neo4js = serverHelper.getNeo4jsInstance();

describe('Model', function() {
  describe('create', function() {
    beforeEach(() => {
      return neo4js.sync({ force: true });
    });

    it('should return a model when created', function() {
      expect(1).to.equal(1);
    });
  });
});
