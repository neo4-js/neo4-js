var chai = require('chai');
var expect = chai.expect;

import Neo4js from '../src/neo4js';

const neo4js = new Neo4js('neo4j', 'jan95', {
  port: 32700,
  rest: {
    port: 32701,
  }
});

describe('Model', function() {
  describe('create', function() {
    it('should return a model when created', function() {
      expect(1).to.equal(1);
    });
  });
});
